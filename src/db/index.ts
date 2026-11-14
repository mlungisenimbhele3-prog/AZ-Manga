import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

function isPlaceholderDatabaseUrl(urlString?: string): boolean {
  if (!urlString) return true;
  const trimmed = urlString.trim();
  if (!trimmed) return true;
  if (
    trimmed.includes('ep-bold-glitter-123456') ||
    trimmed.includes(':npg_secret@') ||
    /\/\/[^/]*@?base(?:[:/?]|$)/i.test(trimmed)
  ) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    const host = (parsed.hostname || '').toLowerCase();
    if (host === 'base' || host.includes('ep-bold-glitter-123456')) {
      return true;
    }
  } catch {
    // Ignore URL parse error and fall through
  }
  return false;
}

/**
 * Normalizes PostgreSQL connection string for Neon pooled connections:
 * - Appends ?pgbouncer=true if using pooled endpoint (or missing)
 * - Configures connect_timeout=15 for Neon cold-start wake-up tolerance
 */
export function formatDatabaseUrl(rawUrl?: string): string {
  const candidate = rawUrl?.trim() || process.env.DATABASE_URL?.trim() || '';
  if (isPlaceholderDatabaseUrl(candidate)) return '';
  const urlString = candidate;

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

export const createPool = () => {
  if (!global._postgresPool) {
    const hasCloudSqlEnv = Boolean(
      process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME
    );
    const databaseUrl = hasCloudSqlEnv ? '' : formatDatabaseUrl(process.env.DATABASE_URL);

    const poolConfig: PoolConfig = databaseUrl
      ? {
          connectionString: databaseUrl,
          max: 12,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000, // Increased to 15s for Neon cold-start wakeup
          statement_timeout: 15000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
          ssl: databaseUrl.includes('sslmode=disable')
            ? false
            : { rejectUnauthorized: false },
        }
      : {
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 12,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000, // Increased to 15s for Neon cold-start wakeup
          statement_timeout: 15000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
        };

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Checks if a thrown error is a connection timeout or cold-start error from Neon
 */
export function isConnectionTimeoutError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;

  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === '57P01' || // admin shutdown
    code === '08006' || // connection failure
    code === 'P1001' ||
    code === 'P1002' ||
    /timeout|timed out|connection closed|connection terminated|cold start|server closed the connection|starting up/i.test(msg)
  );
}

/**
 * Retries database query 3 times with 2-second delay on connection timeout / Neon cold-start
 */
export async function withDbRetry<T>(
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
      if (attempt <= maxRetries && isConnectionTimeoutError(error)) {
        console.warn(
          `[Neon DB Wake] Connection timeout or cold-start detected. Retrying in ${delayMs / 1000}s (Attempt ${attempt}/${maxRetries})...`,
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

/**
 * Health check & Neon wake-up: performs a SELECT 1 query with retry
 */
export async function pingDatabaseWithRetry(): Promise<void> {
  await withDbRetry(async () => {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1 as ping');
    } finally {
      client.release();
    }
  });
}
