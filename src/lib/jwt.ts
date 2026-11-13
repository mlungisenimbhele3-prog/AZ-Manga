import jwt, { JwtPayload } from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET is missing from environment variables. Please define JWT_SECRET in your .env file.'
    );
  }
  return secret;
}

export type TokenPurpose = 'access' | 'refresh' | 'verify' | 'reset';

export interface OververseTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: 'reader' | 'creator';
  pen_name: string;
  purpose: TokenPurpose;
}

export function signAccessToken(user: {
  id: string;
  email: string;
  role: 'reader' | 'creator';
  pen_name: string;
}): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, pen_name: user.pen_name, purpose: 'access' },
    getJwtSecret(),
    { expiresIn: '15m' }
  );
}

export function signRefreshToken(user: {
  id: string;
  email: string;
  role: 'reader' | 'creator';
  pen_name: string;
}): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, pen_name: user.pen_name, purpose: 'refresh' },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function signVerificationToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, purpose: 'verify' }, getJwtSecret(), {
    expiresIn: '1d',
  });
}

export function signPasswordResetToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, purpose: 'reset' }, getJwtSecret(), {
    expiresIn: '1h',
  });
}

export function verifyToken(token: string, expectedPurpose: TokenPurpose): OververseTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as OververseTokenPayload;
  if (decoded.purpose !== expectedPurpose || !decoded.sub) {
    throw new Error('Invalid token purpose');
  }
  return decoded;
}
