import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  PublicUser,
  toPublicUser,
  findUserByEmail,
  findUserById,
  createUserRecord,
  updateUserVerificationToken,
  markUserEmailVerified,
  setUserPasswordResetToken,
  updateUserPasswordHash,
  updateUserCreatorProfile,
  savePendingTotpSecret,
  activateUserTotp,
  updateUserRecoveryCodes,
  disableUserTotp,
} from '../db/users.ts';
import {
  signAccessToken,
  signRefreshToken,
  signMfaChallengeToken,
  signEmailVerificationToken,
  signPasswordResetToken,
  verifyPurposeToken,
} from './jwt.ts';
import {
  registerInputSchema,
  loginInputSchema,
  loginTwoFactorSchema,
  enableTwoFactorSchema,
  regenerateRecoveryCodesSchema,
  disableTwoFactorSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './validation.ts';
import {
  generateTotpSecret,
  formatManualSecretKey,
  verifyTotpCode,
  buildOtpAuthUri,
  generateTotpQrDataUrl,
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  serializeRecoveryCodeHashes,
  verifyAndConsumeRecoveryCode,
} from './totp.ts';
import { sendVerificationEmail, sendPasswordResetEmail } from './mailer.ts';

const BCRYPT_SALT_ROUNDS = 12;
const REFRESH_COOKIE_NAME = 'refreshToken';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ADMIN_EMAILS = new Set(['mlungisenimbhele3@gmail.com']);

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    email: string;
    role: string;
    pen_name: string;
  };
}

function resolvePublicBaseUrl(req: Request): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  const originHeader =
    typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';

  if (originHeader && /^https?:\/\//i.test(originHeader)) {
    return originHeader.replace(/\/$/, '');
  }

  if (
    configured &&
    configured !== 'https://az-oververse.ai.studio' &&
    /^https?:\/\//i.test(configured)
  ) {
    return configured.replace(/\/$/, '');
  }

  const host = req.get('host') || 'localhost:3000';
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto =
    (typeof forwardedProto === 'string'
      ? forwardedProto.split(',')[0].trim()
      : req.protocol) || 'http';

  const normalizedProto =
    !host.includes('localhost') && !host.includes('127.0.0.1') ? 'https' : proto;

  return `${normalizedProto}://${host}`;
}

function setRefreshCookie(req: Request, res: Response, refreshToken: string): void {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps =
    req.secure ||
    (typeof forwardedProto === 'string' && forwardedProto.includes('https')) ||
    process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: SEVEN_DAYS_MS,
  });
}

function clearRefreshCookie(req: Request, res: Response): void {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps =
    req.secure ||
    (typeof forwardedProto === 'string' && forwardedProto.includes('https')) ||
    process.env.NODE_ENV === 'production';

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/api/auth',
  });
}

function formatZodIssues(issues: Array<{ message: string }>): string {
  return issues[0]?.message || 'Invalid input provided.';
}

/**
 * Strict Rate Limiter: 5 requests per 15 minutes per IP on sensitive auth endpoints.
 */
export const strictAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp =
      typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;
    return `${ipKeyGenerator(rawIp || '127.0.0.1')}:${req.path}`;
  },
  validate: { xForwardedForHeader: false },
});

/**
 * JWT Access Token protection middleware.
 */
export function requireJwtAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const claims = verifyPurposeToken(token, 'access');
    req.authUser = {
      id: claims.sub,
      email: claims.email,
      role: claims.role || 'creator',
      pen_name: claims.pen_name || 'Creator',
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }
}

export const authRouter = express.Router();

/**
 * POST /api/auth/register
 */
