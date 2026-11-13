var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
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
var import_express3 = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_zlib = __toESM(require("zlib"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_express_rate_limit2 = __toESM(require("express-rate-limit"), 1);

// src/server/authRoutes.ts
var import_crypto3 = __toESM(require("crypto"), 1);
var import_express = __toESM(require("express"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);

// src/db/users.ts
var import_drizzle_orm = require("drizzle-orm");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chapters: () => chapters,
  mangas: () => mangas,
  payouts: () => payouts,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  email: (0, import_pg_core.text)("email").notNull().unique(),
  passwordHash: (0, import_pg_core.text)("password_hash").notNull(),
  penName: (0, import_pg_core.text)("pen_name").notNull(),
  studioName: (0, import_pg_core.text)("studio_name").default("Mlungiseni NM Studio"),
  bio: (0, import_pg_core.text)("bio").default(""),
  avatarUrl: (0, import_pg_core.text)("avatar_url"),
  backupEmail: (0, import_pg_core.text)("backup_email"),
  emailVerified: (0, import_pg_core.boolean)("email_verified").notNull().default(false),
  verificationToken: (0, import_pg_core.text)("verification_token"),
  resetToken: (0, import_pg_core.text)("reset_token"),
  totpEnabled: (0, import_pg_core.boolean)("totp_enabled").notNull().default(false),
  totpSecret: (0, import_pg_core.text)("totp_secret"),
  totpPendingSecret: (0, import_pg_core.text)("totp_pending_secret"),
  totpRecoveryCodes: (0, import_pg_core.text)("totp_recovery_codes"),
  role: (0, import_pg_core.text)("role").notNull().default("creator"),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var mangas = (0, import_pg_core.pgTable)("mangas", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  creatorId: (0, import_pg_core.text)("creator_id").notNull(),
  creatorEmail: (0, import_pg_core.text)("creator_email").notNull(),
  title: (0, import_pg_core.text)("title").notNull(),
  synopsis: (0, import_pg_core.text)("synopsis").notNull().default(""),
  coverUrl: (0, import_pg_core.text)("cover_url").notNull().default(""),
  genres: (0, import_pg_core.text)("genres").notNull().default('["Action"]'),
  ageRating: (0, import_pg_core.text)("age_rating").notNull().default("13+"),
  language: (0, import_pg_core.text)("language").notNull().default("English"),
  status: (0, import_pg_core.text)("status").notNull().default("Draft"),
  approvalStatus: (0, import_pg_core.text)("approval_status").notNull().default("pending_review"),
  views: (0, import_pg_core.integer)("views").notNull().default(0),
  likes: (0, import_pg_core.integer)("likes").notNull().default(0),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var chapters = (0, import_pg_core.pgTable)("chapters", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  mangaId: (0, import_pg_core.text)("manga_id").notNull(),
  creatorId: (0, import_pg_core.text)("creator_id").notNull(),
  number: (0, import_pg_core.integer)("number").notNull(),
  title: (0, import_pg_core.text)("title").notNull(),
  panels: (0, import_pg_core.text)("panels").notNull().default("[]"),
  publishStatus: (0, import_pg_core.text)("publish_status").notNull().default("Coming Soon \u2022 Panels In Production"),
  scheduledFor: (0, import_pg_core.text)("scheduled_for"),
  reads: (0, import_pg_core.integer)("reads").notNull().default(0),
  likes: (0, import_pg_core.integer)("likes").notNull().default(0),
  commentsCount: (0, import_pg_core.integer)("comments_count").notNull().default(0),
  releaseDate: (0, import_pg_core.text)("release_date").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var payouts = (0, import_pg_core.pgTable)("payouts", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  creatorId: (0, import_pg_core.text)("creator_id").notNull(),
  creatorEmail: (0, import_pg_core.text)("creator_email").notNull(),
  amountZar: (0, import_pg_core.doublePrecision)("amount_zar").notNull(),
  method: (0, import_pg_core.text)("method").notNull(),
  accountReference: (0, import_pg_core.text)("account_reference").notNull().default(""),
  status: (0, import_pg_core.text)("status").notNull().default("Pending"),
  paidAt: (0, import_pg_core.timestamp)("paid_at", { withTimezone: true }),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
});

// src/db/index.ts
function formatDatabaseUrl(rawUrl) {
  const urlString = rawUrl?.trim() || process.env.DATABASE_URL?.trim() || "";
  if (!urlString) return "";
  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes("-pooler.") || !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "15");
    }
    return parsed.toString();
  } catch {
    const separator = urlString.includes("?") ? "&" : "?";
    let formatted = urlString;
    if (!formatted.includes("pgbouncer=")) {
      formatted += `${separator}pgbouncer=true`;
    }
    if (!formatted.includes("connect_timeout=")) {
      formatted += `&connect_timeout=15`;
    }
    return formatted;
  }
}
var createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = formatDatabaseUrl(process.env.DATABASE_URL);
    const poolConfig = databaseUrl ? {
      connectionString: databaseUrl,
      max: 12,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 15e3,
      // Increased to 15s for Neon cold-start wakeup
      statement_timeout: 15e3,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1e4,
      ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false }
    } : {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 12,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 15e3,
      // Increased to 15s for Neon cold-start wakeup
      statement_timeout: 15e3,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1e4
    };
    global._postgresPool = new import_pg.Pool(poolConfig);
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
function isConnectionTimeoutError(error) {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = error?.code;
  return code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "ECONNRESET" || code === "57P01" || // admin shutdown
  code === "08006" || // connection failure
  code === "P1001" || code === "P1002" || /timeout|timed out|connection closed|connection terminated|cold start|server closed the connection|starting up/i.test(msg);
}
async function withDbRetry(operation, maxRetries = 3, delayMs = 2e3) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt <= maxRetries && isConnectionTimeoutError(error)) {
        console.warn(
          `[Neon DB Wake] Connection timeout or cold-start detected. Retrying in ${delayMs / 1e3}s (Attempt ${attempt}/${maxRetries})...`,
          error?.message || error
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      console.error(`[DB Query Error] Failed after ${attempt} attempt(s):`, error);
      throw error;
    }
  }
}
async function pingDatabaseWithRetry() {
  await withDbRetry(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1 as ping");
    } finally {
      client.release();
    }
  });
}

// src/db/users.ts
function parseRemainingRecoveryCodesCount(rawJson) {
  if (!rawJson) return 0;
  try {
    const parsed = JSON.parse(rawJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
function toPublicUser(row) {
  const totpActive = Boolean(row.totpEnabled && row.totpSecret);
  const normalizedRole = row.role === "admin" ? "admin" : row.role === "reader" ? "reader" : "creator";
  return {
    id: row.id,
    email: row.email,
    backup_email: row.backupEmail ?? null,
    pen_name: row.penName,
    studio_name: row.studioName || `${row.penName} Studio`,
    bio: row.bio || "",
    avatar_url: row.avatarUrl ?? null,
    email_verified: Boolean(row.emailVerified),
    totp_enabled: totpActive,
    totp_recovery_codes_remaining: totpActive ? parseRemainingRecoveryCodesCount(row.totpRecoveryCodes) : 0,
    is_creator: normalizedRole === "creator" || normalizedRole === "admin",
    role: normalizedRole,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function findUserByEmail(rawEmail) {
  const email = rawEmail.trim().toLowerCase();
  try {
    return await withDbRetry(async () => {
      const rows = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email)).limit(1);
      return rows[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] findUserByEmail failed:", error);
    throw error;
  }
}
async function findUserById(id) {
  try {
    return await withDbRetry(async () => {
      const rows = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id)).limit(1);
      return rows[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] findUserById failed:", error);
    throw error;
  }
}
async function createUserRecord(input) {
  try {
    return await withDbRetry(async () => {
      const inserted = await db.insert(users).values({
        ...input,
        email: input.email.trim().toLowerCase()
      }).returning();
      if (!inserted[0]) {
        throw new Error("Failed to create user record.");
      }
      return inserted[0];
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw new Error("EMAIL_ALREADY_EXISTS", { cause: error });
    }
    console.error("[DB] createUserRecord failed:", error);
    throw error;
  }
}
async function updateUserVerificationToken(id, verificationToken, passwordHash, penName, studioName) {
  try {
    return await withDbRetry(async () => {
      const updatePayload = {
        verificationToken,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (passwordHash) updatePayload.passwordHash = passwordHash;
      if (penName) updatePayload.penName = penName;
      if (studioName) updatePayload.studioName = studioName;
      const updated = await db.update(users).set(updatePayload).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] updateUserVerificationToken failed:", error);
    throw error;
  }
}
async function markUserEmailVerified(id) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        emailVerified: true,
        verificationToken: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] markUserEmailVerified failed:", error);
    throw error;
  }
}
async function setUserPasswordResetToken(id, resetToken) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        resetToken,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] setUserPasswordResetToken failed:", error);
    throw error;
  }
}
async function updateUserPasswordHash(id, passwordHash) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        passwordHash,
        resetToken: null,
        emailVerified: true,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] updateUserPasswordHash failed:", error);
    throw error;
  }
}
async function updateUserCreatorProfile(id, updates) {
  try {
    return await withDbRetry(async () => {
      const patch = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (typeof updates.penName === "string" && updates.penName.trim().length >= 2) {
        patch.penName = updates.penName.trim();
      }
      if (typeof updates.studioName === "string") {
        patch.studioName = updates.studioName.trim();
      }
      if (typeof updates.bio === "string") {
        patch.bio = updates.bio.trim();
      }
      if (updates.avatarUrl !== void 0) {
        patch.avatarUrl = updates.avatarUrl;
      }
      if (updates.role) {
        patch.role = updates.role;
      }
      if (updates.backupEmail !== void 0) {
        patch.backupEmail = updates.backupEmail ? updates.backupEmail.trim().toLowerCase() : null;
      }
      const updated = await db.update(users).set(patch).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] updateUserCreatorProfile failed:", error);
    throw error;
  }
}
async function savePendingTotpSecret(id, encryptedPendingSecret) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        totpPendingSecret: encryptedPendingSecret,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] savePendingTotpSecret failed:", error);
    throw error;
  }
}
async function activateUserTotp(id, encryptedSecret, recoveryCodesHashesJson) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpPendingSecret: null,
        totpRecoveryCodes: recoveryCodesHashesJson,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] activateUserTotp failed:", error);
    throw error;
  }
}
async function updateUserRecoveryCodes(id, recoveryCodesHashesJson) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        totpRecoveryCodes: recoveryCodesHashesJson,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] updateUserRecoveryCodes failed:", error);
    throw error;
  }
}
async function disableUserTotp(id) {
  try {
    return await withDbRetry(async () => {
      const updated = await db.update(users).set({
        totpEnabled: false,
        totpSecret: null,
        totpPendingSecret: null,
        totpRecoveryCodes: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(users.id, id)).returning();
      return updated[0] ?? null;
    });
  } catch (error) {
    console.error("[DB] disableUserTotp failed:", error);
    throw error;
  }
}

// src/server/jwt.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from environment variables. Please define JWT_SECRET in your .env file."
    );
  }
  return secret;
}
function getDerivedEncryptionKey() {
  return import_crypto.default.createHash("sha256").update(`oververse-totp-aes256:${getJwtSecret()}`).digest();
}
function signAccessToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      pen_name: user.pen_name,
      purpose: "access"
    },
    getJwtSecret(),
    { expiresIn: "15m", issuer: "az-oververse" }
  );
}
function signRefreshToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: "refresh"
    },
    getJwtSecret(),
    { expiresIn: "7d", issuer: "az-oververse" }
  );
}
function signMfaChallengeToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: "mfa_challenge"
    },
    getJwtSecret(),
    { expiresIn: "5m", issuer: "az-oververse" }
  );
}
function signEmailVerificationToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: "email_verify"
    },
    getJwtSecret(),
    { expiresIn: "1d", issuer: "az-oververse" }
  );
}
function signPasswordResetToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: "password_reset"
    },
    getJwtSecret(),
    { expiresIn: "1h", issuer: "az-oververse" }
  );
}
function verifyPurposeToken(token, expectedPurpose) {
  const decoded = import_jsonwebtoken.default.verify(token, getJwtSecret(), {
    issuer: "az-oververse"
  });
  if (!decoded || typeof decoded.sub !== "string" || decoded.purpose !== expectedPurpose) {
    throw new Error("Invalid token purpose or subject.");
  }
  return decoded;
}

