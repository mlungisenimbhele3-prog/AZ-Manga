# AZ OVERVERSE — Next.js 14 App Router + Neon Postgres + Prisma Custom Auth Blueprint

This standalone blueprint packages the exact **AZ OVERVERSE** custom authentication architecture (inspired by **WEBTOON Canvas** and **MANGA Plus Creators by SHUEISHA**) as a copy-pasteable **Next.js 14 App Router + Neon PostgreSQL + Prisma ORM** codebase with **zero Firebase, zero Firestore, and zero Supabase Auth**.

---

## 1. File Structure

```text
az-oververse-nextjs-auth/
├── .env.example
├── package.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   ├── rate-limit.ts
│   │   ├── validation.ts
│   │   └── mailer.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── verify/
│   │   │   └── page.tsx
│   │   ├── forgot/
│   │   │   └── page.tsx
│   │   ├── reset/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── api/
│   │       └── auth/
│   │           ├── register/
│   │           │   └── route.ts
│   │           ├── verify/
│   │           │   └── route.ts
│   │           ├── login/
│   │           │   └── route.ts
│   │           ├── refresh/
│   │           │   └── route.ts
│   │           ├── forgot/
│   │           │   └── route.ts
│   │           ├── reset/
│   │           │   └── route.ts
│   │           ├── me/
│   │           │   └── route.ts
│   │           └── logout/
│   │               └── route.ts
└── README.md
```

---

## 2. Environment Variables (`.env.example` for Next.js + Neon)

```env
# Neon Serverless Postgres pooled & direct URLs
DATABASE_URL="postgresql://neondb_owner:password@ep-example-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# 256-bit random secret (generate via: openssl rand -hex 32)
JWT_SECRET="replace-with-a-64-char-hex-secret"

# Resend Transactional Email API Key (https://resend.com/api-keys)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="AZ OVERVERSE <auth@yourdomain.com>"

# Public App URL used in email verification & password reset links
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 3. Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  reader
  creator
}

model User {
  id                 String   @id @default(uuid()) @db.Uuid
  email              String   @unique
  password_hash      String
  pen_name           String
  bio                String   @default("")
  avatar_url         String?
  email_verified     Boolean  @default(false)
  verification_token String?
  reset_token        String?
  role               UserRole @default(creator)
  created_at         DateTime @default(now())

  @@index([email])
  @@map("users")
}
```

---

## 4. Core Libraries (`src/lib/*`)

### `src/lib/prisma.ts`
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function sanitizeUser<T extends { password_hash?: unknown; verification_token?: unknown; reset_token?: unknown }>(
  user: T
) {
  const { password_hash: _pw, verification_token: _vt, reset_token: _rt, ...safeUser } = user;
  return safeUser;
}
```

### `src/lib/jwt.ts`
```ts
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
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
    JWT_SECRET,
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
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function signVerificationToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, purpose: 'verify' }, JWT_SECRET, {
    expiresIn: '1d',
  });
}

export function signPasswordResetToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, purpose: 'reset' }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

export function verifyToken(token: string, expectedPurpose: TokenPurpose): OververseTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as OververseTokenPayload;
  if (decoded.purpose !== expectedPurpose || !decoded.sub) {
    throw new Error('Invalid token purpose');
  }
  return decoded;
}
```

### `src/lib/rate-limit.ts`
```ts
import { NextRequest } from 'next/server';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkAuthRateLimit(req: NextRequest, scope: string): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
  const key = `${scope}:${ip}`;
  const now = Date.now();

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  existing.count += 1;
  if (existing.count > MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSec: 0 };
}
```

### `src/lib/validation.ts`
```ts
import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string().optional(),
    pen_name: z.string().trim().min(2, 'Pen name must be at least 2 characters').max(60),
    role: z.enum(['reader', 'creator']).default('creator'),
  })
  .refine((d) => !d.confirmPassword || d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});