authRouter.post('/register', strictAuthRateLimiter, async (req: Request, res: Response) => {
  const parsed = registerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }

  const { email, password, pen_name, studio_name, bio, role } = parsed.data;
  const resolvedRole = ADMIN_EMAILS.has(email) ? 'admin' : role || 'creator';
  const resolvedStudioName = studio_name?.trim() || `${pen_name} Studio`;

  try {
    const existing = await findUserByEmail(email);
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    if (existing) {
      if (existing.emailVerified) {
        return res.status(409).json({
          error: 'An account with this email already exists. Please sign in instead.',
        });
      }

      const verificationToken = signEmailVerificationToken({
        id: existing.id,
        email: existing.email,
      });
      const updatedRow = await updateUserVerificationToken(
        existing.id,
        verificationToken,
        passwordHash,
        pen_name,
        resolvedStudioName
      );

      const baseUrl = resolvePublicBaseUrl(req);
      const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`;
      const emailDispatch = await sendVerificationEmail({
        to: existing.email,
        penName: pen_name,
        verifyUrl,
      });

      const safeUser: PublicUser | null = updatedRow ? toPublicUser(updatedRow) : null;
      return res.status(200).json({
        success: true,
        message: emailDispatch.delivered
          ? 'Verification email resent. Check your inbox to activate your account.'
          : 'Account registered. Open the verification link below to confirm your email.',
        emailDelivered: emailDispatch.delivered,
        previewVerificationUrl: emailDispatch.fallbackPreviewUrl,
        user: safeUser,
      });
    }

    const userId = crypto.randomUUID();
    const verificationToken = signEmailVerificationToken({
      id: userId,
      email,
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
      role: resolvedRole,
    });

    const baseUrl = resolvePublicBaseUrl(req);
    const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`;
    const emailDispatch = await sendVerificationEmail({
      to: email,
      penName: pen_name,
      verifyUrl,
    });

    return res.status(201).json({
      success: true,
      message: emailDispatch.delivered
        ? 'Account created! Check your email for the verification link.'
        : 'Account created! Confirm your email using the verification link below.',
      emailDelivered: emailDispatch.delivered,
      previewVerificationUrl: emailDispatch.fallbackPreviewUrl,
      user: toPublicUser(createdRow),
    });
  } catch (error: any) {
    if (error?.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }
    return res.status(500).json({
      error: error?.message || 'Unable to complete registration right now.',
    });
  }
});

/**
 * POST /api/auth/resend-verification
 */
