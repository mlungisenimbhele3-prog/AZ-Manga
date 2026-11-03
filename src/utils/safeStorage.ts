// Safe Storage & Read-Through Memory Cache Guard for Lower & Higher End Devices
// Eliminates redundant synchronous disk reads and coalesces frequent writes off the main UI frame.

const memoryReadCache = new Map<string, string>();
const pendingDiskWrites = new Map<string, string | null>();
let storageSyncAttached = false;
let flushHandle: number | null = null;
let usingIdleFlush = false;

function flushPendingWrites(): void {
  flushHandle = null;
  usingIdleFlush = false;
  if (pendingDiskWrites.size === 0) return;
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    pendingDiskWrites.clear();
    return;
  }

  const entries = Array.from(pendingDiskWrites.entries());
  pendingDiskWrites.clear();

  for (const [key, val] of entries) {
    try {
      if (val === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, val);
      }
    } catch {
      safeStorage.evictOldCaches();
      try {
        if (val !== null) {
          localStorage.setItem(key, val);
        }
      } catch {
        // Memory cache already retains latest value for current session
      }
    }
  }
}

function scheduleBackgroundFlush(): void {
  if (flushHandle !== null || typeof window === 'undefined') return;
  const win = window as any;
  if (typeof win.requestIdleCallback === 'function') {
    usingIdleFlush = true;
    flushHandle = win.requestIdleCallback(() => flushPendingWrites(), { timeout: 1000 });
  } else {
    usingIdleFlush = false;
    flushHandle = window.setTimeout(() => flushPendingWrites(), 120);
  }
}

function ensureCrossTabSync(): void {
  if (storageSyncAttached || typeof window === 'undefined') return;
  storageSyncAttached = true;

  window.addEventListener('storage', (e) => {
    if (!e.key) {
      memoryReadCache.clear();
      return;
    }
    if (e.newValue === null) {
      memoryReadCache.delete(e.key);
    } else {
      memoryReadCache.set(e.key, e.newValue);
    }
  });

  // Guarantee zero data loss if user switches tabs or closes app before idle callback fires
  const flushNow = () => {
    if (flushHandle !== null) {
      const win = window as any;
      if (usingIdleFlush && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(flushHandle);
      } else {
        window.clearTimeout(flushHandle);
      }
      flushHandle = null;
    }
    flushPendingWrites();
  };

  window.addEventListener('pagehide', flushNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushNow();
    }
  });
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
      ensureCrossTabSync();
      if (memoryReadCache.has(key)) {
        return memoryReadCache.get(key) ?? null;
      }
      if (pendingDiskWrites.has(key) && pendingDiskWrites.get(key) === null) {
        return null;
      }
      const val = localStorage.getItem(key);
      if (val !== null) {
        memoryReadCache.set(key, val);
      }
      return val;
    } catch (e) {
      console.warn(`[SafeStorage]: Failed to read key ${key}`, e);
      return memoryReadCache.get(key) ?? null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
      ensureCrossTabSync();
      pendingDiskWrites.delete(key);
      if (memoryReadCache.get(key) === value) {
        return true;
      }
      localStorage.setItem(key, value);
      memoryReadCache.set(key, value);
      return true;
    } catch (e) {
      console.warn(`[SafeStorage Quota Full]: Attempting cache eviction for key ${key}`, e);
      safeStorage.evictOldCaches();
      try {
        localStorage.setItem(key, value);
        memoryReadCache.set(key, value);
        return true;
      } catch (err) {
        console.error(`[SafeStorage Error]: Storage completely full on device`, err);
        memoryReadCache.set(key, value);
        return false;
      }
    }
  },

  /**
   * Updates the in-memory read-through cache in O(1) (<0.01ms) and coalesces disk I/O
   * into an idle frame (flushed immediately on tab hide/unload). Ideal for high-frequency UI state.
   */
  setItemDeferred: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    ensureCrossTabSync();
    if (memoryReadCache.get(key) === value) return;
    memoryReadCache.set(key, value);
    pendingDiskWrites.set(key, value);
    scheduleBackgroundFlush();
  },

  removeItem: (key: string): void => {
    memoryReadCache.delete(key);
    pendingDiskWrites.delete(key);
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage]: Failed to remove key ${key}`, e);
    }
  },

  getJSON: <T>(key: string, fallback: T): T => {
    const raw = safeStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON: (key: string, value: unknown): boolean => {
    try {
      return safeStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },

  setJSONDeferred: (key: string, value: unknown): void => {
    if (typeof window === 'undefined') return;
    ensureCrossTabSync();
    const win = window as any;
    const serializeAndQueue = () => {
      try {
        const serialized = JSON.stringify(value);
        if (memoryReadCache.get(key) === serialized) return;
        memoryReadCache.set(key, serialized);
        pendingDiskWrites.set(key, serialized);
        scheduleBackgroundFlush();
      } catch {}
    };
    // For small/medium objects serialize immediately into memory cache; flush disk in idle time
    if (typeof win.requestIdleCallback === 'function' && Array.isArray(value) && value.length > 25) {
      win.requestIdleCallback(serializeAndQueue, { timeout: 600 });
    } else {
      serializeAndQueue();
    }
  },

  flushNow: (): void => {
    flushPendingWrites();
  },

  evictOldCaches: (): number => {
    let freedCount = 0;
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 0;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('ka_offline_ch_') ||
            k.startsWith('ka_cached_thumb_') ||
            k.startsWith('az_oververse_mangas_cache'))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.slice(0, 8).forEach((k) => {
        memoryReadCache.delete(k);
        pendingDiskWrites.delete(k);
        localStorage.removeItem(k);
        freedCount++;
      });
    } catch (e) {
      console.error('[SafeStorage Eviction Error]', e);
    }
    return freedCount;
  },

  getStorageUsageEstimate: async (): Promise<{
    usedMB: number;
    totalMB: number;
    percent: number;
  }> => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usedMB = Math.round((est.usage || 0) / (1024 * 1024));
        const totalMB = Math.round((est.quota || 0) / (1024 * 1024));
        const percent = totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0;
        return { usedMB, totalMB, percent };
      } catch {
        // Fallback
      }
    }
    let bytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          bytes += (safeStorage.getItem(k) || '').length * 2;
        }
      }
    } catch {}
    const usedMB = parseFloat((bytes / (1024 * 1024)).toFixed(2));
    return { usedMB, totalMB: 50, percent: Math.round((usedMB / 50) * 100) };
  },
};

