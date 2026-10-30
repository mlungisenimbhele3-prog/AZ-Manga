var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
async function startServer() {
  const app = (0, import_express.default)();
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; manifest-src 'self'; worker-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.googlesyndication.com https://*.google.com https://*.ai.studio; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.googlesyndication.com https://*.run.app https://*.ai.studio https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.ai.studio; frame-ancestors 'self' https://*.google.com https://*.run.app https://*.ai.studio;"
    );
    next();
  });
  app.use(import_express.default.json({ limit: "10mb" }));
  app.use((err, _req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON request payload" });
    }
    return next(err);
  });
  const coversStaticPath = import_path.default.join(process.cwd(), "public", "covers");
  app.use(
    "/covers",
    import_express.default.static(coversStaticPath, {
      maxAge: "7d",
      etag: true
    })
  );
  const limiter = (0, import_express_rate_limit.default)({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 150,
    // limit each IP per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"];
      const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip;
      return (0, import_express_rate_limit.ipKeyGenerator)(rawIp || "127.0.0.1");
    },
    validate: { xForwardedForHeader: false }
  });
  app.use("/api/", limiter);
  const validateApiPayload = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      const bodyStr = JSON.stringify(req.body);
      if (/<script\b|javascript:|UNION\s+SELECT/i.test(bodyStr)) {
        return res.status(400).json({ error: "Malicious payload pattern detected by Defense Shield" });
      }
    }
    next();
  };
  app.use("/api/", validateApiPayload);
  const PORT = 3e3;
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ status: "ok", timestamp: Date.now() });
  });
  const serveSignedAab = async (_req, res) => {
    const fs = await import("fs");
    const aabPath = import_path.default.join(process.cwd(), "AZ-OVERVERSE-signed.aab");
    if (!fs.existsSync(aabPath)) {
      return res.status(404).json({ error: "AZ-OVERVERSE-signed.aab not found on server" });
    }
    const stat = await fs.promises.stat(aabPath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", 'attachment; filename="AZ-OVERVERSE-signed.aab"');
    res.setHeader("Content-Length", String(stat.size));
    res.setHeader("Cache-Control", "no-store");
    fs.createReadStream(aabPath).pipe(res);
  };
  app.get("/AZ-OVERVERSE-signed.aab", serveSignedAab);
  app.get("/api/download-aab", serveSignedAab);
  const FIREBASE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || "197009931605-p16sjppjk069g41lt740g920k9cb9m8s.apps.googleusercontent.com";
  app.post("/api/auth/google", async (req, res) => {
    try {
      const idToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
      if (!idToken || idToken.length < 40) {
        return res.status(400).json({ error: "Missing or invalid Google ID token" });
      }
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
      if (!verifyRes.ok) {
        return res.status(401).json({ error: "Google ID token verification failed" });
      }
      const claims = await verifyRes.json();
      const aud = String(claims.aud || "");
      const iss = String(claims.iss || "");
      if (aud !== FIREBASE_WEB_CLIENT_ID || iss !== "https://accounts.google.com" && iss !== "accounts.google.com") {
        return res.status(401).json({ error: "Invalid Google ID token audience or issuer" });
      }
      return res.json({
        success: true,
        verified: true,
        uid: String(claims.sub || ""),
        email: String(claims.email || ""),
        emailVerified: claims.email_verified === true || claims.email_verified === "true",
        name: String(claims.name || ""),
        picture: String(claims.picture || "")
      });
    } catch (err) {
      console.error("[OVERVERSE Auth] Token verification error:", err);
      return res.status(500).json({ error: "Failed to verify Google ID token" });
    }
  });
  app.post("/api/upload-cover", async (req, res) => {
    try {
      const { fileData, fileName } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "No image data provided" });
      }
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = fileName && import_path.default.extname(fileName) || ".png";
      const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase() || ".png";
      const safeFileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const coversDir = import_path.default.join(process.cwd(), "public", "covers");
      const fs = await import("fs");
      if (!fs.existsSync(coversDir)) {
        fs.mkdirSync(coversDir, { recursive: true });
      }
      const filePath = import_path.default.join(coversDir, safeFileName);
      await fs.promises.writeFile(filePath, buffer);
      const host = req.get("host") || "localhost:3000";
      const forwardedProto = req.headers["x-forwarded-proto"];
      const protocol = (typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol) || "https";
      let appUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, "");
      if (appUrl.startsWith("http://") && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
        appUrl = appUrl.replace(/^http:\/\//, "https://");
      } else if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://")) {
        appUrl = `https://${appUrl}`;
      }
      const coverUrl = `${appUrl}/covers/${safeFileName}`;
      res.json({
        success: true,
        url: coverUrl,
        fileName: safeFileName
      });
    } catch (err) {
      console.error("Cover upload error:", err);
      res.status(500).json({ error: err.message || "Failed to process cover image" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(
      import_express.default.static(distPath, {
        etag: true,
        setHeaders: (res, filePath) => {
          const normalized = filePath.replace(/\\/g, "/");
          if (normalized.includes("/assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else if (normalized.endsWith("/sw.js") || normalized.endsWith("/manifest.json") || normalized.endsWith("/index.html")) {
            res.setHeader("Cache-Control", "no-cache");
          } else {
            res.setHeader("Cache-Control", "public, max-age=86400");
          }
        }
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