// src/server/validation.ts
var import_zod = require("zod");
var totpSixDigitCodeSchema = import_zod.z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit authenticator code.");
var registerInputSchema = import_zod.z.object({
  email: import_zod.z.string().trim().toLowerCase().email("Enter a valid email address."),
  pen_name: import_zod.z.string().trim().min(2, "Pen name must be at least 2 characters.").max(60, "Pen name must be 60 characters or fewer.").regex(/^[^<>]+$/, "Pen name contains invalid characters."),
  studio_name: import_zod.z.string().trim().max(80, "Studio name must be 80 characters or fewer.").optional(),
  bio: import_zod.z.string().trim().max(500, "Bio must be 500 characters or fewer.").optional(),
  role: import_zod.z.enum(["reader", "creator"]).optional().default("creator"),
  password: import_zod.z.string().min(8, "Password must be at least 8 characters long.").max(128, "Password must be 128 characters or fewer."),
  confirmPassword: import_zod.z.string().optional()
}).refine(
  (data) => data.confirmPassword === void 0 || data.password === data.confirmPassword,
  {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  }
);
var loginInputSchema = import_zod.z.object({
  email: import_zod.z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: import_zod.z.string().min(1, "Enter your password.").max(128, "Password is too long."),
  totpCode: totpSixDigitCodeSchema.optional()
});
var totpOrRecoveryCodeSchema = import_zod.z.string().trim().refine(
  (val) => /^\d{6}$/.test(val) || /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(val),
  "Enter a 6-digit authenticator code or an 8-character recovery code (XXXX-XXXX)."
);
var loginTwoFactorSchema = import_zod.z.object({
  mfaToken: import_zod.z.string().trim().min(20, "Missing or invalid two-factor challenge token."),
  code: totpOrRecoveryCodeSchema
});
var enableTwoFactorSchema = import_zod.z.object({
  code: totpSixDigitCodeSchema
});
var regenerateRecoveryCodesSchema = import_zod.z.object({
  code: totpSixDigitCodeSchema
});
var disableTwoFactorSchema = import_zod.z.object({
  password: import_zod.z.string().min(1, "Enter your current account password.").max(128),
  code: totpOrRecoveryCodeSchema
});
var forgotPasswordSchema = import_zod.z.object({
  email: import_zod.z.string().trim().toLowerCase().email("Enter a valid email address.")
});
var resetPasswordSchema = import_zod.z.object({
  token: import_zod.z.string().trim().min(20, "Invalid or missing reset token."),
  password: import_zod.z.string().min(8, "New password must be at least 8 characters long.").max(128, "Password must be 128 characters or fewer."),
  confirmPassword: import_zod.z.string().optional()
}).refine(
  (data) => data.confirmPassword === void 0 || data.password === data.confirmPassword,
  {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  }
);
var updateProfileSchema = import_zod.z.object({
  pen_name: import_zod.z.string().trim().min(2, "Pen name must be at least 2 characters.").max(60).optional(),
  studio_name: import_zod.z.string().trim().max(80).optional(),
  bio: import_zod.z.string().trim().max(500).optional(),
  avatar_url: import_zod.z.string().trim().url("Avatar URL must be a valid URL.").nullable().optional(),
  role: import_zod.z.enum(["reader", "creator"]).optional(),
  backup_email: import_zod.z.string().trim().toLowerCase().email("Enter a valid backup recovery email address.").max(120, "Email address must be 120 characters or fewer.").nullable().optional().or(import_zod.z.literal(""))
});