```

### `src/lib/mailer.ts`
```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AZ OVERVERSE <onboarding@resend.dev>';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export async function sendVerificationEmail(params: {
  to: string;
  penName: string;
  token: string;
}) {
  const verifyUrl = `${APP_URL}/verify?token=${encodeURIComponent(params.token)}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: [params.to],
    subject: 'Verify your AZ OVERVERSE Creator Account',
    html: `
      <div style="font-family:Inter,sans-serif;background:#09090b;color:#f4f4f5;padding:32px;border-radius:16px">
        <p style="color:#00DC64;font-weight:700;font-size:12px;letter-spacing:0.12em">AZ OVERVERSE CANVAS</p>
        <h1 style="margin:8px 0 16px;font-size:24px">Welcome, ${params.penName}</h1>
        <p style="color:#a1a1aa;line-height:1.6">Confirm your email within 24 hours to activate your AZ OVERVERSE account:</p>
        <p style="margin:24px 0">
          <a href="${verifyUrl}" style="background:#00DC64;color:#09090b;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;display:inline-block">Verify Email</a>
        </p>
        <p style="font-size:12px;color:#71717a;word-break:break-all">${verifyUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  penName: string;
  token: string;
}) {
  const resetUrl = `${APP_URL}/reset?token=${encodeURIComponent(params.token)}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: [params.to],
    subject: 'Reset your AZ OVERVERSE password',
    html: `
      <div style="font-family:Inter,sans-serif;background:#09090b;color:#f4f4f5;padding:32px;border-radius:16px">
        <p style="color:#00DC64;font-weight:700;font-size:12px;letter-spacing:0.12em">AZ OVERVERSE SECURITY</p>
        <h1 style="margin:8px 0 16px;font-size:24px">Reset Password</h1>
        <p style="color:#a1a1aa;line-height:1.6">Hi ${params.penName}, click below within 1 hour to choose a new password:</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#00DC64;color:#09090b;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;display:inline-block">Reset Password</a>
        </p>
        <p style="font-size:12px;color:#71717a;word-break:break-all">${resetUrl}</p>
      </div>
    `,
  });
}
```

---

## 5. Next.js 14 API Routes (`src/app/api/auth/*`)

### `POST /api/auth/register` (`src/app/api/auth/register/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, sanitizeUser } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { signVerificationToken } from '@/lib/jwt';
import { sendVerificationEmail } from '@/lib/mailer';
import { checkAuthRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkAuthRateLimit(req, 'register');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password, pen_name, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: {
      email,
      password_hash,
      pen_name,
      role,
      email_verified: false,
    },
  });

  const verification_token = signVerificationToken({ id: created.id, email: created.email });
  const updated = await prisma.user.update({
    where: { id: created.id },
    data: { verification_token },
  });

  await sendVerificationEmail({
    to: updated.email,
    penName: updated.pen_name,
    token: verification_token,
  });

  return NextResponse.json(
    {
      message: 'Account created. Check your inbox to verify your email.',
      user: sanitizeUser(updated),
    },
    { status: 201 }
  );
}
```

### `GET /api/auth/verify` (`src/app/api/auth/verify/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, sanitizeUser } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  if (!token) {
    return NextResponse.json({ error: 'Missing verification token.' }, { status: 400 });
  }

  try {
    const decoded = verifyToken(token, 'verify');
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (!user.email_verified && user.verification_token !== token) {
      return NextResponse.json({ error: 'Verification link superseded or invalid.' }, { status: 400 });
    }

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: { email_verified: true, verification_token: null },
    });

    return NextResponse.json({ message: 'Email verified', user: sanitizeUser(verified) });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
  }
}
```

### `POST /api/auth/login` (`src/app/api/auth/login/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, sanitizeUser } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { checkAuthRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkAuthRateLimit(req, 'login');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const match = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!match) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  if (!user.email_verified) {
    return NextResponse.json(
      { error: 'Please verify your email before signing in.', code: 'EMAIL_NOT_VERIFIED' },
      { status: 403 }
    );
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const res = NextResponse.json({
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });

  res.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return res;
}
```

### `POST /api/auth/refresh` (`src/app/api/auth/refresh/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, sanitizeUser } from '@/lib/prisma';
import { verifyToken, signAccessToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawRefresh = req.cookies.get('refreshToken')?.value || body?.refreshToken || '';

  if (!rawRefresh) {
    return NextResponse.json({ error: 'Missing refresh token.' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(rawRefresh, 'refresh');
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.email_verified) {
      return NextResponse.json({ error: 'Session is no longer valid.' }, { status: 401 });
    }

    const accessToken = signAccessToken(user);
    return NextResponse.json({ accessToken, user: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ error: 'Expired or invalid refresh token.' }, { status: 401 });
  }
}
```

### `POST /api/auth/forgot` (`src/app/api/auth/forgot/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotSchema } from '@/lib/validation';
import { signPasswordResetToken } from '@/lib/jwt';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { checkAuthRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkAuthRateLimit(req, 'forgot');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const reset_token = signPasswordResetToken({ id: user.id, email: user.email });
    await prisma.user.update({ where: { id: user.id }, data: { reset_token } });
    await sendPasswordResetEmail({
      to: user.email,
      penName: user.pen_name,
      token: reset_token,
    });
  }

  return NextResponse.json({
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
}
```

### `POST /api/auth/reset` (`src/app/api/auth/reset/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resetSchema } from '@/lib/validation';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const decoded = verifyToken(parsed.data.token, 'reset');
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || user.reset_token !== parsed.data.token) {
      return NextResponse.json({ error: 'Invalid or already used reset token.' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, reset_token: null, email_verified: true },
    });

    return NextResponse.json({ message: 'Password updated. You can now sign in.' });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
  }
}
```

### `GET /api/auth/me` & `POST /api/auth/logout`
```ts
// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, sanitizeUser } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing access token.' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token, 'access');
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired access token.' }, { status: 401 });
  }
}
```

```ts
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.delete('refreshToken');
  return res;
}
```

---

## 6. Next.js 14 Frontend Pages (Dark WEBTOON Canvas Theme)

### `src/app/register/page.tsx`
```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [penName, setPenName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ error?: string; message?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({});
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pen_name: penName, password, confirmPassword, role: 'creator' }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setStatus({ error: data.error || 'Registration failed' });
    setStatus({ message: data.message });
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 space-y-6">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#00DC64]">AZ OVERVERSE CANVAS</p>
          <h1 className="text-2xl font-bold mt-1">Create Creator Account</h1>
        </div>
        {status.message ? (
          <div className="rounded-xl border border-[#00DC64]/40 bg-[#00DC64]/10 p-4 text-sm text-emerald-200">
            {status.message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
                {status.error}
              </div>
            )}
            <input
              type="text"
              required
              placeholder="Pen Name (Creator Nickname)"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-[#00DC64] focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="creator@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-[#00DC64] focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-[#00DC64] focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-[#00DC64] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#00DC64] hover:bg-[#00c458] text-zinc-950 font-bold py-3 text-sm transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
        <p className="text-xs text-zinc-400 text-center">
          Already registered? <Link href="/login" className="text-[#00DC64] font-semibold">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
```

### `src/app/login/page.tsx`
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Login failed');
    sessionStorage.setItem('az_access_token', data.accessToken);
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 space-y-6">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#00DC64]">AZ OVERVERSE</p>
          <h1 className="text-2xl font-bold mt-1">Sign In to Creator Studio</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
              {error}
            </div>
          )}
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-[#00DC64] focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-[#00DC64] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#00DC64] hover:bg-[#00c458] text-zinc-950 font-bold py-3 text-sm transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="flex justify-between text-xs text-zinc-400">
          <Link href="/forgot" className="hover:text-white">Forgot password?</Link>
          <Link href="/register" className="text-[#00DC64] font-semibold">Create account</Link>
        </div>
      </div>
    </main>
  );
}
```

### `src/app/verify/page.tsx`
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState<'loading' | 'verified' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying email...');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing verification token.');
      return;
    }
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Verification failed');
        setState('verified');
        setMessage('Email verified');
      })
      .catch((err) => {
        setState('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center space-y-5">
        <h1 className="text-2xl font-bold">{message}</h1>
        {state === 'verified' && (
          <Link
            href="/login"
            className="inline-block rounded-xl bg-[#00DC64] text-zinc-950 font-bold px-6 py-3 text-sm"
          >
            Continue to Sign In
          </Link>
        )}
      </div>
    </main>
  );
}
```

### `src/app/dashboard/page.tsx`
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SafeUser {
  id: string;
  email: string;
  pen_name: string;
  role: 'reader' | 'creator';
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      let token = sessionStorage.getItem('az_access_token');
      if (!token) {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshRes.ok) return router.replace('/login');
        const refreshData = await refreshRes.json();
        token = refreshData.accessToken;
        sessionStorage.setItem('az_access_token', token!);
      }

      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) return router.replace('/login');
      const meData = await meRes.json();
      setUser(meData.user);
    }
    loadUser();
  }, [router]);

  async function handleLogout() {
    sessionStorage.removeItem('az_access_token');
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#09090b] text-zinc-400 flex items-center justify-center text-sm">
        Checking session...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-6 sm:p-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00DC64]">{user.role}</p>
          <h1 className="text-3xl font-bold mt-1">{user.pen_name}</h1>
          <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
```

---

## 7. Run Locally & Deploy to Vercel + Neon + Resend

### Local Development
```bash
# 1. Install dependencies
npm install next@14 react react-dom @prisma/client bcryptjs jsonwebtoken resend zod
npm install -D prisma typescript @types/node @types/react @types/bcryptjs @types/jsonwebtoken tailwindcss

# 2. Configure .env from .env.example and run Prisma migration against Neon Postgres
cp .env.example .env
npx prisma migrate dev --name init_oververse_users

# 3. Start Next.js 14 dev server on http://localhost:3000
npm run dev
```

### Deploy to Production (Vercel + Neon + Resend)
1. **Neon PostgreSQL (`neon.tech`)**:
   - Create a new project (`az-oververse-prod`) in your closest region (e.g., `eu-central-1` / `aws-eu-west-1`).
   - Copy the **Pooled Connection String** (`?sslmode=require`) as `DATABASE_URL`.
2. **Resend (`resend.com`)**:
   - Add and verify your sending domain (SPF + DKIM DNS records).
   - Generate an API key (`re_...`) and set `RESEND_API_KEY` + `RESEND_FROM_EMAIL`.
3. **Vercel (`vercel.com`)**:
   - Import your GitHub repository into Vercel.
   - Add Environment Variables:
     - `DATABASE_URL`
     - `JWT_SECRET` (`openssl rand -hex 32`)
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `NEXT_PUBLIC_APP_URL` (`https://your-production-domain.com`)
   - Set the Build Command to:
     ```bash
     npx prisma generate && npx prisma migrate deploy && next build
     ```
   - Deploy—every push to `main` runs migrations automatically and deploys your custom JWT + `httpOnly` refresh cookie auth system globally.
