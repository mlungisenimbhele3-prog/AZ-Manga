// ==============================================================================
// AZ OVERVERSE - Prisma & Neon.tech PostgreSQL Client with Auto-Wake Retry Logic
// ==============================================================================
// Resolves Neon autosuspend cold-starts by:
// 1. Enforcing pooled connection string with ?pgbouncer=true & connect_timeout=15
// 2. Increasing connection timeout to 15s (15000ms)
// 3. Automatically retrying on connection timeout / cold-start 3 times with 2s delay
// 4. Surfacing real Prisma / Postgres error messages instead of generic fallbacks
// ==============================================================================

import { PrismaClient } from '@prisma/client';

/**
 * Normalizes PostgreSQL connection string for Neon pooled connections:
 * - Appends ?pgbouncer=true if using pooled endpoint (e.g. -pooler suffix)
 * - Ensures connect_timeout=15 is configured to withstand cold-start wakeups
 */
export function formatNeonDatabaseUrl(rawUrl?: string): string {
  const urlString = rawUrl?.trim() || process.env.DATABASE_URL?.trim() || '';
  if (!urlString) {
    return '';
  }

  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes('-pooler.') || !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '15');
    }
    return parsed.toString();
  } catch {
    const separator = urlString.includes('?') ? '&' : '?';
    let formatted = urlString;
    if (!formatted.includes('pgbouncer=')) {
      formatted += `${separator}pgbouncer=true`;
    }
    if (!formatted.includes('connect_timeout=')) {
      formatted += `&connect_timeout=15`;
    }
    return formatted;
  }
}

/**
 * Checks if a thrown error is caused by Neon autosuspend / connection timeout
 */
export function isNeonConnectionTimeout(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || (error as any)?.name;

  return (
    code === 'P1001' || // Can't reach database server
    code === 'P1002' || // Database server was reached but timed out
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    /timeout|timed out|connection closed|connection terminated|cold start|server closed the connection|starting up/i.test(msg)
  );
}

/**
 * Retries an asynchronous database operation up to 3 times with a 2-second delay
 * if a connection timeout or Neon autosuspend wake-up delay occurs.
 */
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt <= maxRetries && isNeonConnectionTimeout(error)) {
        console.warn(
          `[Neon DB Wake] Connection timeout/autosuspend detected. Retrying in ${delayMs / 1000}s (Attempt ${attempt}/${maxRetries})...`,
          error?.message || error
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      console.error(`[Prisma Error] Operation failed after ${attempt} attempt(s):`, error);
      throw error;
    }
  }
}

const resolvedUrl = formatNeonDatabaseUrl(process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedUrl ? { db: { url: resolvedUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Pings database to wake Neon instance from autosuspend.
 * Retries 3 times with 2-second delay and 15s timeout.
 */
export async function wakeNeonDatabase(): Promise<void> {
  await withPrismaRetry(async () => {
    await prisma.$queryRaw`SELECT 1 as ping`;
  });
}

/**
 * Sanitizes user records by stripping password hashes and sensitive tokens.
 */
export function sanitizeUser<
  T extends {
    password_hash?: unknown;
    passwordHash?: unknown;
    verification_token?: unknown;
    verificationToken?: unknown;
    reset_token?: unknown;
    resetToken?: unknown;
  }
>(user: T) {
  const {
    password_hash: _pw1,
    passwordHash: _pw2,
    verification_token: _vt1,
    verificationToken: _vt2,
    reset_token: _rt1,
    resetToken: _rt2,
    ...safeUser
  } = user;
  return safeUser;
}
