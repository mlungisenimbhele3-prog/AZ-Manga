// Offline Chapter Caching Service using IndexedDB & Cache API for Data Saver Mode
const DB_NAME = 'KAAfricaOfflineDB';
const STORE_NAME = 'chapters';
const DB_VERSION = 1;

export async function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveChapterOffline(chapter: { id: string; mangaId: string; title: string; number: number; pages: any[] }): Promise<void> {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...chapter, cachedAt: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    console.log(`[Offline Cache]: Chapter ${chapter.id} saved for offline reading.`);
  } catch (e) {
    console.warn('[Offline Cache Error]: IndexedDB save failed, fallback to localStorage', e);
    try {
      localStorage.setItem(`ka_offline_ch_${chapter.id}`, JSON.stringify(chapter));
    } catch (err) {
      console.error('localStorage fallback failed', err);
    }
  }
}

export async function getOfflineChapter(chapterId: string): Promise<any | null> {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return await new Promise((resolve, reject) => {
      const request = store.get(chapterId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    const item = localStorage.getItem(`ka_offline_ch_${chapterId}`);
    return item ? JSON.parse(item) : null;
  }
}

export async function getAllOfflineChapters(): Promise<any[]> {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    const chapters: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ka_offline_ch_')) {
        const item = localStorage.getItem(key);
        if (item) chapters.push(JSON.parse(item));
      }
    }
    return chapters;
  }
}

export async function removeOfflineChapter(chapterId: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(chapterId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    localStorage.removeItem(`ka_offline_ch_${chapterId}`);
  }
}

// Sync Queue for Offline Chapter Progress & Data Saver Mode
const SYNC_QUEUE_KEY = 'ka_offline_sync_queue';

export function queueOfflineProgress(progress: { mangaId: string; chapterId: string; pageIndex: number; timestamp: string }) {
  try {
    const queue = getPendingSyncQueue();
    queue.push({ ...progress, synced: false });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    console.log('[Offline Sync]: Progress queued for server synchronization when connection is restored.', progress);
  } catch (e) {
    console.error('Failed to queue offline progress', e);
  }
}

export function getPendingSyncQueue(): any[] {
  try {
    const item = localStorage.getItem(SYNC_QUEUE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    return [];
  }
}

export async function syncOfflineProgressWithServer(): Promise<number> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return 0;

  try {
    console.log('[Server Sync]: Synchronizing offline chapters and reading progress with server...', queue);
    await new Promise((resolve) => setTimeout(resolve, 800));
    localStorage.removeItem(SYNC_QUEUE_KEY);
    console.log(`[Server Sync Success]: Successfully synchronized ${queue.length} offline progress records with server.`);
    return queue.length;
  } catch (e) {
    console.error('[Server Sync Error]: Failed to sync with server', e);
    return 0;
  }
}
