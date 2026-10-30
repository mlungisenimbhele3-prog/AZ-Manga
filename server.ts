import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust first hop (the proxy)

  // DEFENSE 1: Hardened HTTP Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Content-Security-Policy (Allowing PWA Service Worker, Manifest, Supabase, Firebase, Google Play / AdMob, and Fonts)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; manifest-src 'self'; worker-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.googlesyndication.com https://*.google.com https://*.ai.studio; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.googlesyndication.com https://*.run.app https://*.ai.studio https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.ai.studio; frame-ancestors 'self' https://*.google.com https://*.run.app https://*.ai.studio;"
    );
    next();
  });

  // DEFENSE 3: Body parsing limit (Supports cover uploads) + graceful malformed JSON shield
  app.use(express.json({ limit: '10mb' }));
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON request payload' });
    }
    return next(err);
  });

  // Serve public/covers directory statically with caching
  const coversStaticPath = path.join(process.cwd(), 'public', 'covers');
  app.use(
    '/covers',
    express.static(coversStaticPath, {
      maxAge: '7d',
      etag: true,
    })
  );

  // Rate limiting with IPv6 subnet handling and proxy normalization
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;
      return ipKeyGenerator(rawIp || '127.0.0.1');
    },
    validate: { xForwardedForHeader: false },
  });
  app.use('/api/', limiter);

  // DEFENSE 4: Input Validation Middleware
  const validateApiPayload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      if (/<script\b|javascript:|UNION\s+SELECT/i.test(bodyStr)) {
        return res.status(400).json({ error: 'Malicious payload pattern detected by Defense Shield' });
      }
    }
    next();
  };
  app.use('/api/', validateApiPayload);

  const PORT = 3000;

  // Lightweight health check endpoint
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Direct download route for signed Google Play Store Android App Bundle (AZ-OVERVERSE-signed.aab)
  const serveSignedAab = async (_req: express.Request, res: express.Response) => {
    const fs = await import('fs');
    const aabPath = path.join(process.cwd(), 'AZ-OVERVERSE-signed.aab');
    if (!fs.existsSync(aabPath)) {
      return res.status(404).json({ error: 'AZ-OVERVERSE-signed.aab not found on server' });
    }
    const stat = await fs.promises.stat(aabPath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="AZ-OVERVERSE-signed.aab"');
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(aabPath).pipe(res);
  };

  app.get('/AZ-OVERVERSE-signed.aab', serveSignedAab);
  app.get('/api/download-aab', serveSignedAab);

  // Verify Google ID Token from Android CredentialManager (signInToOververseWithToken)
  const FIREBASE_WEB_CLIENT_ID =
    process.env.GOOGLE_WEB_CLIENT_ID ||
    '197009931605-p16sjppjk069g41lt740g920k9cb9m8s.apps.googleusercontent.com';

  app.post('/api/auth/google', async (req, res) => {
    try {
      const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
      if (!idToken || idToken.length < 40) {
        return res.status(400).json({ error: 'Missing or invalid Google ID token' });
      }

      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
      if (!verifyRes.ok) {
        return res.status(401).json({ error: 'Google ID token verification failed' });
      }

      const claims = (await verifyRes.json()) as Record<string, unknown>;
      const aud = String(claims.aud || '');
      const iss = String(claims.iss || '');
      if (
        aud !== FIREBASE_WEB_CLIENT_ID ||
        (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com')
      ) {
        return res.status(401).json({ error: 'Invalid Google ID token audience or issuer' });
      }

      return res.json({
        success: true,
        verified: true,
        uid: String(claims.sub || ''),
        email: String(claims.email || ''),
        emailVerified: claims.email_verified === true || claims.email_verified === 'true',
        name: String(claims.name || ''),
        picture: String(claims.picture || ''),
      });
    } catch (err: any) {
      console.error('[OVERVERSE Auth] Token verification error:', err);
      return res.status(500).json({ error: 'Failed to verify Google ID token' });
    }
  });

  // Upload Cover Image endpoint (persists in public/covers and returns real https URL)
  app.post("/api/upload-cover", async (req, res) => {
    try {
      const { fileData, fileName } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      // Strip potential base64 prefix
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const ext = (fileName && path.extname(fileName)) || '.png';
      const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.png';
      const safeFileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const coversDir = path.join(process.cwd(), 'public', 'covers');
      
      const fs = await import('fs');
      if (!fs.existsSync(coversDir)) {
        fs.mkdirSync(coversDir, { recursive: true });
      }
      
      const filePath = path.join(coversDir, safeFileName);
      await fs.promises.writeFile(filePath, buffer);

      // Return a real absolute HTTPS URL
      const host = req.get('host') || 'localhost:3000';
      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol = (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol) || 'https';
      
      let appUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, '');
      if (appUrl.startsWith('http://') && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
        appUrl = appUrl.replace(/^http:\/\//, 'https://');
      } else if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
        appUrl = `https://${appUrl}`;
      }
      const coverUrl = `${appUrl}/covers/${safeFileName}`;

      res.json({
        success: true,
        url: coverUrl,
        fileName: safeFileName,
      });
    } catch (err: any) {
      console.error("Cover upload error:", err);
      res.status(500).json({ error: err.message || "Failed to process cover image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        etag: true,
        setHeaders: (res, filePath) => {
          const normalized = filePath.replace(/\\/g, '/');
          if (normalized.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (
            normalized.endsWith('/sw.js') ||
            normalized.endsWith('/manifest.json') ||
            normalized.endsWith('/index.html')
          ) {
            res.setHeader('Cache-Control', 'no-cache');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