// src/server/totp.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var import_qrcode = __toESM(require("qrcode"), 1);
var BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
var TOTP_DIGITS = 6;
var TOTP_PERIOD_SECONDS = 30;
var ISSUER_NAME = "AZ OVERVERSE";
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = value << 8 | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[value << 5 - bits & 31];
  }
  return output;
}
function base32Decode(encoded) {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push(value >>> bits - 8 & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
function generateTotpSecret(byteLength = 20) {
  return base32Encode(import_crypto2.default.randomBytes(byteLength));
}
function formatManualSecretKey(base32Secret) {
  return base32Secret.replace(/(.{4})/g, "$1 ").trim();
}
function generateTotpCodeAtStep(base32Secret, counterStep) {
  const key = base32Decode(base32Secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counterStep));
  const hmac = import_crypto2.default.createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binaryCode = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
  const otp = binaryCode % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, "0");
}
function verifyTotpCode(base32Secret, rawCandidateCode, windowSteps = 1, timestampMs = Date.now()) {
  const candidate = (rawCandidateCode || "").trim();
  if (!/^\d{6}$/.test(candidate)) {
    return false;
  }
  const currentStep = Math.floor(timestampMs / 1e3 / TOTP_PERIOD_SECONDS);
  const candidateBuf = Buffer.from(candidate, "utf8");
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const expected = generateTotpCodeAtStep(base32Secret, currentStep + delta);
    const expectedBuf = Buffer.from(expected, "utf8");
    if (expectedBuf.length === candidateBuf.length && import_crypto2.default.timingSafeEqual(expectedBuf, candidateBuf)) {
      return true;
    }
  }
  return false;
}
function buildOtpAuthUri(params) {
  const issuer = params.issuer || ISSUER_NAME;
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(params.accountEmail)}`;
  const query = new URLSearchParams({
    secret: params.base32Secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS)
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
async function generateTotpQrDataUrl(otpauthUrl) {
  return import_qrcode.default.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 240,
    color: {
      dark: "#09090b",
      light: "#ffffff"
    }
  });
}
function encryptTotpSecret(plainBase32Secret) {
  const key = getDerivedEncryptionKey();
  const iv = import_crypto2.default.randomBytes(12);
  const cipher = import_crypto2.default.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainBase32Secret, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}
function decryptTotpSecret(storedValue) {
  if (!storedValue.startsWith("v1:")) {
    return storedValue;
  }
  const [, ivHex, tagHex, dataHex] = storedValue.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Malformed encrypted TOTP secret.");
  }
  const key = getDerivedEncryptionKey();
  const decipher = import_crypto2.default.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
var RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var DEFAULT_RECOVERY_CODE_COUNT = 8;
function generateRecoveryCodes(count = DEFAULT_RECOVERY_CODE_COUNT) {
  const codes = /* @__PURE__ */ new Set();
  while (codes.size < count) {
    const bytes = import_crypto2.default.randomBytes(8);
    let chars = "";
    for (let i = 0; i < 8; i++) {
      chars += RECOVERY_CODE_ALPHABET[bytes[i] & 31];
    }
    codes.add(`${chars.slice(0, 4)}-${chars.slice(4, 8)}`);
  }
  return Array.from(codes);
}
function normalizeRecoveryCode(rawCode) {
  return (rawCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function hashRecoveryCode(rawCode) {
  const normalized = normalizeRecoveryCode(rawCode);
  return import_crypto2.default.createHmac("sha256", getDerivedEncryptionKey()).update(`oververse-recovery-v1:${normalized}`).digest("hex");
}
function serializeRecoveryCodeHashes(plainCodes) {
  return JSON.stringify(plainCodes.map((code) => hashRecoveryCode(code)));
}
function verifyAndConsumeRecoveryCode(storedHashesJson, rawCandidate) {
  let hashes = [];
  if (storedHashesJson) {
    try {
      const parsed = JSON.parse(storedHashesJson);
      if (Array.isArray(parsed)) {
        hashes = parsed.filter((item) => typeof item === "string");
      }
    } catch {
      hashes = [];
    }
  }
  const normalized = normalizeRecoveryCode(rawCandidate);
  if (normalized.length !== 8 || hashes.length === 0) {
    return {
      matched: false,
      nextStoredHashesJson: JSON.stringify(hashes),
      remainingCount: hashes.length
    };
  }
  const candidateHash = hashRecoveryCode(normalized);
  const candidateBuf = Buffer.from(candidateHash, "hex");
  let matchedIndex = -1;
  for (let i = 0; i < hashes.length; i++) {
    const existingBuf = Buffer.from(hashes[i], "hex");
    if (existingBuf.length === candidateBuf.length && import_crypto2.default.timingSafeEqual(existingBuf, candidateBuf)) {
      matchedIndex = i;
    }
  }
  if (matchedIndex === -1) {
    return {
      matched: false,
      nextStoredHashesJson: JSON.stringify(hashes),
      remainingCount: hashes.length
    };
  }
  const nextHashes = hashes.filter((_, idx) => idx !== matchedIndex);
  return {
    matched: true,
    nextStoredHashesJson: JSON.stringify(nextHashes),
    remainingCount: nextHashes.length
  };
}

// src/server/mailer.ts
var import_resend = require("resend");
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === "re_xxxxxxxxx" || apiKey.length < 8) {
    return null;
  }
  return new import_resend.Resend(apiKey);
}
function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "AZ OVERVERSE Creators <onboarding@resend.dev>";
}
async function sendVerificationEmail(params) {
  const resend = getResendClient();
  if (!resend) {
    console.info(
      `[OVERVERSE Mailer] RESEND_API_KEY not configured. Verification link for ${params.to}: ${params.verifyUrl}`
    );
    return {
      delivered: false,
      fallbackPreviewUrl: params.verifyUrl
    };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.to],
      subject: "Verify your AZ OVERVERSE Creator Account",
      html: `
        <div style="background-color:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px 24px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #27272a;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00DC64;margin-bottom:12px;">
            AZ OVERVERSE CREATORS
          </div>
          <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#ffffff;">
            Welcome to the Canvas, ${escapeHtml(params.penName)}
          </h1>
          <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 28px;">
            Confirm your email address to activate your AZ OVERVERSE account and start publishing original manga chapters. This verification link expires in 24 hours.
          </p>
          <a href="${params.verifyUrl}" style="display:inline-block;background-color:#00DC64;color:#052e16;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:10px;">
            Verify Email Address
          </a>
          <p style="font-size:12px;line-height:1.6;color:#71717a;margin:28px 0 0;word-break:break-all;">
            Or copy and paste this URL into your browser:<br />
            <span style="color:#d4d4d8;">${params.verifyUrl}</span>
          </p>
        </div>
      `
    });
    if (error) {
      console.warn("[OVERVERSE Mailer] Resend delivery warning:", error);
      return {
        delivered: false,
        fallbackPreviewUrl: params.verifyUrl
      };
    }
    return {
      delivered: true,
      providerMessageId: data?.id
    };
  } catch (err) {
    console.warn("[OVERVERSE Mailer] Resend request error:", err);
    return {
      delivered: false,
      fallbackPreviewUrl: params.verifyUrl
    };
  }
}
async function sendPasswordResetEmail(params) {
  const resend = getResendClient();
  if (!resend) {
    console.info(
      `[OVERVERSE Mailer] RESEND_API_KEY not configured. Password reset link for ${params.to}: ${params.resetUrl}`
    );
    return {
      delivered: false,
      fallbackPreviewUrl: params.resetUrl
    };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.to],
      subject: "Reset your AZ OVERVERSE password",
      html: `
        <div style="background-color:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px 24px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #27272a;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f59e0b;margin-bottom:12px;">
            AZ OVERVERSE SECURITY
          </div>
          <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#ffffff;">
            Reset Your Password
          </h1>
          <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 28px;">
            Hi ${escapeHtml(params.penName)}, we received a request to reset your AZ OVERVERSE password. Click the button below within the next 60 minutes to choose a new password.
          </p>
          <a href="${params.resetUrl}" style="display:inline-block;background-color:#00DC64;color:#052e16;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:10px;">
            Reset Password
          </a>
          <p style="font-size:12px;line-height:1.6;color:#71717a;margin:28px 0 0;word-break:break-all;">
            If you didn't request this reset, you can safely ignore this email.<br />
            <span style="color:#d4d4d8;">${params.resetUrl}</span>
          </p>
        </div>
      `
    });
    if (error) {
      console.warn("[OVERVERSE Mailer] Resend reset delivery warning:", error);
      return {
        delivered: false,
        fallbackPreviewUrl: params.resetUrl
      };
    }
    return {
      delivered: true,
      providerMessageId: data?.id
    };
  } catch (err) {
    console.warn("[OVERVERSE Mailer] Resend reset error:", err);
    return {
      delivered: false,
      fallbackPreviewUrl: params.resetUrl
    };
  }
}
function escapeHtml(input) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/server/authRoutes.ts
var BCRYPT_SALT_ROUNDS = 12;
var REFRESH_COOKIE_NAME = "refreshToken";
var SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1e3;
var ADMIN_EMAILS = /* @__PURE__ */ new Set(["mlungisenimbhele3@gmail.com"]);
function resolvePublicBaseUrl(req) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  const originHeader = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  if (originHeader && /^https?:\/\//i.test(originHeader)) {
    return originHeader.replace(/\/$/, "");
  }
  if (configured && configured !== "https://az-oververse.ai.studio" && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  const host = req.get("host") || "localhost:3000";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = (typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol) || "http";
  const normalizedProto = !host.includes("localhost") && !host.includes("127.0.0.1") ? "https" : proto;
  return `${normalizedProto}://${host}`;
}
function setRefreshCookie(req, res, refreshToken) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.secure || typeof forwardedProto === "string" && forwardedProto.includes("https") || process.env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/api/auth",
    maxAge: SEVEN_DAYS_MS
  });
}
function clearRefreshCookie(req, res) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.secure || typeof forwardedProto === "string" && forwardedProto.includes("https") || process.env.NODE_ENV === "production";
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/api/auth"
  });
}
function formatZodIssues(issues) {
  return issues[0]?.message || "Invalid input provided.";
}
var strictAuthRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please wait 15 minutes before trying again."
  },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip;
    return `${(0, import_express_rate_limit.ipKeyGenerator)(rawIp || "127.0.0.1")}:${req.path}`;
  },
  validate: { xForwardedForHeader: false }
});
function requireJwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Missing Bearer token." });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const claims = verifyPurposeToken(token, "access");
    req.authUser = {
      id: claims.sub,
      email: claims.email,
      role: claims.role || "creator",
      pen_name: claims.pen_name || "Creator"
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired access token." });
  }
}
var authRouter = import_express.default.Router();
authRouter.post("/register", strictAuthRateLimiter, async (req, res) => {
  const parsed = registerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }
  const { email, password, pen_name, studio_name, bio, role } = parsed.data;
  const resolvedRole = ADMIN_EMAILS.has(email) ? "admin" : role || "creator";
  const resolvedStudioName = studio_name?.trim() || `${pen_name} Studio`;
  try {
    const existing = await findUserByEmail(email);
    const passwordHash = await import_bcryptjs.default.hash(password, BCRYPT_SALT_ROUNDS);
    if (existing) {
      if (existing.emailVerified) {
        return res.status(409).json({
          error: "An account with this email already exists. Please sign in instead."
        });
      }
      const verificationToken2 = signEmailVerificationToken({
        id: existing.id,
        email: existing.email
      });
      const updatedRow = await updateUserVerificationToken(
        existing.id,
        verificationToken2,
        passwordHash,
        pen_name,
        resolvedStudioName
      );
      const baseUrl2 = resolvePublicBaseUrl(req);
      const verifyUrl2 = `${baseUrl2}/verify?token=${encodeURIComponent(verificationToken2)}`;
      const emailDispatch2 = await sendVerificationEmail({
        to: existing.email,
        penName: pen_name,
        verifyUrl: verifyUrl2
      });
      const safeUser = updatedRow ? toPublicUser(updatedRow) : null;
      return res.status(200).json({
        success: true,
        message: emailDispatch2.delivered ? "Verification email resent. Check your inbox to activate your account." : "Account registered. Open the verification link below to confirm your email.",
        emailDelivered: emailDispatch2.delivered,
        previewVerificationUrl: emailDispatch2.fallbackPreviewUrl,
        user: safeUser
      });
    }
    const userId = import_crypto3.default.randomUUID();
    const verificationToken = signEmailVerificationToken({
      id: userId,
      email
    });
    const createdRow = await createUserRecord({
      id: userId,
      email,
      passwordHash,
      penName: pen_name,
      studioName: resolvedStudioName,
      bio: bio || `Creator on AZ OVERVERSE (${resolvedStudioName}).`,
      avatarUrl: null,
      emailVerified: false,
      verificationToken,
      resetToken: null,
      totpEnabled: false,
      totpSecret: null,
      totpPendingSecret: null,
      totpRecoveryCodes: null,
      role: resolvedRole
    });
    const baseUrl = resolvePublicBaseUrl(req);
    const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`;
    const emailDispatch = await sendVerificationEmail({
      to: email,
      penName: pen_name,
      verifyUrl
    });
    return res.status(201).json({
      success: true,
      message: emailDispatch.delivered ? "Account created! Check your email for the verification link." : "Account created! Confirm your email using the verification link below.",
      emailDelivered: emailDispatch.delivered,
      previewVerificationUrl: emailDispatch.fallbackPreviewUrl,
      user: toPublicUser(createdRow)
    });
  } catch (error) {
    if (error?.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        error: "An account with this email already exists. Please sign in instead."
      });
    }
    return res.status(500).json({
      error: error?.message || "Unable to complete registration right now."
    });
  }
});
authRouter.post(
  "/resend-verification",
  strictAuthRateLimiter,
  async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }
    try {
      const user = await findUserByEmail(parsed.data.email);
      if (!user) {
        return res.json({
          success: true,
          message: "If that account exists and is unverified, a verification link has been sent."
        });
      }
      if (user.emailVerified) {
        return res.json({
          success: true,
          alreadyVerified: true,
          message: "Your email is already verified. You can sign in right away."
        });
      }
      const verificationToken = signEmailVerificationToken({
        id: user.id,
        email: user.email
      });
      await updateUserVerificationToken(user.id, verificationToken);
      const baseUrl = resolvePublicBaseUrl(req);
      const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`;
      const emailDispatch = await sendVerificationEmail({
        to: user.email,
        penName: user.penName,
        verifyUrl
      });
      return res.json({
        success: true,
        emailDelivered: emailDispatch.delivered,
        previewVerificationUrl: emailDispatch.fallbackPreviewUrl,
        message: emailDispatch.delivered ? "Fresh verification link sent to your email." : "Fresh verification link generated below."
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Unable to resend verification link."
      });
    }
  }
);
authRouter.get("/verify", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token) {
    return res.status(400).json({ error: "Missing verification token." });
  }
  try {
    let claims;
    try {
      claims = verifyPurposeToken(token, "email_verify");
    } catch {
      return res.status(400).json({
        error: "Verification link is invalid or has expired. Request a new verification email."
      });
    }
    const existing = await findUserById(claims.sub);
    if (!existing) {
      return res.status(404).json({ error: "Account not found for this verification token." });
    }
    if (existing.emailVerified) {
      return res.json({
        success: true,
        verified: true,
        message: "Email verified",
        user: toPublicUser(existing)
      });
    }
    if (existing.verificationToken && existing.verificationToken !== token) {
      return res.status(400).json({
        error: "A newer verification link was issued. Please use the latest email link."
      });
    }
    const updated = await markUserEmailVerified(existing.id);
    if (!updated) {
      return res.status(500).json({ error: "Could not update email verification state." });
    }
    return res.json({
      success: true,
      verified: true,
      message: "Email verified",
      user: toPublicUser(updated)
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to verify email address."
    });
  }
});
authRouter.post("/login", strictAuthRateLimiter, async (req, res) => {
  const parsed = loginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }
  const { email, password, totpCode } = parsed.data;
  try {
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const passwordValid = await import_bcryptjs.default.compare(password, userRow.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!userRow.emailVerified) {
      return res.status(403).json({
        error: "Please verify your email address before signing in.",
        code: "EMAIL_NOT_VERIFIED",
        email: userRow.email
      });
    }
    const isCreatorOrAdmin = userRow.role === "creator" || userRow.role === "admin";
    if (isCreatorOrAdmin && userRow.totpEnabled && userRow.totpSecret) {
      if (!totpCode) {
        const mfaToken = signMfaChallengeToken({
          id: userRow.id,
          email: userRow.email
        });
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          mfaToken,
          email: userRow.email,
          message: "Enter the 6-digit code from your authenticator app."
        });
      }
      const plainSecret = decryptTotpSecret(userRow.totpSecret);
      if (!verifyTotpCode(plainSecret, totpCode)) {
        return res.status(401).json({
          error: "Invalid 6-digit authenticator code.",
          code: "INVALID_TOTP_CODE"
        });
      }
    }
    const safeUser = toPublicUser(userRow);
    const accessToken = signAccessToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      pen_name: safeUser.pen_name
    });
    const refreshToken = signRefreshToken({
      id: safeUser.id,
      email: safeUser.email
    });
    setRefreshCookie(req, res, refreshToken);
    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unable to sign in right now."
    });
  }
});
authRouter.post("/login/2fa", strictAuthRateLimiter, async (req, res) => {
  const parsed = loginTwoFactorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }
  const { mfaToken, code } = parsed.data;
  try {
    let claims;
    try {
      claims = verifyPurposeToken(mfaToken, "mfa_challenge");
    } catch {
      return res.status(401).json({
        error: "Two-factor session expired. Please enter your email and password again.",
        code: "MFA_CHALLENGE_EXPIRED"
      });
    }
    const userRow = await findUserById(claims.sub);
    if (!userRow || !userRow.emailVerified || !userRow.totpEnabled || !userRow.totpSecret) {
      return res.status(401).json({
        error: "Two-factor verification could not be completed for this account."
      });
    }
    const trimmedCode = code.trim();
    const isSixDigitTotp = /^\d{6}$/.test(trimmedCode);
    let updatedUserRow = userRow;
    let usedRecoveryCode = false;
    let remainingRecoveryCodes;
    if (isSixDigitTotp) {
      const plainSecret = decryptTotpSecret(userRow.totpSecret);
      if (!verifyTotpCode(plainSecret, trimmedCode)) {
        return res.status(401).json({
          error: "Invalid 6-digit authenticator code. Please check your app and try again.",
          code: "INVALID_TOTP_CODE"
        });
      }
    } else {
      const consumed = verifyAndConsumeRecoveryCode(userRow.totpRecoveryCodes, trimmedCode);
      if (!consumed.matched) {
        return res.status(401).json({
          error: "Invalid or already-used recovery code.",
          code: "INVALID_RECOVERY_CODE"
        });
      }
      const persisted = await updateUserRecoveryCodes(
        userRow.id,
        consumed.nextStoredHashesJson
      );
      if (persisted) {
        updatedUserRow = persisted;
      }
      usedRecoveryCode = true;
      remainingRecoveryCodes = consumed.remainingCount;
    }
    const safeUser = toPublicUser(updatedUserRow);
    const accessToken = signAccessToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      pen_name: safeUser.pen_name
    });
    const refreshToken = signRefreshToken({
      id: safeUser.id,
      email: safeUser.email
    });
    setRefreshCookie(req, res, refreshToken);
    return res.json({
      success: true,
      usedRecoveryCode,
      remainingRecoveryCodes,
      accessToken,
      refreshToken,
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unable to verify authenticator code right now."
    });
  }
});
authRouter.post(
  "/2fa/setup",
  requireJwtAuth,
  async (req, res) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const userRow = await findUserById(userId);
      if (!userRow) {
        return res.status(404).json({ error: "Account not found." });
      }
      if (userRow.role !== "creator" && userRow.role !== "admin") {
        return res.status(403).json({
          error: "Two-Factor Authentication is available for Creator accounts. Switch your role to Creator in Profile Settings first."
        });
      }
      const base32Secret = generateTotpSecret(20);
      const encryptedPending = encryptTotpSecret(base32Secret);
      await savePendingTotpSecret(userRow.id, encryptedPending);
      const otpauthUrl = buildOtpAuthUri({
        accountEmail: userRow.email,
        base32Secret,
        issuer: "AZ OVERVERSE"
      });
      const qrCodeDataUrl = await generateTotpQrDataUrl(otpauthUrl);
      return res.json({
        success: true,
        otpauthUrl,
        qrCodeDataUrl,
        manualEntryKey: formatManualSecretKey(base32Secret)
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Unable to initialize authenticator setup."
      });
    }
  }
);
authRouter.post(
  "/2fa/enable",
  requireJwtAuth,
  async (req, res) => {
    const parsed = enableTwoFactorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const userRow = await findUserById(userId);
      if (!userRow) {
        return res.status(404).json({ error: "Account not found." });
      }
      if (userRow.role !== "creator" && userRow.role !== "admin") {
        return res.status(403).json({
          error: "Only Creator accounts can enable Two-Factor Authentication."
        });
      }
      if (!userRow.totpPendingSecret) {
        return res.status(400).json({
          error: "Start authenticator setup first to generate a QR code."
        });
      }
      const plainPendingSecret = decryptTotpSecret(userRow.totpPendingSecret);
      if (!verifyTotpCode(plainPendingSecret, parsed.data.code)) {
        return res.status(400).json({
          error: "Invalid 6-digit code. Ensure your device clock is accurate and enter the latest code."
        });
      }
      const recoveryCodes = generateRecoveryCodes(8);
      const recoveryCodesHashesJson = serializeRecoveryCodeHashes(recoveryCodes);
      const updated = await activateUserTotp(
        userRow.id,
        userRow.totpPendingSecret,
        recoveryCodesHashesJson
      );
      if (!updated) {
        return res.status(500).json({ error: "Could not activate Two-Factor Authentication." });
      }
      return res.json({
        success: true,
        message: "Two-Factor Authentication is now enabled. Store your one-time recovery codes in a safe place.",
        recoveryCodes,
        user: toPublicUser(updated)
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Failed to enable Two-Factor Authentication."
      });
    }
  }
);
authRouter.post(
  "/2fa/recovery-codes/regenerate",
  requireJwtAuth,
  async (req, res) => {
    const parsed = regenerateRecoveryCodesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const userRow = await findUserById(userId);
      if (!userRow || !userRow.totpEnabled || !userRow.totpSecret) {
        return res.status(400).json({
          error: "Two-Factor Authentication must be enabled before regenerating recovery codes."
        });
      }
      const plainSecret = decryptTotpSecret(userRow.totpSecret);
      if (!verifyTotpCode(plainSecret, parsed.data.code)) {
        return res.status(401).json({
          error: "Invalid 6-digit authenticator code."
        });
      }
      const recoveryCodes = generateRecoveryCodes(8);
      const recoveryCodesHashesJson = serializeRecoveryCodeHashes(recoveryCodes);
      const updated = await updateUserRecoveryCodes(userRow.id, recoveryCodesHashesJson);
      if (!updated) {
        return res.status(500).json({ error: "Could not regenerate recovery codes." });
      }
      return res.json({
        success: true,
        message: "Generated 8 new one-time recovery codes. Previous recovery codes are now invalid.",
        recoveryCodes,
        user: toPublicUser(updated)
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Failed to regenerate recovery codes."
      });
    }
  }
);
authRouter.post(
  "/2fa/disable",
  requireJwtAuth,
  async (req, res) => {
    const parsed = disableTwoFactorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const userRow = await findUserById(userId);
      if (!userRow || !userRow.totpEnabled || !userRow.totpSecret) {
        return res.status(400).json({
          error: "Two-Factor Authentication is not currently enabled on this account."
        });
      }
      const passwordValid = await import_bcryptjs.default.compare(parsed.data.password, userRow.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({
          error: "Incorrect account password."
        });
      }
      const trimmedCode = parsed.data.code.trim();
      if (/^\d{6}$/.test(trimmedCode)) {
        const plainSecret = decryptTotpSecret(userRow.totpSecret);
        if (!verifyTotpCode(plainSecret, trimmedCode)) {
          return res.status(401).json({
            error: "Invalid 6-digit authenticator code."
          });
        }
      } else {
        const consumed = verifyAndConsumeRecoveryCode(userRow.totpRecoveryCodes, trimmedCode);
        if (!consumed.matched) {
          return res.status(401).json({
            error: "Invalid or already-used recovery code."
          });
        }
      }
      const updated = await disableUserTotp(userRow.id);
      if (!updated) {
        return res.status(500).json({ error: "Could not disable Two-Factor Authentication." });
      }
      return res.json({
        success: true,
        message: "Two-Factor Authentication has been disabled.",
        user: toPublicUser(updated)
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Failed to disable Two-Factor Authentication."
      });
    }
  }
);
authRouter.post("/refresh", async (req, res) => {
  const cookieToken = typeof req.cookies?.[REFRESH_COOKIE_NAME] === "string" ? req.cookies[REFRESH_COOKIE_NAME].trim() : "";
  const bodyToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : "";
  const rawToken = cookieToken || bodyToken;
  if (!rawToken) {
    return res.status(401).json({ error: "No active refresh session." });
  }
  try {
    let claims;
    try {
      claims = verifyPurposeToken(rawToken, "refresh");
    } catch {
      clearRefreshCookie(req, res);
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
    const userRow = await findUserById(claims.sub);
    if (!userRow || !userRow.emailVerified) {
      clearRefreshCookie(req, res);
      return res.status(401).json({ error: "Account session is no longer active." });
    }
    const safeUser = toPublicUser(userRow);
    const accessToken = signAccessToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      pen_name: safeUser.pen_name
    });
    return res.json({
      success: true,
      accessToken,
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to refresh session."
    });
  }
});
authRouter.post("/forgot", strictAuthRateLimiter, async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }
  try {
    const userRow = await findUserByEmail(parsed.data.email);
    if (!userRow) {
      return res.json({
        success: true,
        message: "If an account exists for that email, a password reset link has been sent."
      });
    }
    const resetToken = signPasswordResetToken({
      id: userRow.id,
      email: userRow.email
    });
    await setUserPasswordResetToken(userRow.id, resetToken);
    const baseUrl = resolvePublicBaseUrl(req);
    const resetUrl = `${baseUrl}/reset?token=${encodeURIComponent(resetToken)}`;
    const emailDispatch = await sendPasswordResetEmail({
      to: userRow.email,
      penName: userRow.penName,
      resetUrl
    });
    return res.json({
      success: true,
      emailDelivered: emailDispatch.delivered,
      previewResetUrl: emailDispatch.fallbackPreviewUrl,
      message: emailDispatch.delivered ? "If an account exists for that email, a password reset link has been sent." : "Password reset link generated below."
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unable to process password reset request."
    });
  }
});
authRouter.post("/reset", strictAuthRateLimiter, async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }
  const { token, password } = parsed.data;
  try {
    let claims;
    try {
      claims = verifyPurposeToken(token, "password_reset");
    } catch {
      return res.status(400).json({
        error: "Password reset link is invalid or has expired. Request a new reset link."
      });
    }
    const userRow = await findUserById(claims.sub);
    if (!userRow || !userRow.resetToken || userRow.resetToken !== token) {
      return res.status(400).json({
        error: "This password reset link has already been used or replaced."
      });
    }
    const newPasswordHash = await import_bcryptjs.default.hash(password, BCRYPT_SALT_ROUNDS);
    await updateUserPasswordHash(userRow.id, newPasswordHash);
    clearRefreshCookie(req, res);
    return res.json({
      success: true,
      message: "Your password has been updated. You can now sign in with your new password."
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unable to reset password right now."
    });
  }
});
authRouter.get("/me", requireJwtAuth, async (req, res) => {
  try {
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const userRow = await findUserById(userId);
    if (!userRow) {
      return res.status(404).json({ error: "User account not found." });
    }
    return res.json({
      success: true,
      user: toPublicUser(userRow)
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load profile."
    });
  }
});
authRouter.patch(
  "/profile",
  requireJwtAuth,
  async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const existing = await findUserById(userId);
      if (!existing) {
        return res.status(404).json({ error: "User not found." });
      }
      if (parsed.data.backup_email && parsed.data.backup_email.trim().toLowerCase() === existing.email.toLowerCase()) {
        return res.status(400).json({
          error: "Backup recovery email cannot be identical to your primary account email."
        });
      }
      const resolvedRole = ADMIN_EMAILS.has(existing.email) ? "admin" : parsed.data.role || existing.role;
      const updated = await updateUserCreatorProfile(userId, {
        penName: parsed.data.pen_name,
        studioName: parsed.data.studio_name,
        bio: parsed.data.bio,
        avatarUrl: parsed.data.avatar_url,
        role: resolvedRole,
        backupEmail: parsed.data.backup_email === "" ? null : parsed.data.backup_email ?? void 0
      });
      if (!updated) {
        return res.status(500).json({ error: "Failed to update profile." });
      }
      const safeUser = toPublicUser(updated);
      const accessToken = signAccessToken({
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        pen_name: safeUser.pen_name
      });
      return res.json({
        success: true,
        accessToken,
        user: safeUser
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Failed to update profile."
      });
    }
  }
);
authRouter.post("/logout", (req, res) => {
  clearRefreshCookie(req, res);
  return res.json({ success: true, message: "Signed out successfully." });
});

