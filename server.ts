import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authRouter } from './src/server/authRoutes.ts';
import { creatorRouter } from './src/server/creatorRoutes.ts';
import { catalogRouter } from './src/server/catalogRoutes.ts';
import { verifyPurposeToken } from './src/server/jwt.ts';
import { pingDatabaseWithRetry } from './src/db/index.ts';

const SUSPICIOUS_PAYLOAD_REGEX = /<script\b|javascript:|UNION\s+SELECT/i;
const BINARY_SKIP_KEYS = new Set(['fileData', 'imageBase64', 'avatarData']);
const ALLOWED_COVER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const MAX_DECODED_COVER_BYTES = 8 * 1024 * 1024; // 8 MB decoded binary limit

function hasSuspiciousPayloadPattern(value: unknown, depth = 0): boolean {
  if (depth > 8 || value === null || value === undefined) return false;

  if (typeof value === 'string') {
    // Bound inspection slice so huge strings never stall the Node event loop
    const sample = value.length > 16384 ? value.slice(0, 16384) : value;
    return SUSPICIOUS_PAYLOAD_REGEX.test(sample);
  }

  if (Array.isArray(value)) {
    const limit = Math.min(value.length, 200);
    for (let i = 0; i < limit; i++) {
      if (hasSuspiciousPayloadPattern(value[i], depth + 1)) return true;
    }
    return false;
  }

  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SUSPICIOUS_PAYLOAD_REGEX.test(key)) return true;
      if (BINARY_SKIP_KEYS.has(key)) continue;
      if (hasSuspiciousPayloadPattern(entry, depth + 1)) return true;
    }
  }

  return false;
}

