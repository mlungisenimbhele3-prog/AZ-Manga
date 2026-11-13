import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

export type TokenPurpose =
  | 'access'
  | 'refresh'
  | 'email_verify'
  | 'password_reset'
  | 'mfa_challenge';

export interface OververseJwtClaims extends JwtPayload {
  sub: string;
  email: string;
  role?: string;
  pen_name?: string;
  purpose: TokenPurpose;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET is missing from environment variables. Please define JWT_SECRET in your .env file.'
    );
  }
  return secret;
}

export function getDerivedEncryptionKey(): Buffer {
  return crypto
    .createHash('sha256')
    .update(`oververse-totp-aes256:${getJwtSecret()}`)
    .digest();
}

/**
 * Signs a short-lived 15-minute Access Token.
 */
export function signAccessToken(user: {
  id: string;
  email: string;
  role: string;
  pen_name: string;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      pen_name: user.pen_name,
      purpose: 'access' satisfies TokenPurpose,
    },
    getJwtSecret(),
    { expiresIn: '15m', issuer: 'az-oververse' }
  );
}

/**
 * Signs a 7-day Refresh Token (delivered via httpOnly cookie).
 */
export function signRefreshToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: 'refresh' satisfies TokenPurpose,
    },
    getJwtSecret(),
    { expiresIn: '7d', issuer: 'az-oververse' }
  );
}

/**
 * Signs a 5-minute MFA (TOTP 2FA) login challenge token.
 * Cannot be used on protected routes that require purpose === 'access'.
 */
export function signMfaChallengeToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: 'mfa_challenge' satisfies TokenPurpose,
    },
    getJwtSecret(),
    { expiresIn: '5m', issuer: 'az-oververse' }
  );
}

/**
 * Signs a 1-day Email Verification Token.
 */
export function signEmailVerificationToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: 'email_verify' satisfies TokenPurpose,
    },
    getJwtSecret(),
    { expiresIn: '1d', issuer: 'az-oververse' }
  );
}

/**
 * Signs a 1-hour Password Reset Token.
 */
export function signPasswordResetToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: 'password_reset' satisfies TokenPurpose,
    },
    getJwtSecret(),
    { expiresIn: '1h', issuer: 'az-oververse' }
  );
}

export function verifyPurposeToken(
  token: string,
  expectedPurpose: TokenPurpose
): OververseJwtClaims {
  const decoded = jwt.verify(token, getJwtSecret(), {
    issuer: 'az-oververse',
  }) as OververseJwtClaims;

  if (!decoded || typeof decoded.sub !== 'string' || decoded.purpose !== expectedPurpose) {
    throw new Error('Invalid token purpose or subject.');
  }

  return decoded;
}