// src/server/creatorRoutes.ts
var import_crypto4 = __toESM(require("crypto"), 1);
var import_express2 = __toESM(require("express"), 1);

// src/db/creator.ts
var import_drizzle_orm2 = require("drizzle-orm");
var tablesInitialized = false;
var tableInitPromise = null;
async function ensureCreatorTables() {
  if (tablesInitialized) return;
  if (tableInitPromise) return tableInitPromise;
  tableInitPromise = (async () => {
    try {
      await withDbRetry(async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS mangas (
            id TEXT PRIMARY KEY,
            creator_id TEXT NOT NULL,
            creator_email TEXT NOT NULL,
            title TEXT NOT NULL,
            synopsis TEXT NOT NULL DEFAULT '',
            cover_url TEXT NOT NULL DEFAULT '',
            genres TEXT NOT NULL DEFAULT '["Action"]',
            age_rating TEXT NOT NULL DEFAULT '13+',
            language TEXT NOT NULL DEFAULT 'English',
            status TEXT NOT NULL DEFAULT 'Draft',
            approval_status TEXT NOT NULL DEFAULT 'pending_review',
            views INTEGER NOT NULL DEFAULT 0,
            likes INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS chapters (
            id TEXT PRIMARY KEY,
            manga_id TEXT NOT NULL,
            creator_id TEXT NOT NULL,
            number INTEGER NOT NULL,
            title TEXT NOT NULL,
            panels TEXT NOT NULL DEFAULT '[]',
            publish_status TEXT NOT NULL DEFAULT 'Coming Soon \u2022 Panels In Production',
            scheduled_for TEXT,
            reads INTEGER NOT NULL DEFAULT 0,
            likes INTEGER NOT NULL DEFAULT 0,
            comments_count INTEGER NOT NULL DEFAULT 0,
            release_date TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS payouts (
            id TEXT PRIMARY KEY,
            creator_id TEXT NOT NULL,
            creator_email TEXT NOT NULL,
            amount_zar DOUBLE PRECISION NOT NULL,
            method TEXT NOT NULL,
            account_reference TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Pending',
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

          CREATE INDEX IF NOT EXISTS idx_mangas_creator_email ON mangas (creator_email);
          CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters (manga_id);
          CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts (creator_id);
        `);
      });
      tablesInitialized = true;
    } catch (error) {
      tableInitPromise = null;
      throw error;
    }
  })();
  return tableInitPromise;
}
async function listCreatorMangas(creatorId, creatorEmail) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const byId = await db.select().from(mangas).where((0, import_drizzle_orm2.eq)(mangas.creatorId, creatorId)).orderBy((0, import_drizzle_orm2.desc)(mangas.updatedAt));
    if (byId.length > 0 || !creatorEmail) {
      return byId;
    }
    return db.select().from(mangas).where((0, import_drizzle_orm2.eq)(mangas.creatorEmail, creatorEmail.trim().toLowerCase())).orderBy((0, import_drizzle_orm2.desc)(mangas.updatedAt));
  });
}
async function listChaptersForCreator(creatorId) {
  await ensureCreatorTables();
  return withDbRetry(
    async () => db.select().from(chapters).where((0, import_drizzle_orm2.eq)(chapters.creatorId, creatorId)).orderBy((0, import_drizzle_orm2.desc)(chapters.createdAt))
  );
}
async function upsertCreatorManga(input) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const now = /* @__PURE__ */ new Date();
    const rows = await db.insert(mangas).values({
      id: input.id,
      creatorId: input.creatorId,
      creatorEmail: input.creatorEmail.trim().toLowerCase(),
      title: input.title,
      synopsis: input.synopsis,
      coverUrl: input.coverUrl,
      genres: JSON.stringify(input.genres),
      ageRating: input.ageRating,
      language: input.language,
      status: input.status,
      approvalStatus: input.approvalStatus || (input.status === "Live" ? "approved" : "pending_review"),
      createdAt: now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: mangas.id,
      set: {
        title: input.title,
        synopsis: input.synopsis,
        coverUrl: input.coverUrl,
        genres: JSON.stringify(input.genres),
        ageRating: input.ageRating,
        language: input.language,
        status: input.status,
        approvalStatus: input.approvalStatus || (input.status === "Live" ? "approved" : "pending_review"),
        updatedAt: now
      }
    }).returning();
    return rows[0];
  });
}
async function updateCreatorMangaRecord(id, creatorId, patch) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db.select().from(mangas).where((0, import_drizzle_orm2.eq)(mangas.id, id)).limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return null;
    }
    const updated = await db.update(mangas).set({
      ...patch,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm2.eq)(mangas.id, id)).returning();
    return updated[0] ?? null;
  });
}
async function deleteCreatorMangaRecord(id, creatorId) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db.select().from(mangas).where((0, import_drizzle_orm2.eq)(mangas.id, id)).limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return false;
    }
    await db.delete(chapters).where((0, import_drizzle_orm2.eq)(chapters.mangaId, id));
    await db.delete(mangas).where((0, import_drizzle_orm2.eq)(mangas.id, id));
    return true;
  });
}
async function createCreatorChapterRecord(input) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const now = /* @__PURE__ */ new Date();
    const rows = await db.insert(chapters).values({
      id: input.id,
      mangaId: input.mangaId,
      creatorId: input.creatorId,
      number: input.number,
      title: input.title,
      panels: JSON.stringify(input.panels),
      publishStatus: input.publishStatus,
      scheduledFor: input.scheduledFor ?? null,
      reads: 0,
      likes: 0,
      commentsCount: 0,
      releaseDate: input.releaseDate,
      createdAt: now,
      updatedAt: now
    }).returning();
    if (input.publishStatus === "Live") {
      await db.update(mangas).set({ status: "Live", approvalStatus: "approved", updatedAt: now }).where((0, import_drizzle_orm2.eq)(mangas.id, input.mangaId));
    } else {
      await db.update(mangas).set({ status: "Coming Soon", updatedAt: now }).where((0, import_drizzle_orm2.eq)(mangas.id, input.mangaId));
    }
    return rows[0];
  });
}
async function publishCreatorChapterRecord(chapterId, creatorId) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db.select().from(chapters).where((0, import_drizzle_orm2.eq)(chapters.id, chapterId)).limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return null;
    }
    const now = /* @__PURE__ */ new Date();
    const updated = await db.update(chapters).set({
      publishStatus: "Live",
      scheduledFor: null,
      updatedAt: now
    }).where((0, import_drizzle_orm2.eq)(chapters.id, chapterId)).returning();
    if (updated[0]) {
      await db.update(mangas).set({ status: "Live", approvalStatus: "approved", updatedAt: now }).where((0, import_drizzle_orm2.eq)(mangas.id, updated[0].mangaId));
    }
    return updated[0] ?? null;
  });
}
async function listCreatorPayouts(creatorId) {
  await ensureCreatorTables();
  return withDbRetry(
    async () => db.select().from(payouts).where((0, import_drizzle_orm2.eq)(payouts.creatorId, creatorId)).orderBy((0, import_drizzle_orm2.desc)(payouts.createdAt))
  );
}
async function listAllPayoutsForAdmin() {
  await ensureCreatorTables();
  return withDbRetry(
    async () => db.select().from(payouts).orderBy((0, import_drizzle_orm2.desc)(payouts.createdAt))
  );
}
async function createCreatorPayoutRecord(input) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const rows = await db.insert(payouts).values({
      id: input.id,
      creatorId: input.creatorId,
      creatorEmail: input.creatorEmail.trim().toLowerCase(),
      amountZar: input.amountZar,
      method: input.method,
      accountReference: input.accountReference,
      status: "Pending",
      paidAt: null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return rows[0];
  });
}
async function updatePayoutStatusRecord(payoutId, status) {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const updated = await db.update(payouts).set({
      status,
      paidAt: status === "Paid" ? /* @__PURE__ */ new Date() : null
    }).where((0, import_drizzle_orm2.eq)(payouts.id, payoutId)).returning();
    return updated[0] ?? null;
  });
}

// src/server/creatorRoutes.ts
var ADMIN_EMAILS2 = /* @__PURE__ */ new Set(["mlungisenimbhele3@gmail.com"]);
var VALID_PAYOUT_METHODS = /* @__PURE__ */ new Set(["Bank", "Capitec", "PayFast"]);
var VALID_ADMIN_PAYOUT_STATUSES = /* @__PURE__ */ new Set(["Pending", "Approved", "Paid"]);
function isAdminUser(user) {
  if (!user) return false;
  const emailLower = (user.email || "").trim().toLowerCase();
  const roleLower = (user.role || "").trim().toLowerCase();
  return ADMIN_EMAILS2.has(emailLower) || roleLower === "admin";
}
function serializePayoutForViewer(row, viewerId, viewerIsAdmin) {
  const canSeeBankDetails = viewerIsAdmin || row.creatorId === viewerId;
  return {
    id: row.id,
    creatorId: row.creatorId,
    creatorEmail: canSeeBankDetails ? row.creatorEmail : "",
    amountZar: row.amountZar,
    method: canSeeBankDetails ? row.method : "Restricted",
    accountReference: canSeeBankDetails ? row.accountReference : "",
    status: row.status === "Processing" ? "Pending" : row.status,
    paidAt: row.paidAt ?? null,
    createdAt: row.createdAt
  };
}
var creatorRouter = import_express2.default.Router();
creatorRouter.use(requireJwtAuth);
creatorRouter.use(async (req, res, next) => {
  const user = req.authUser;
  if (!user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const emailLower = (user.email || "").trim().toLowerCase();
  let effectiveRole = (user.role || "").toLowerCase();
  try {
    const dbUser = await findUserById(user.id);
    if (dbUser?.role) {
      effectiveRole = dbUser.role.toLowerCase();
      user.role = dbUser.role;
    }
  } catch {
  }
  const isCreatorOrAdmin = ADMIN_EMAILS2.has(emailLower) || effectiveRole === "creator" || effectiveRole === "admin";
  if (!isCreatorOrAdmin) {
    return res.status(403).json({
      error: "Creator account required. Please apply to become a Creator first."
    });
  }
  return next();
});
function buildMonthlySeries(totalEarningsZar) {
  const now = /* @__PURE__ */ new Date();
  const weights = [0.11, 0.14, 0.15, 0.18, 0.2, 0.22];
  const points = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const w = weights[5 - i] ?? 0.16;
    const total = Number((totalEarningsZar * w).toFixed(2));
    const adsZar = Number((total * 0.56).toFixed(2));
    const vipZar = Number((total * 0.31).toFixed(2));
    const tipsZar = Number((total * 0.13).toFixed(2));
    points.push({ month: label, adsZar, vipZar, tipsZar, totalZar: total });
  }
  return points;
}
creatorRouter.get("/dashboard", async (req, res) => {
  const user = req.authUser;
  try {
    const [dbMangas, dbChapters, dbPayouts] = await Promise.all([
      listCreatorMangas(user.id, user.email),
      listChaptersForCreator(user.id),
      listCreatorPayouts(user.id)
    ]);
    const totalReads = dbMangas.reduce((acc, m) => acc + (Number(m.views) || 0), 0) + dbChapters.reduce((acc, c) => acc + (Number(c.reads) || 0), 0);
    const totalLikes = dbMangas.reduce((acc, m) => acc + (Number(m.likes) || 0), 0) + dbChapters.reduce((acc, c) => acc + (Number(c.likes) || 0), 0);
    const grossZar = Number(((totalReads * 0.042 + totalLikes * 0.35) * 0.7).toFixed(2));
    const adsZar = Number((grossZar * 0.56).toFixed(2));
    const vipZar = Number((grossZar * 0.31).toFixed(2));
    const tipsZar = Number((grossZar * 0.13).toFixed(2));
    const paidOrPendingZar = dbPayouts.reduce(
      (acc, p) => p.status !== "Rejected" ? acc + (Number(p.amountZar) || 0) : acc,
      0
    );
    const availableBalanceZar = Number(Math.max(0, grossZar - paidOrPendingZar).toFixed(2));
    const monthlySeries = buildMonthlySeries(grossZar);
    const thisMonthZar = monthlySeries[monthlySeries.length - 1]?.totalZar ?? 0;
    return res.status(200).json({
      dbConnected: true,
      mangas: dbMangas.map((m) => ({
        ...m,
        genres: (() => {
          try {
            return JSON.parse(m.genres || '["Action"]');
          } catch {
            return ["Action"];
          }
        })()
      })),
      chapters: dbChapters.map((c) => ({
        ...c,
        panels: (() => {
          try {
            return JSON.parse(c.panels || "[]");
          } catch {
            return [];
          }
        })()
      })),
      payouts: dbPayouts.map(
        (p) => serializePayoutForViewer(p, user.id, isAdminUser(user))
      ),
      earnings: {
        totalZar: grossZar,
        thisMonthZar,
        availableBalanceZar,
        breakdown: { adsZar, vipZar, tipsZar },
        monthlySeries
      },
      audience: {
        totalReads,
        totalLikes
      }
    });
  } catch (error) {
    console.warn("[Creator API] Neon DB unavailable, returning graceful offline dashboard state:", error?.message || error);
    return res.status(200).json({
      dbConnected: false,
      fallbackMode: true,
      mangas: [],
      chapters: [],
      payouts: [],
      earnings: null,
      audience: null
    });
  }
});
creatorRouter.post("/mangas", async (req, res) => {
  const user = req.authUser;
  const {
    id,
    title,
    synopsis,
    coverUrl,
    genres,
    ageRating,
    language,
    status,
    approvalStatus
  } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Manga title is required." });
  }
  const mangaId = typeof id === "string" && id.trim() ? id.trim() : `creator-${user.id}-${Date.now()}`;
  const cleanGenres = Array.isArray(genres) && genres.length > 0 ? genres.map(String) : ["Action"];
  const cleanStatus = status === "Live" || status === "Coming Soon" || status === "Draft" ? status : "Coming Soon";
  try {
    const created = await upsertCreatorManga({
      id: mangaId,
      creatorId: user.id,
      creatorEmail: user.email,
      title: title.trim().slice(0, 140),
      synopsis: typeof synopsis === "string" ? synopsis.trim().slice(0, 2e3) : "",
      coverUrl: typeof coverUrl === "string" ? coverUrl.trim() : "",
      genres: cleanGenres,
      ageRating: typeof ageRating === "string" ? ageRating : "13+",
      language: typeof language === "string" ? language : "English",
      status: cleanStatus,
      approvalStatus: typeof approvalStatus === "string" ? approvalStatus : void 0
    });
    return res.status(201).json({ success: true, dbPersisted: true, manga: created });
  } catch (error) {
    console.warn("[Creator API] POST /mangas DB fallback:", error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
      manga: {
        id: mangaId,
        creatorId: user.id,
        creatorEmail: user.email,
        title: title.trim(),
        status: cleanStatus
      }
    });
  }
});
creatorRouter.patch("/mangas/:id", async (req, res) => {
  const user = req.authUser;
  const mangaId = req.params.id;
  const { title, synopsis, coverUrl, status, approvalStatus } = req.body || {};
  try {
    const updated = await updateCreatorMangaRecord(mangaId, user.id, {
      ...typeof title === "string" ? { title: title.trim().slice(0, 140) } : {},
      ...typeof synopsis === "string" ? { synopsis: synopsis.trim().slice(0, 2e3) } : {},
      ...typeof coverUrl === "string" ? { coverUrl: coverUrl.trim() } : {},
      ...typeof status === "string" ? { status } : {},
      ...typeof approvalStatus === "string" ? { approvalStatus } : {}
    });
    return res.status(200).json({ success: true, dbPersisted: Boolean(updated), manga: updated });
  } catch (error) {
    console.warn("[Creator API] PATCH /mangas DB fallback:", error?.message || error);
    return res.status(200).json({ success: true, dbPersisted: false });
  }
});
creatorRouter.delete("/mangas/:id", async (req, res) => {
  const user = req.authUser;
  const mangaId = req.params.id;
  try {
    const deleted = await deleteCreatorMangaRecord(mangaId, user.id);
    return res.status(200).json({ success: true, dbPersisted: deleted });
  } catch (error) {
    console.warn("[Creator API] DELETE /mangas DB fallback:", error?.message || error);
    return res.status(200).json({ success: true, dbPersisted: false });
  }
});
creatorRouter.post("/chapters", async (req, res) => {
  const user = req.authUser;
  const {
    id,
    mangaId,
    number,
    title,
    panels,
    publishMode,
    scheduledFor,
    releaseDate
  } = req.body || {};
  if (!mangaId || typeof mangaId !== "string") {
    return res.status(400).json({ error: "Target mangaId is required." });
  }
  const chapterNum = Math.max(1, Number(number) || 1);
  const chapterTitle = typeof title === "string" && title.trim() ? title.trim().slice(0, 140) : `Chapter ${chapterNum}`;
  const cleanPanels = Array.isArray(panels) ? panels.filter((p) => p && typeof p.imageUrl === "string" && p.imageUrl.trim()).map((p, idx) => ({
    id: typeof p.id === "string" ? p.id : `p-${idx + 1}`,
    pageNumber: idx + 1,
    imageUrl: String(p.imageUrl)
  })) : [];
  const isLive = publishMode === "live";
  const publishStatus = isLive ? "Live" : "Coming Soon \u2022 Panels In Production";
  const chapterId = typeof id === "string" && id.trim() ? id.trim() : `ch-${mangaId}-${Date.now()}`;
  const cleanReleaseDate = typeof releaseDate === "string" && releaseDate.trim() ? releaseDate.trim() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    const saved = await createCreatorChapterRecord({
      id: chapterId,
      mangaId,
      creatorId: user.id,
      number: chapterNum,
      title: chapterTitle,
      panels: cleanPanels,
      publishStatus,
      scheduledFor: typeof scheduledFor === "string" ? scheduledFor : null,
      releaseDate: cleanReleaseDate
    });
    return res.status(201).json({
      success: true,
      dbPersisted: true,
      chapter: {
        ...saved,
        panels: cleanPanels
      }
    });
  } catch (error) {
    console.warn("[Creator API] POST /chapters DB fallback:", error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
      chapter: {
        id: chapterId,
        mangaId,
        number: chapterNum,
        title: chapterTitle,
        panels: cleanPanels,
        publishStatus,
        scheduledFor: scheduledFor || null,
        releaseDate: cleanReleaseDate
      }
    });
  }
});
creatorRouter.patch("/chapters/:id/publish", async (req, res) => {
  const user = req.authUser;
  const chapterId = req.params.id;
  try {
    const updated = await publishCreatorChapterRecord(chapterId, user.id);
    return res.status(200).json({
      success: true,
      dbPersisted: Boolean(updated),
      chapter: updated
    });
  } catch (error) {
    console.warn("[Creator API] PATCH /chapters/:id/publish DB fallback:", error?.message || error);
    return res.status(200).json({ success: true, dbPersisted: false });
  }
});
creatorRouter.post("/payouts", async (req, res) => {
  const user = req.authUser;
  const { amountZar, method, accountReference } = req.body || {};
  const numericAmount = Number(amountZar);
  if (!Number.isFinite(numericAmount) || numericAmount < 100) {
    return res.status(400).json({ error: "Minimum payout is R100." });
  }
  if (!VALID_PAYOUT_METHODS.has(String(method))) {
    return res.status(400).json({ error: "Payout method must be Bank, Capitec, or PayFast." });
  }
  const cleanRef = typeof accountReference === "string" && accountReference.trim().length >= 3 ? accountReference.trim().slice(0, 120) : "";
  if (!cleanRef) {
    return res.status(400).json({ error: "Please provide your payout account number or PayFast email." });
  }
  const payoutId = `pay-${import_crypto4.default.randomUUID().slice(0, 12)}`;
  const typedMethod = method;
  try {
    const created = await createCreatorPayoutRecord({
      id: payoutId,
      creatorId: user.id,
      creatorEmail: user.email,
      amountZar: Number(numericAmount.toFixed(2)),
      method: typedMethod,
      accountReference: cleanRef
    });
    return res.status(201).json({
      success: true,
      dbPersisted: true,
      message: "Payout request submitted for review. Status: Pending Review (7-14 working days).",
      payout: serializePayoutForViewer(created, user.id, isAdminUser(user))
    });
  } catch (error) {
    console.warn("[Creator API] POST /payouts DB fallback:", error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
      message: "Payout request recorded with status Pending Review (7-14 working days).",
      payout: {
        id: payoutId,
        creatorId: user.id,
        creatorEmail: user.email,
        amountZar: Number(numericAmount.toFixed(2)),
        method: typedMethod,
        accountReference: cleanRef,
        status: "Pending",
        paidAt: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  }
});
creatorRouter.get("/admin/payouts", async (req, res) => {
  const user = req.authUser;
  if (!isAdminUser(user)) {
    return res.status(403).json({
      error: "Forbidden. Creator bank details and payout administration are restricted to the creator and admin."
    });
  }
  try {
    const rows = await listAllPayoutsForAdmin();
    return res.status(200).json({
      success: true,
      dbConnected: true,
      payouts: rows.map((p) => serializePayoutForViewer(p, user.id, true))
    });
  } catch (error) {
    console.warn("[Creator API] GET /admin/payouts DB fallback:", error?.message || error);
    return res.status(200).json({
      success: true,
      dbConnected: false,
      payouts: []
    });
  }
});
creatorRouter.patch("/admin/payouts/:id", async (req, res) => {
  const user = req.authUser;
  if (!isAdminUser(user)) {
    return res.status(403).json({
      error: "Forbidden. Only an admin can review and update creator payout statuses."
    });
  }
  const payoutId = req.params.id;
  const rawStatus = String(req.body?.status || "").trim();
  const normalizedStatus = rawStatus === "Pending Review" ? "Pending" : rawStatus;
  if (!VALID_ADMIN_PAYOUT_STATUSES.has(normalizedStatus)) {
    return res.status(400).json({
      error: "Status must be Pending, Approved, or Paid."
    });
  }
  try {
    const updated = await updatePayoutStatusRecord(
      payoutId,
      normalizedStatus
    );
    if (!updated) {
      return res.status(404).json({ error: "Payout record not found." });
    }
    return res.status(200).json({
      success: true,
      dbPersisted: true,
      payout: serializePayoutForViewer(updated, user.id, true)
    });
  } catch (error) {
    console.warn("[Creator API] PATCH /admin/payouts DB fallback:", error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false
    });
  }
});

// server.ts
dotenv.config();
var SUSPICIOUS_PAYLOAD_REGEX = /<script\b|javascript:|UNION\s+SELECT/i;
var BINARY_SKIP_KEYS = /* @__PURE__ */ new Set(["fileData", "imageBase64", "avatarData"]);
var ALLOWED_COVER_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
var MAX_DECODED_COVER_BYTES = 8 * 1024 * 1024;
function hasSuspiciousPayloadPattern(value, depth = 0) {
  if (depth > 8 || value === null || value === void 0) return false;
  if (typeof value === "string") {
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
  if (typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (SUSPICIOUS_PAYLOAD_REGEX.test(key)) return true;
      if (BINARY_SKIP_KEYS.has(key)) continue;
      if (hasSuspiciousPayloadPattern(entry, depth + 1)) return true;
    }
  }
  return false;
}
process.on("unhandledRejection", (reason) => {
  console.error("[Server Stability] Unhandled Promise Rejection:", reason);
});
async function startServer() {
  const app = (0, import_express3.default)();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; manifest-src 'self'; worker-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googlesyndication.com https://*.google.com https://*.ai.studio; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googlesyndication.com https://*.run.app https://*.ai.studio https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.ai.studio; frame-ancestors 'self' https://*.google.com https://*.run.app https://*.ai.studio;"
    );
    next();
  });
  app.use((req, res, next) => {
    const acceptEncoding = String(req.headers["accept-encoding"] || "");
    if (!acceptEncoding || req.method === "HEAD") {
      return next();
    }
    const supportsGzip = /\bgzip\b/i.test(acceptEncoding);
    const supportsBr = /\bbr\b/i.test(acceptEncoding);
    if (!supportsGzip && !supportsBr) {
      return next();
    }
    const originalJson = res.json.bind(res);
    res.json = ((body) => {
      if (res.headersSent || res.getHeader("Content-Encoding")) {
        return originalJson(body);
      }
      const serialized = JSON.stringify(body);
      if (!serialized || Buffer.byteLength(serialized, "utf8") < 1024) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.send(serialized);
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Vary", "Accept-Encoding");
      const rawBuf = Buffer.from(serialized, "utf8");
      if (supportsBr) {
        import_zlib.default.brotliCompress(
          rawBuf,
          { params: { [import_zlib.default.constants.BROTLI_PARAM_QUALITY]: 4 } },
          (err, compressed) => {
            if (err || res.headersSent) {
              if (!res.headersSent) res.send(rawBuf);
              return;
            }
            res.setHeader("Content-Encoding", "br");
            res.setHeader("Content-Length", String(compressed.length));
            res.end(compressed);
          }
        );
        return res;
      }
      import_zlib.default.gzip(rawBuf, { level: import_zlib.default.constants.Z_BEST_SPEED }, (err, compressed) => {
        if (err || res.headersSent) {
          if (!res.headersSent) res.send(rawBuf);
          return;
        }
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Length", String(compressed.length));
        res.end(compressed);
      });
      return res;
    });
    next();
  });
  app.use((0, import_cookie_parser.default)());
  app.use(import_express3.default.json({ limit: "25mb" }));
  app.use((err, _req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON request payload" });
    }
    if (err && err.type === "entity.too.large") {
      return res.status(413).json({ error: "Request payload exceeds maximum 25MB limit" });
    }
    return next(err);
  });
  const coversStaticPath = import_path.default.join(process.cwd(), "public", "covers");
  app.use(
    "/covers",
    import_express3.default.static(coversStaticPath, {
      maxAge: "7d",
      etag: true,
      immutable: false
    })
  );
  const limiter = (0, import_express_rate_limit2.default)({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"];
      const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip;
      return (0, import_express_rate_limit2.ipKeyGenerator)(rawIp || "127.0.0.1");
    },
    validate: { xForwardedForHeader: false }
  });
  app.use("/api/", limiter);
  const validateApiPayload = (req, res, next) => {
    if (req.body && typeof req.body === "object" && hasSuspiciousPayloadPattern(req.body)) {
      return res.status(400).json({ error: "Malicious payload pattern detected by Defense Shield" });
    }
    next();
  };
  app.use("/api/", validateApiPayload);
  const PORT = 3e3;
  const ADMIN_MASTER_EMAIL = "mlungisenimbhele3@gmail.com";
  const requireAdminSigningAccess = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const claims = verifyPurposeToken(token, "access");
        if (claims.email?.toLowerCase() === ADMIN_MASTER_EMAIL || claims.role === "admin") {
          return next();
        }
      } catch {
      }
    }
    const refreshCookie = req.cookies?.refreshToken;
    if (typeof refreshCookie === "string" && refreshCookie.length > 0) {
      try {
        const claims = verifyPurposeToken(refreshCookie, "refresh");
        if (claims.email?.toLowerCase() === ADMIN_MASTER_EMAIL) {
          return next();
        }
      } catch {
      }
    }
    const adminPassHeader = req.headers["x-az-admin-pass"];
    const expectedPass = process.env.ADMIN_MASTER_PASSWORD || "OVER2026!";
    if (typeof adminPassHeader === "string" && adminPassHeader === expectedPass) {
      return next();
    }
    return res.status(403).json({
      error: "Forbidden: Only Admin (mlungisenimbhele3@gmail.com) can access Google Play signing keys."
    });
  };
  const serveUploadCertificatePem = async (_req, res) => {
    try {
      const certPath = import_path.default.join(process.cwd(), "upload_certificate.pem");
      if (!import_fs.default.existsSync(certPath)) {
        return res.status(404).json({ error: "upload_certificate.pem not found on server" });
      }
      const stat = await import_fs.default.promises.stat(certPath);
      res.setHeader("Content-Type", "application/x-pem-file; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="upload_certificate.pem"');
      res.setHeader("Content-Length", String(stat.size));
      res.setHeader("Cache-Control", "no-store");
      const content = await import_fs.default.promises.readFile(certPath);
      res.end(content);
    } catch (err) {
      console.error("Failed to serve upload_certificate.pem:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download upload_certificate.pem" });
      }
    }
  };
  const serveUploadKeystoreJks = async (_req, res) => {
    try {
      const primaryPath = import_path.default.join(process.cwd(), "upload-keystore.jks");
      const fallbackPath = import_path.default.join(process.cwd(), "android", "app", "upload-keystore.jks");
      const jksPath = import_fs.default.existsSync(primaryPath) ? primaryPath : fallbackPath;
      if (!import_fs.default.existsSync(jksPath)) {
        return res.status(404).json({ error: "upload-keystore.jks not found on server" });
      }
      const stat = await import_fs.default.promises.stat(jksPath);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", 'attachment; filename="upload-keystore.jks"');
      res.setHeader("Content-Length", String(stat.size));
      res.setHeader("Cache-Control", "no-store");
      const content = await import_fs.default.promises.readFile(jksPath);
      res.end(content);
    } catch (err) {
      console.error("Failed to serve upload-keystore.jks:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download upload-keystore.jks" });
      }
    }
  };
  app.get("/upload_certificate.pem", requireAdminSigningAccess, serveUploadCertificatePem);
  app.get("/api/download-upload-certificate", requireAdminSigningAccess, serveUploadCertificatePem);
  app.get("/upload-keystore.jks", requireAdminSigningAccess, serveUploadKeystoreJks);
  app.get("/api/download-upload-keystore", requireAdminSigningAccess, serveUploadKeystoreJks);
  app.get("/api/health", async (_req, res) => {
    try {
      await pingDatabaseWithRetry();
      return res.status(200).json({ db: "connected" });
    } catch (error) {
      console.error("[Health Check] Neon wake-up error:", error);
      return res.status(503).json({
        db: "error",
        error: error?.message || "Database wake timeout"
      });
    }
  });
  app.use("/api/auth", authRouter);
  app.use("/api/creator", creatorRouter);
  app.post("/api/upload-cover", async (req, res) => {
    try {
      const { fileData, fileName } = req.body || {};
      if (!fileData || typeof fileData !== "string") {
        return res.status(400).json({ error: "No image data provided" });
      }
      if (fileData.startsWith("data:") && !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(fileData)) {
        return res.status(400).json({ error: "Unsupported image format" });
      }
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.length === 0 || buffer.length > MAX_DECODED_COVER_BYTES) {
        return res.status(413).json({ error: "Cover image must be under 8MB" });
      }
      const rawExt = typeof fileName === "string" && import_path.default.extname(fileName).toLowerCase() || ".png";
      const cleanExt = ALLOWED_COVER_EXTENSIONS.has(rawExt) ? rawExt : ".png";
      const safeFileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const coversDir = import_path.default.join(process.cwd(), "public", "covers");
      await import_fs.default.promises.mkdir(coversDir, { recursive: true });
      const filePath = import_path.default.join(coversDir, safeFileName);
      await import_fs.default.promises.writeFile(filePath, buffer);
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
      import_express3.default.static(distPath, {
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
  app.use((err, _req, res, _next) => {
    console.error("[Server Error Boundary]:", err);
    if (!res.headersSent) {
      res.status(err?.status || 500).json({
        error: "Internal server error"
      });
    }
  });
  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  httpServer.keepAliveTimeout = 65e3;
  httpServer.headersTimeout = 66e3;
}
startServer();
//# sourceMappingURL=server.cjs.map