authRouter.post(
  '/resend-verification',
  strictAuthRateLimiter,
  async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }

    try {
      const user = await findUserByEmail(parsed.data.email);
      if (!user) {
        return res.json({
          success: true,
          message: 'If that account exists and is unverified, a verification link has been sent.',
        });
      }

      if (user.emailVerified) {
        return res.json({
          success: true,
          alreadyVerified: true,
          message: 'Your email is already verified. You can sign in right away.',
        });
      }

      const verificationToken = signEmailVerificationToken({
        id: user.id,
        email: user.email,
      });
      await updateUserVerificationToken(user.id, verificationToken);

      const baseUrl = resolvePublicBaseUrl(req);
      const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`;
      const emailDispatch = await sendVerificationEmail({
        to: user.email,
        penName: user.penName,
        verifyUrl,
      });

      return res.json({
        success: true,
        emailDelivered: emailDispatch.delivered,
        previewVerificationUrl: emailDispatch.fallbackPreviewUrl,
        message: emailDispatch.delivered
          ? 'Fresh verification link sent to your email.'
          : 'Fresh verification link generated below.',
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Unable to resend verification link.',
      });
    }
  }
);

/**
 * GET /api/auth/verify?token=xxx
 */
authRouter.get('/verify', async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    return res.status(400).json({ error: 'Missing verification token.' });
  }

  try {
    let claims;
    try {
      claims = verifyPurposeToken(token, 'email_verify');
    } catch {
      return res.status(400).json({
        error: 'Verification link is invalid or has expired. Request a new verification email.',
      });
    }

    const existing = await findUserById(claims.sub);
    if (!existing) {
      return res.status(404).json({ error: 'Account not found for this verification token.' });
    }

    if (existing.emailVerified) {
      return res.json({
        success: true,
        verified: true,
        message: 'Email verified',
        user: toPublicUser(existing),
      });
    }

    if (existing.verificationToken && existing.verificationToken !== token) {
      return res.status(400).json({
        error: 'A newer verification link was issued. Please use the latest email link.',
      });
    }

    const updated = await markUserEmailVerified(existing.id);
    if (!updated) {
      return res.status(500).json({ error: 'Could not update email verification state.' });
    }

    return res.json({
      success: true,
      verified: true,
      message: 'Email verified',
      user: toPublicUser(updated),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Failed to verify email address.',
    });
  }
});

/**
 * POST /api/auth/login
 * - Checks password + email_verified
 * - If creator account has TOTP 2FA enabled (totp_enabled === true), requires 6-digit TOTP code:
 *   either returns { requiresTwoFactor: true, mfaToken } for step 2, or verifies inline totpCode.
 */
authRouter.post('/login', strictAuthRateLimiter, async (req: Request, res: Response) => {
  const parsed = loginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }

  const { email, password, totpCode } = parsed.data;

  try {
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, userRow.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!userRow.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email address before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: userRow.email,
      });
    }

    const isCreatorOrAdmin = userRow.role === 'creator' || userRow.role === 'admin';
    if (isCreatorOrAdmin && userRow.totpEnabled && userRow.totpSecret) {
      if (!totpCode) {
        const mfaToken = signMfaChallengeToken({
          id: userRow.id,
          email: userRow.email,
        });
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          mfaToken,
          email: userRow.email,
          message: 'Enter the 6-digit code from your authenticator app.',
        });
      }

      const plainSecret = decryptTotpSecret(userRow.totpSecret);
      if (!verifyTotpCode(plainSecret, totpCode)) {
        return res.status(401).json({
          error: 'Invalid 6-digit authenticator code.',
          code: 'INVALID_TOTP_CODE',
        });
      }
    }

    const safeUser = toPublicUser(userRow);
    const accessToken = signAccessToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      pen_name: safeUser.pen_name,
    });
    const refreshToken = signRefreshToken({
      id: safeUser.id,
      email: safeUser.email,
    });

    setRefreshCookie(req, res, refreshToken);

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Unable to sign in right now.',
    });
  }
});

/**
 * POST /api/auth/login/2fa
 * Verifies the 5-minute mfaToken + 6-digit authenticator code and completes login.
 */
authRouter.post('/login/2fa', strictAuthRateLimiter, async (req: Request, res: Response) => {
  const parsed = loginTwoFactorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }

  const { mfaToken, code } = parsed.data;

  try {
    let claims;
    try {
      claims = verifyPurposeToken(mfaToken, 'mfa_challenge');
    } catch {
      return res.status(401).json({
        error: 'Two-factor session expired. Please enter your email and password again.',
        code: 'MFA_CHALLENGE_EXPIRED',
      });
    }

    const userRow = await findUserById(claims.sub);
    if (!userRow || !userRow.emailVerified || !userRow.totpEnabled || !userRow.totpSecret) {
      return res.status(401).json({
        error: 'Two-factor verification could not be completed for this account.',
      });
    }

    const trimmedCode = code.trim();
    const isSixDigitTotp = /^\d{6}$/.test(trimmedCode);
    let updatedUserRow = userRow;
    let usedRecoveryCode = false;
    let remainingRecoveryCodes: number | undefined;

    if (isSixDigitTotp) {
      const plainSecret = decryptTotpSecret(userRow.totpSecret);
      if (!verifyTotpCode(plainSecret, trimmedCode)) {
        return res.status(401).json({
          error: 'Invalid 6-digit authenticator code. Please check your app and try again.',
          code: 'INVALID_TOTP_CODE',
        });
      }
    } else {
      const consumed = verifyAndConsumeRecoveryCode(userRow.totpRecoveryCodes, trimmedCode);
      if (!consumed.matched) {
        return res.status(401).json({
          error: 'Invalid or already-used recovery code.',
          code: 'INVALID_RECOVERY_CODE',
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
      pen_name: safeUser.pen_name,
    });
    const refreshToken = signRefreshToken({
      id: safeUser.id,
      email: safeUser.email,
    });

    setRefreshCookie(req, res, refreshToken);

    return res.json({
      success: true,
      usedRecoveryCode,
      remainingRecoveryCodes,
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Unable to verify authenticator code right now.',
    });
  }
});

/**
 * POST /api/auth/2fa/setup
 * Protected route for creator accounts: generates a fresh TOTP secret + QR code + manual Base32 key.
 */
authRouter.post(
  '/2fa/setup',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const userRow = await findUserById(userId);
      if (!userRow) {
        return res.status(404).json({ error: 'Account not found.' });
      }

      if (userRow.role !== 'creator' && userRow.role !== 'admin') {
        return res.status(403).json({
          error: 'Two-Factor Authentication is available for Creator accounts. Switch your role to Creator in Profile Settings first.',
        });
      }

      const base32Secret = generateTotpSecret(20);
      const encryptedPending = encryptTotpSecret(base32Secret);
      await savePendingTotpSecret(userRow.id, encryptedPending);

      const otpauthUrl = buildOtpAuthUri({
        accountEmail: userRow.email,
        base32Secret,
        issuer: 'AZ OVERVERSE',
      });
      const qrCodeDataUrl = await generateTotpQrDataUrl(otpauthUrl);

      return res.json({
        success: true,
        otpauthUrl,
        qrCodeDataUrl,
        manualEntryKey: formatManualSecretKey(base32Secret),
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Unable to initialize authenticator setup.',
      });
    }
  }
);

/**
 * POST /api/auth/2fa/enable
 * Protected route: verifies 6-digit code from authenticator app and enables 2FA on the creator account.
 */
authRouter.post(
  '/2fa/enable',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = enableTwoFactorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }

    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const userRow = await findUserById(userId);
      if (!userRow) {
        return res.status(404).json({ error: 'Account not found.' });
      }

      if (userRow.role !== 'creator' && userRow.role !== 'admin') {
        return res.status(403).json({
          error: 'Only Creator accounts can enable Two-Factor Authentication.',
        });
      }

      if (!userRow.totpPendingSecret) {
        return res.status(400).json({
          error: 'Start authenticator setup first to generate a QR code.',
        });
      }

      const plainPendingSecret = decryptTotpSecret(userRow.totpPendingSecret);
      if (!verifyTotpCode(plainPendingSecret, parsed.data.code)) {
        return res.status(400).json({
          error: 'Invalid 6-digit code. Ensure your device clock is accurate and enter the latest code.',
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
        return res.status(500).json({ error: 'Could not activate Two-Factor Authentication.' });
      }

      return res.json({
        success: true,
        message:
          'Two-Factor Authentication is now enabled. Store your one-time recovery codes in a safe place.',
        recoveryCodes,
        user: toPublicUser(updated),
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Failed to enable Two-Factor Authentication.',
      });
    }
  }
);

/**
 * POST /api/auth/2fa/recovery-codes/regenerate
 * Protected route: verifies a live 6-digit TOTP code and issues a fresh set of 8 one-time recovery codes,
 * invalidating any previously issued recovery codes.
 */
authRouter.post(
  '/2fa/recovery-codes/regenerate',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = regenerateRecoveryCodesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }

    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const userRow = await findUserById(userId);
      if (!userRow || !userRow.totpEnabled || !userRow.totpSecret) {
        return res.status(400).json({
          error: 'Two-Factor Authentication must be enabled before regenerating recovery codes.',
        });
      }

      const plainSecret = decryptTotpSecret(userRow.totpSecret);
      if (!verifyTotpCode(plainSecret, parsed.data.code)) {
        return res.status(401).json({
          error: 'Invalid 6-digit authenticator code.',
        });
      }

      const recoveryCodes = generateRecoveryCodes(8);
      const recoveryCodesHashesJson = serializeRecoveryCodeHashes(recoveryCodes);
      const updated = await updateUserRecoveryCodes(userRow.id, recoveryCodesHashesJson);
      if (!updated) {
        return res.status(500).json({ error: 'Could not regenerate recovery codes.' });
      }

      return res.json({
        success: true,
        message: 'Generated 8 new one-time recovery codes. Previous recovery codes are now invalid.',
        recoveryCodes,
        user: toPublicUser(updated),
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Failed to regenerate recovery codes.',
      });
    }
  }
);

/**
 * POST /api/auth/2fa/disable
 * Protected route: verifies account password + current 6-digit authenticator code (or recovery code) and disables 2FA.
 */
authRouter.post(
  '/2fa/disable',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = disableTwoFactorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }

    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const userRow = await findUserById(userId);
      if (!userRow || !userRow.totpEnabled || !userRow.totpSecret) {
        return res.status(400).json({
          error: 'Two-Factor Authentication is not currently enabled on this account.',
        });
      }

      const passwordValid = await bcrypt.compare(parsed.data.password, userRow.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({
          error: 'Incorrect account password.',
        });
      }

      const trimmedCode = parsed.data.code.trim();
      if (/^\d{6}$/.test(trimmedCode)) {
        const plainSecret = decryptTotpSecret(userRow.totpSecret);
        if (!verifyTotpCode(plainSecret, trimmedCode)) {
          return res.status(401).json({
            error: 'Invalid 6-digit authenticator code.',
          });
        }
      } else {
        const consumed = verifyAndConsumeRecoveryCode(userRow.totpRecoveryCodes, trimmedCode);
        if (!consumed.matched) {
          return res.status(401).json({
            error: 'Invalid or already-used recovery code.',
          });
        }
      }

      const updated = await disableUserTotp(userRow.id);
      if (!updated) {
        return res.status(500).json({ error: 'Could not disable Two-Factor Authentication.' });
      }

      return res.json({
        success: true,
        message: 'Two-Factor Authentication has been disabled.',
        user: toPublicUser(updated),
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Failed to disable Two-Factor Authentication.',
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const cookieToken =
    typeof req.cookies?.[REFRESH_COOKIE_NAME] === 'string'
      ? req.cookies[REFRESH_COOKIE_NAME].trim()
      : '';
  const bodyToken =
    typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '';
  const rawToken = cookieToken || bodyToken;

  if (!rawToken) {
    return res.status(401).json({ error: 'No active refresh session.' });
  }

  try {
    let claims;
    try {
      claims = verifyPurposeToken(rawToken, 'refresh');
    } catch {
      clearRefreshCookie(req, res);
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    const userRow = await findUserById(claims.sub);
    if (!userRow || !userRow.emailVerified) {
      clearRefreshCookie(req, res);
      return res.status(401).json({ error: 'Account session is no longer active.' });
    }

    const safeUser = toPublicUser(userRow);
    const accessToken = signAccessToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      pen_name: safeUser.pen_name,
    });

    return res.json({
      success: true,
      accessToken,
      user: safeUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Failed to refresh session.',
    });
  }
});

/**
 * POST /api/auth/forgot
 */
authRouter.post('/forgot', strictAuthRateLimiter, async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }

  try {
    const userRow = await findUserByEmail(parsed.data.email);
    if (!userRow) {
      return res.json({
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.',
      });
    }

    const resetToken = signPasswordResetToken({
      id: userRow.id,
      email: userRow.email,
    });
    await setUserPasswordResetToken(userRow.id, resetToken);

    const baseUrl = resolvePublicBaseUrl(req);
    const resetUrl = `${baseUrl}/reset?token=${encodeURIComponent(resetToken)}`;
    const emailDispatch = await sendPasswordResetEmail({
      to: userRow.email,
      penName: userRow.penName,
      resetUrl,
    });

    return res.json({
      success: true,
      emailDelivered: emailDispatch.delivered,
      previewResetUrl: emailDispatch.fallbackPreviewUrl,
      message: emailDispatch.delivered
        ? 'If an account exists for that email, a password reset link has been sent.'
        : 'Password reset link generated below.',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Unable to process password reset request.',
    });
  }
});

/**
 * POST /api/auth/reset
 */
authRouter.post('/reset', strictAuthRateLimiter, async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
  }

  const { token, password } = parsed.data;

  try {
    let claims;
    try {
      claims = verifyPurposeToken(token, 'password_reset');
    } catch {
      return res.status(400).json({
        error: 'Password reset link is invalid or has expired. Request a new reset link.',
      });
    }

    const userRow = await findUserById(claims.sub);
    if (!userRow || !userRow.resetToken || userRow.resetToken !== token) {
      return res.status(400).json({
        error: 'This password reset link has already been used or replaced.',
      });
    }

    const newPasswordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await updateUserPasswordHash(userRow.id, newPasswordHash);
    clearRefreshCookie(req, res);

    return res.json({
      success: true,
      message: 'Your password has been updated. You can now sign in with your new password.',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Unable to reset password right now.',
    });
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', requireJwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const userRow = await findUserById(userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      success: true,
      user: toPublicUser(userRow),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Failed to load profile.',
    });
  }
});

/**
 * PATCH /api/auth/profile
 */
authRouter.patch(
  '/profile',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodIssues(parsed.error.issues) });
    }

    try {
      const userId = req.authUser?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const existing = await findUserById(userId);
      if (!existing) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const resolvedRole = ADMIN_EMAILS.has(existing.email)
        ? 'admin'
        : parsed.data.role || (existing.role as 'reader' | 'creator');

      const updated = await updateUserCreatorProfile(userId, {
        penName: parsed.data.pen_name,
        studioName: parsed.data.studio_name,
        bio: parsed.data.bio,
        avatarUrl: parsed.data.avatar_url,
        role: resolvedRole,
      });

      if (!updated) {
        return res.status(500).json({ error: 'Failed to update profile.' });
      }

      const safeUser = toPublicUser(updated);
      const accessToken = signAccessToken({
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        pen_name: safeUser.pen_name,
      });

      return res.json({
        success: true,
        accessToken,
        user: safeUser,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Failed to update profile.',
      });
    }
  }
);

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  clearRefreshCookie(req, res);
  return res.json({ success: true, message: 'Signed out successfully.' });
});