process.on('unhandledRejection', (reason) => {
  console.error('[Server Stability] Unhandled Promise Rejection:', reason);
});

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Trust first hop (the proxy)

  // DEFENSE 1: Hardened HTTP Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; manifest-src 'self'; worker-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googlesyndication.com https://*.google.com https://*.ai.studio; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googlesyndication.com https://*.run.app https://*.ai.studio https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.ai.studio; frame-ancestors 'self' https://*.google.com https://*.run.app https://*.ai.studio;"
    );
    next();
  });

  // Lightweight async HTTP Gzip/Brotli compression for API JSON & text responses (>= 1 KB)
  app.use((req, res, next) => {
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (!acceptEncoding || req.method === 'HEAD') {
      return next();
    }

    const supportsGzip = /\bgzip\b/i.test(acceptEncoding);
    const supportsBr = /\bbr\b/i.test(acceptEncoding);
    if (!supportsGzip && !supportsBr) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
      if (res.headersSent || res.getHeader('Content-Encoding')) {
        return originalJson(body);
      }
      const serialized = JSON.stringify(body);
      if (!serialized || Buffer.byteLength(serialized, 'utf8') < 1024) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.send(serialized);
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Vary', 'Accept-Encoding');

      const rawBuf = Buffer.from(serialized, 'utf8');
      if (supportsBr) {
        zlib.brotliCompress(
          rawBuf,
          { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } },
          (err, compressed) => {
            if (err || res.headersSent) {
              if (!res.headersSent) res.send(rawBuf);
              return;
            }
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Content-Length', String(compressed.length));
            res.end(compressed);
          }
        );
        return res;
      }

      zlib.gzip(rawBuf, { level: zlib.constants.Z_BEST_SPEED }, (err, compressed) => {
        if (err || res.headersSent) {
          if (!res.headersSent) res.send(rawBuf);
          return;
        }
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', String(compressed.length));
        res.end(compressed);
      });
      return res;
    }) as typeof res.json;

    next();
  });

  // Cookie parser for httpOnly refreshToken cookies + JSON body parsing
  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON request payload' });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request payload exceeds maximum 25MB limit' });
    }
    return next(err);
  });

  // Serve public/covers directory statically with strong caching
  const coversStaticPath = path.join(process.cwd(), 'public', 'covers');
  app.use(
    '/covers',
    express.static(coversStaticPath, {
      maxAge: '7d',
      etag: true,
      immutable: false,
    })
  );

  // Rate limiting with IPv6 subnet handling and proxy normalization
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
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

  // DEFENSE 4: Zero-Serialization Input Validation Middleware (never blocks event loop on large image uploads)
  const validateApiPayload = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body && typeof req.body === 'object' && hasSuspiciousPayloadPattern(req.body)) {
      return res
        .status(400)
        .json({ error: 'Malicious payload pattern detected by Defense Shield' });
    }
    next();
  };
  app.use('/api/', validateApiPayload);

  const PORT = 3000;

  // Admin-only authorization guard for Google Play signing assets (upload-keystore.jks & upload_certificate.pem)
  const ADMIN_MASTER_EMAIL = 'mlungisenimbhele3@gmail.com';
  const requireAdminSigningAccess = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // 1. Check Bearer JWT access token
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const claims = verifyPurposeToken(token, 'access');
        if (
          claims.email?.toLowerCase() === ADMIN_MASTER_EMAIL ||
          claims.role === 'admin'
        ) {
          return next();
        }
      } catch {
        // Fall through to refresh cookie / master key check
      }
    }

    // 2. Check httpOnly refreshToken cookie
    const refreshCookie = req.cookies?.refreshToken;
    if (typeof refreshCookie === 'string' && refreshCookie.length > 0) {
      try {
        const claims = verifyPurposeToken(refreshCookie, 'refresh');
        if (claims.email?.toLowerCase() === ADMIN_MASTER_EMAIL) {
          return next();
        }
      } catch {
        // Fall through to master password header check
      }
    }

    // 3. Check verified Master Admin Password header
    const adminPassHeader = req.headers['x-az-admin-pass'];
    const expectedPass = process.env.ADMIN_MASTER_PASSWORD || 'OVER2026!';
    if (typeof adminPassHeader === 'string' && adminPassHeader === expectedPass) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden: Only Admin (mlungisenimbhele3@gmail.com) can access Google Play signing keys.',
    });
  };

  // Direct download routes for Google Play Upload Certificate (upload_certificate.pem) & Keystore (upload-keystore.jks)
  const serveUploadCertificatePem = async (_req: express.Request, res: express.Response) => {
    try {
      const certPath = path.join(process.cwd(), 'upload_certificate.pem');
      if (!fs.existsSync(certPath)) {
        return res.status(404).json({ error: 'upload_certificate.pem not found on server' });
      }
      const stat = await fs.promises.stat(certPath);
      res.setHeader('Content-Type', 'application/x-pem-file; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="upload_certificate.pem"');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Cache-Control', 'no-store');
      const content = await fs.promises.readFile(certPath);
      res.end(content);
    } catch (err) {
      console.error('Failed to serve upload_certificate.pem:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download upload_certificate.pem' });
      }
    }
  };

  const serveUploadKeystoreJks = async (_req: express.Request, res: express.Response) => {
    try {
      const primaryPath = path.join(process.cwd(), 'upload-keystore.jks');
      const fallbackPath = path.join(process.cwd(), 'android', 'app', 'upload-keystore.jks');
      const jksPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;
      if (!fs.existsSync(jksPath)) {
        return res.status(404).json({ error: 'upload-keystore.jks not found on server' });
      }
      const stat = await fs.promises.stat(jksPath);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="upload-keystore.jks"');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Cache-Control', 'no-store');
      const content = await fs.promises.readFile(jksPath);
      res.end(content);
    } catch (err) {
      console.error('Failed to serve upload-keystore.jks:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download upload-keystore.jks' });
      }
    }
  };

  app.get('/upload_certificate.pem', requireAdminSigningAccess, serveUploadCertificatePem);
  app.get('/api/download-upload-certificate', requireAdminSigningAccess, serveUploadCertificatePem);
  app.get('/upload-keystore.jks', requireAdminSigningAccess, serveUploadKeystoreJks);
  app.get('/api/download-upload-keystore', requireAdminSigningAccess, serveUploadKeystoreJks);

  // Health & Neon DB Wake endpoint: pings database to wake autosuspended compute
  app.get('/api/health', async (_req, res) => {
    try {
      await pingDatabaseWithRetry();
      return res.status(200).json({ db: "connected" });
    } catch (error: any) {
      console.error('[Health Check] Neon wake-up error:', error);
      return res.status(503).json({
        db: "error",
        error: error?.message || 'Database wake timeout',
      });
    }
  });

  // AZ OVERVERSE Custom Production Auth System (PostgreSQL + bcrypt 12 + JWT 15m/7d + Resend + Zod)
  app.use('/api/auth', authRouter);

  // AZ OVERVERSE Creator Studio & Monetization API (Role-gated to Creator/Admin + Neon Postgres)
  app.use('/api/creator', creatorRouter);

  // AZ OVERVERSE Public Catalog, Views, Issues, Awards & Real Social Counts API
  app.use('/api/catalog', catalogRouter);

  // Upload Cover Image endpoint (persists in public/covers and returns real https URL)
  app.post("/api/upload-cover", async (req, res) => {
    try {
      const { fileData, fileName } = req.body || {};
      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ error: "No image data provided" });
      }

      if (fileData.startsWith('data:') && !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(fileData)) {
        return res.status(400).json({ error: "Unsupported image format" });
      }

      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0 || buffer.length > MAX_DECODED_COVER_BYTES) {
        return res.status(413).json({ error: "Cover image must be under 8MB" });
      }

      const rawExt = (typeof fileName === 'string' && path.extname(fileName).toLowerCase()) || '.png';
      const cleanExt = ALLOWED_COVER_EXTENSIONS.has(rawExt) ? rawExt : '.png';
      const safeFileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const coversDir = path.join(process.cwd(), 'public', 'covers');

      await fs.promises.mkdir(coversDir, { recursive: true });

      const filePath = path.join(coversDir, safeFileName);
      await fs.promises.writeFile(filePath, buffer);

      const host = req.get('host') || 'localhost:3000';
      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol =
        (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol) ||
        'https';

      let appUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, '');
      if (
        appUrl.startsWith('http://') &&
        !appUrl.includes('localhost') &&
        !appUrl.includes('127.0.0.1')
      ) {
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

  // Global Express error boundary so uncaught route errors never hang connections
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error Boundary]:', err);
    if (!res.headersSent) {
      res.status(err?.status || 500).json({
        error: 'Internal server error',
      });
    }
  });

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Tune HTTP keep-alive above reverse-proxy idle timeout (60s) to prevent reset races
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;
}

startServer();

