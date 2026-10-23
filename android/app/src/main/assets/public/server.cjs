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
var import_stripe = __toESM(require("stripe"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new import_stripe.default(key);
  }
  return stripeClient;
}
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
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.stripe.com https://js.stripe.com https://*.paypal.com https://*.paypalobjects.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.stripe.com https://api.stripe.com https://*.run.app https://*.paypal.com; img-src 'self' data: blob: https: https://*.paypalobjects.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.google.com https://*.paypal.com; frame-ancestors 'self' https://*.google.com https://*.run.app;"
    );
    next();
  });
  app.use(import_express.default.json({ limit: "10mb" }));
  const coversStaticPath = import_path.default.join(process.cwd(), "public", "covers");
  app.use("/covers", import_express.default.static(coversStaticPath));
  const limiter = (0, import_express_rate_limit.default)({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100,
    // limit each IP to 100 requests per windowMs
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
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { amount, currency, planName, billingCycle } = req.body;
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: (currency || "usd").toLowerCase(),
              product_data: {
                name: planName || (billingCycle === "yearly" ? "KA Plus: Africa Pulse VIP Annual Pass (1 Year)" : "KA Plus: Africa Pulse VIP Pass"),
                description: billingCycle === "yearly" ? "1-Year Unlimited Ad-Free VIP Pass (Save 20% + 2 Months Free)" : "Monthly Unlimited Ad-Free VIP Pass"
              },
              unit_amount: amount
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL}/success`,
        cancel_url: `${process.env.APP_URL}/cancel`
      });
      res.json({ id: session.id, url: session.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/create-connect-account", async (req, res) => {
    try {
      const stripe = getStripe();
      const account = await stripe.accounts.create({
        type: "express"
      });
      res.json({ accountId: account.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/create-account-link", async (req, res) => {
    try {
      const { accountId } = req.body;
      const stripe = getStripe();
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.APP_URL}/creator-dashboard`,
        return_url: `${process.env.APP_URL}/creator-dashboard`,
        type: "account_onboarding"
      });
      res.json({ url: accountLink.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      fs.writeFileSync(filePath, buffer);
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
  const getPayPalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret || clientId === "test") {
      return null;
    }
    const base = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to generate PayPal Access Token: ${response.statusText}`);
    }
    const data = await response.json();
    return data.access_token;
  };
  app.post("/api/orders", async (req, res) => {
    try {
      const { cart, planId, billingCycle, amount, currency = "USD" } = req.body;
      const orderAmount = amount ? typeof amount === "number" ? amount.toFixed(2) : amount : "4.99";
      const description = `AZ Oververse ${planId || "VIP Pass"} (${billingCycle || "monthly"})`;
      const accessToken = await getPayPalAccessToken();
      const base = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
      if (accessToken) {
        const response = await fetch(`${base}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                reference_id: planId || "az_subscription",
                description,
                amount: {
                  currency_code: currency,
                  value: orderAmount
                }
              }
            ]
          })
        });
        const orderData = await response.json();
        return res.status(response.status).json(orderData);
      }
      const orderId = `PAYPAL-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return res.status(201).json({
        id: orderId,
        status: "CREATED",
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: planId || "az_subscription",
            description,
            amount: {
              currency_code: currency,
              value: orderAmount
            }
          }
        ]
      });
    } catch (error) {
      console.error("Failed to create PayPal order:", error);
      res.status(500).json({ error: error.message || "Failed to create order." });
    }
  });
  app.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
      const { orderID } = req.params;
      const { amount, currency = "USD" } = req.body || {};
      const accessToken = await getPayPalAccessToken();
      const base = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
      if (accessToken && !orderID.startsWith("PAYPAL-ORD-")) {
        const response = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        });
        const orderData = await response.json();
        return res.status(response.status).json(orderData);
      }
      const captureId = `PAYPAL-CAP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const capturedAmount = amount ? typeof amount === "number" ? amount.toFixed(2) : amount : "4.99";
      return res.status(200).json({
        id: orderID,
        status: "COMPLETED",
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: captureId,
                  status: "COMPLETED",
                  amount: {
                    currency_code: currency,
                    value: capturedAmount
                  },
                  final_capture: true,
                  create_time: (/* @__PURE__ */ new Date()).toISOString(),
                  update_time: (/* @__PURE__ */ new Date()).toISOString()
                }
              ]
            }
          }
        ]
      });
    } catch (error) {
      console.error("Failed to capture PayPal order:", error);
      res.status(500).json({ error: error.message || "Failed to capture order." });
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
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
