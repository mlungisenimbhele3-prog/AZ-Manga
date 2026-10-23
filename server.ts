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
    // Content-Security-Policy (Allowing Supabase, Firebase, Google Play / AdMob, and Fonts)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.googlesyndication.com https://*.google.com https://*.ai.studio; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.googlesyndication.com https://*.run.app https://*.ai.studio; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.ai.studio; frame-ancestors 'self' https://*.google.com https://*.run.app https://*.ai.studio;"
    );
    next();
  });

  // DEFENSE 3: Body parsing limit (Supports cover uploads)
  app.use(express.json({ limit: '10mb' }));
  
  // Serve public/covers directory statically
  const coversStaticPath = path.join(process.cwd(), 'public', 'covers');
  app.use('/covers', express.static(coversStaticPath));
  
  // Rate limiting with IPv6 subnet handling and proxy normalization
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
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

  // API routes

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
      fs.writeFileSync(filePath, buffer);

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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
