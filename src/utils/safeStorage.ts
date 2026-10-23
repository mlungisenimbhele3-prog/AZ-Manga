// Safe Storage & Cache Quota Guard for Lower & Higher End Devices
// Produced by Mlungiseni Mbhele

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage]: Failed to read key ${key}`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[SafeStorage Quota Full]: Attempting cache eviction for key ${key}`, e);
      // Evict non-essential cached manga items to make space
      safeStorage.evictOldCaches();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (err) {
        console.error(`[SafeStorage Error]: Storage completely full on device`, err);
        return false;
      }
    }
  },

  removeItem: (key: string): void => {
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
    } catch (e) {
      return fallback;
    }
  },

  setJSON: (key: string, value: any): boolean => {
    try {
      return safeStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
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
        if (k && (k.startsWith('ka_offline_ch_') || k.startsWith('ka_cached_thumb_'))) {
          keysToRemove.push(k);
        }
      }
      // Remove oldest 5 items
      keysToRemove.slice(0, 5).forEach((k) => {
        localStorage.removeItem(k);
        freedCount++;
      });
    } catch (e) {
      console.error('[SafeStorage Eviction Error]', e);
    }
    return freedCount;
  },

  getStorageUsageEstimate: async (): Promise<{ usedMB: number; totalMB: number; percent: number }> => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usedMB = Math.round((est.usage || 0) / (1024 * 1024));
        const totalMB = Math.round((est.quota || 0) / (1024 * 1024));
        const percent = totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0;
        return { usedMB, totalMB, percent };
      } catch (e) {
        // Fallback
      }
    }
    // Fallback estimate based on LocalStorage length
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        bytes += (localStorage.getItem(k) || '').length * 2;
      }
    }
    const usedMB = parseFloat((bytes / (1024 * 1024)).toFixed(2));
    return { usedMB, totalMB: 50, percent: Math.round((usedMB / 50) * 100) };
  },
};
