import React, { ComponentType, lazy } from 'react';

const CHUNK_RELOAD_GUARD_KEY = 'az_oververse_chunk_recovery_ts';

function isChunkImportError(error: unknown): boolean {
  const err = error as { message?: string; name?: string } | null;
  const msg = String(err?.message || error || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk') ||
    err?.name === 'ChunkLoadError'
  );
}

/**
 * Resilient React.lazy wrapper that retries transient dynamic import failures
 * (e.g. Vite dev server restarts, CDN hiccups, or stale module hashes)
 * before propagating to the ErrorBoundary.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    const delays = [250, 600, 1200];

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          const waitMs = delays[attempt] ?? 1200;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    if (typeof window !== 'undefined' && isChunkImportError(lastError)) {
      try {
        const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) || '0');
        if (Date.now() - lastReload > 15000) {
          sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(Date.now()));
          window.location.reload();
          // Keep promise pending briefly while browser navigates/reloads
          return new Promise<{ default: T }>(() => {});
        }
      } catch {
        // Fall through and throw lastError to ErrorBoundary
      }
    }

    throw lastError;
  });
}
