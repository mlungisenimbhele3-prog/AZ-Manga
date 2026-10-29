// Safe Storage & Read-Through Memory Cache Guard for Lower & Higher End Devices
// Eliminates redundant synchronous disk reads while safely auto-evicting caches on low-storage phones.

const memoryReadCache = new Map<string, string>();
let storageSyncAttached = false;

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
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
      ensureCrossTabSync();
      if (memoryReadCache.has(key)) {
        return memoryReadCache.get(key) ?? null;
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

  removeItem: (key: string): void => {
    memoryReadCache.delete(key);
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
      keysToRemove.slice(0, 6).forEach((k) => {
        memoryReadCache.delete(k);
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
          bytes += (localStorage.getItem(k) || '').length * 2;
        }
      }
    } catch {}
    const usedMB = parseFloat((bytes / (1024 * 1024)).toFixed(2));
    return { usedMB, totalMB: 50, percent: Math.round((usedMB / 50) * 100) };
  },
};
