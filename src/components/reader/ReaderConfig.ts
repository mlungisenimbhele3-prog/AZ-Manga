/**
 * ReaderConfig.ts
 * High-Resilience 3-Page Chapter Preloader, Cache API Warmer & Bounded LRU Bitmap Pool
 * Engineered for seamless reading on slow 2G/3G networks, budget phones, and 120Hz flagships.
 */

import { getNetworkDiagnostics, getProfileConfig } from '../../utils/devicePerformance';

export type ReadingMode = 'vertical' | 'horizontal_ltr';

export type PageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface ReaderSettings {
  readingMode: ReadingMode; // 'vertical' (AZ Vertical 0px gap) | 'horizontal_ltr' (Left-to-Right Manga)
  preloadAheadCount: number; // Preload & cache Page X+1, X+2, X+3 ahead of current page
  backgroundColor: string; // Solid black #000000 (Zero light leakage)
  fitMode: 'contain'; // object-contain (no crop, no distortion, max screen height)
  centerTapThresholdRatio: number; // Middle 30% of screen triggers menus
  hardwareAcceleration: boolean;
  enablePinchZoom: boolean;
}

export const DEFAULT_READER_CONFIG: ReaderSettings = {
  readingMode: 'horizontal_ltr',
  preloadAheadCount: 3, // Cache next 3 pages of the manga chapter for seamless slow-network reading
  backgroundColor: '#000000',
  fitMode: 'contain',
  centerTapThresholdRatio: 0.3,
  hardwareAcceleration: true,
  enablePinchZoom: true,
};

interface QueuedPreloadTask {
  url: string;
  priority: 'high' | 'low';
}

export interface PreloadUpcomingOptions {
  dataSaverMode?: boolean;
  nextChapterFirstPageUrl?: string | null;
}

const READER_IMAGE_CACHE_NAME = 'oververse-manga-images';

// Bounded LRU map retaining live decoded HTMLImageElement instances so mobile GC
// does not evict preloaded pages before the reader flips to them.
const decodedBitmapLRU = new Map<string, HTMLImageElement>();
const pageStatusMap = new Map<string, PageLoadStatus>();
const inFlightPreloads = new Map<string, Promise<boolean>>();
const pageListeners = new Map<string, Set<(status: PageLoadStatus) => void>>();
const warmedCacheStorageUrls = new Set<string>();

let preloadQueue: QueuedPreloadTask[] = [];
let activeWorkerCount = 0;

function notifyPageListeners(url: string, status: PageLoadStatus): void {
  pageStatusMap.set(url, status);
  const subs = pageListeners.get(url);
  if (!subs || subs.size === 0) return;
  subs.forEach((cb) => {
    try {
      cb(status);
    } catch {}
  });
}

function touchLruEntry(url: string, img: HTMLImageElement, pinnedUrls?: Set<string>): void {
  if (decodedBitmapLRU.has(url)) {
    decodedBitmapLRU.delete(url);
  }
  decodedBitmapLRU.set(url, img);

  const maxEntries = Math.max(6, getProfileConfig().maxDecodedPagesInMemory);
  if (decodedBitmapLRU.size <= maxEntries) return;

  for (const oldestUrl of decodedBitmapLRU.keys()) {
    if (decodedBitmapLRU.size <= maxEntries) break;
    if (pinnedUrls && pinnedUrls.has(oldestUrl)) continue;
    const evicted = decodedBitmapLRU.get(oldestUrl);
    decodedBitmapLRU.delete(oldestUrl);
    if (evicted) {
      // Release decoded bitmap memory on low-RAM devices while HTTP/CacheStorage retains bytes
      evicted.src = '';
    }
  }
}

/**
 * Warms the browser Cache Storage API (`oververse-manga-images`) in the background
 * for same-origin and CORS-permissive URLs so slow/intermittent connections never re-download bytes.
 */
async function warmPersistentCacheStorage(url: string): Promise<void> {
  if (
    typeof window === 'undefined' ||
    !('caches' in window) ||
    !url ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    warmedCacheStorageUrls.has(url)
  ) {
    return;
  }

  warmedCacheStorageUrls.add(url);

  try {
    const resolved = new URL(url, window.location.origin);
    const isSameOrigin = resolved.origin === window.location.origin;
    if (!isSameOrigin && resolved.protocol !== 'https:') return;

    const cache = await window.caches.open(READER_IMAGE_CACHE_NAME);
    const existing = await cache.match(resolved.href);
    if (existing) return;

    if (isSameOrigin) {
      const response = await fetch(resolved.href, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'force-cache',
      });
      if (response && response.ok) {
        await cache.put(resolved.href, response);
      }
    }
  } catch {
    // Non-fatal: standard Image() HTTP cache remains active
  }
}

function loadAndDecodeSingleAttempt(
  url: string,
  priority: 'high' | 'low'
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    try {
      (img as any).fetchPriority = priority;
    } catch {}

    let settled = false;
    const finalizeSuccess = () => {
      if (settled) return;
      settled = true;
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => resolve(img))
          .catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };

    const finalizeError = () => {
      if (settled) return;
      settled = true;
      reject(new Error(`Failed to preload manga page: ${url}`));
    };

    img.onload = finalizeSuccess;
    img.onerror = finalizeError;
    img.src = url;

    if (img.complete && img.naturalWidth > 0) {
      finalizeSuccess();
    }
  });
}

async function executePreloadWithRetry(
  url: string,
  priority: 'high' | 'low',
  pinnedUrls?: Set<string>
): Promise<boolean> {
  if (!url) return false;

  const cachedImg = decodedBitmapLRU.get(url);
  if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
    touchLruEntry(url, cachedImg, pinnedUrls);
    notifyPageListeners(url, 'loaded');
    return true;
  }

  const existingPromise = inFlightPreloads.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  notifyPageListeners(url, 'loading');

  const taskPromise = (async (): Promise<boolean> => {
    const retryDelays = [0, 550, 1300];
    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      if (retryDelays[attempt] > 0) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          break;
        }
        await new Promise((r) => setTimeout(r, retryDelays[attempt]));
      }
      try {
        const decodedImg = await loadAndDecodeSingleAttempt(url, priority);
        touchLruEntry(url, decodedImg, pinnedUrls);
        notifyPageListeners(url, 'loaded');
        void warmPersistentCacheStorage(url);
        return true;
      } catch {
        // Proceed to next backoff attempt
      }
    }

    notifyPageListeners(url, 'error');
    return false;
  })();

  inFlightPreloads.set(url, taskPromise);

  try {
    return await taskPromise;
  } finally {
    inFlightPreloads.delete(url);
  }
}

function getEffectiveConcurrency(dataSaverMode = false): number {
  if (dataSaverMode) return 1;
  const net = getNetworkDiagnostics();
  const profile = getProfileConfig();
  return Math.max(1, Math.min(profile.preloadConcurrency, net.recommendedPreloadConcurrency));
}

function pumpPreloadQueue(pinnedUrls?: Set<string>, dataSaverMode = false): void {
  const maxConcurrency = getEffectiveConcurrency(dataSaverMode);

  while (activeWorkerCount < maxConcurrency && preloadQueue.length > 0) {
    const nextTask = preloadQueue.shift();
    if (!nextTask) break;

    activeWorkerCount++;
    executePreloadWithRetry(nextTask.url, nextTask.priority, pinnedUrls).finally(() => {
      activeWorkerCount = Math.max(0, activeWorkerCount - 1);
      pumpPreloadQueue(pinnedUrls, dataSaverMode);
    });
  }
}

/**
 * Checks synchronously whether a page image is already decoded & cached in memory.
 */
export function isPagePreloaded(url?: string | null): boolean {
  if (!url) return false;
  if (pageStatusMap.get(url) === 'loaded') return true;
  const img = decodedBitmapLRU.get(url);
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

export function getPageLoadStatus(url?: string | null): PageLoadStatus {
  if (!url) return 'idle';
  if (isPagePreloaded(url)) return 'loaded';
  return pageStatusMap.get(url) || 'idle';
}

export function markPageLoadedExternally(url?: string | null): void {
  if (!url) return;
  notifyPageListeners(url, 'loaded');
  void warmPersistentCacheStorage(url);
}

export function subscribeToPageLoadState(
  url: string,
  listener: (status: PageLoadStatus) => void
): () => void {
  if (!url) return () => {};
  let set = pageListeners.get(url);
  if (!set) {
    set = new Set();
    pageListeners.set(url, set);
  }
  set.add(listener);
  return () => {
    const targetSet = pageListeners.get(url);
    if (!targetSet) return;
    targetSet.delete(listener);
    if (targetSet.size === 0) {
      pageListeners.delete(url);
    }
  };
}

/**
 * Preload a single manga image URL into the decoded LRU + browser cache.
 */
export async function preloadMangaImage(
  url: string,
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  if (!url || typeof window === 'undefined') return;
  await executePreloadWithRetry(url, priority);
}

/**
 * Explicitly clears error state and retries loading a page URL (e.g., when reader taps Retry).
 */
export async function retryPreloadMangaImage(url: string): Promise<boolean> {
  if (!url || typeof window === 'undefined') return false;
  decodedBitmapLRU.delete(url);
  pageStatusMap.delete(url);
  return executePreloadWithRetry(url, 'high');
}

/**
 * Preloads and caches the next 3 pages (Page X+1, Page X+2, Page X+3) ahead of `currentIndex`.
 * - Prioritizes the current page and X+1 with `fetchPriority: 'high'` before X+2 and X+3.
 * - Automatically switches to strict sequential waterfall (`concurrency = 1`) on slow 2G/3G/Save-Data
 *   connections so Page X+1 never competes for bandwidth with X+2 or X+3.
 * - Keeps `[currentIndex - 1 .. currentIndex + aheadCount]` pinned in the bounded LRU bitmap cache.
 */
export function preloadUpcomingPages(
  pages: Array<{ imageUrl: string }>,
  currentIndex: number,
  aheadCount = DEFAULT_READER_CONFIG.preloadAheadCount,
  options: PreloadUpcomingOptions = {}
): void {
  if (typeof window === 'undefined' || !pages || pages.length === 0) return;

  const effectiveAhead = Math.max(3, aheadCount);
  const pinnedUrls = new Set<string>();

  // Pin previous, current, and upcoming 3+ pages so LRU never evicts active reading window
  for (
    let i = Math.max(0, currentIndex - 1);
    i <= Math.min(pages.length - 1, currentIndex + effectiveAhead);
    i++
  ) {
    const u = pages[i]?.imageUrl;
    if (u) {
      pinnedUrls.add(u);
      const existing = decodedBitmapLRU.get(u);
      if (existing) {
        touchLruEntry(u, existing, pinnedUrls);
      }
    }
  }

  const nextTasks: QueuedPreloadTask[] = [];
  const seen = new Set<string>();

  // Ensure current page is warm first if not yet decoded
  const currentUrl = pages[currentIndex]?.imageUrl;
  if (currentUrl && !isPagePreloaded(currentUrl) && !inFlightPreloads.has(currentUrl)) {
    seen.add(currentUrl);
    nextTasks.push({ url: currentUrl, priority: 'high' });
  }

  // Queue the next 3 pages (or more on Ultra devices) in strict forward order: X+1 -> X+2 -> X+3
  for (let offset = 1; offset <= effectiveAhead; offset++) {
    const nextIdx = currentIndex + offset;
    if (nextIdx >= pages.length) break;
    const url = pages[nextIdx]?.imageUrl;
    if (!url || seen.has(url) || isPagePreloaded(url) || inFlightPreloads.has(url)) continue;
    seen.add(url);
    nextTasks.push({
      url,
      priority: offset === 1 ? 'high' : 'low',
    });
  }

  // Keep immediate previous page warm for instant back-swipe if not yet loaded
  if (currentIndex > 0) {
    const prevUrl = pages[currentIndex - 1]?.imageUrl;
    if (prevUrl && !seen.has(prevUrl) && !isPagePreloaded(prevUrl) && !inFlightPreloads.has(prevUrl)) {
      seen.add(prevUrl);
      nextTasks.push({ url: prevUrl, priority: 'low' });
    }
  }

  // When within the last 3 pages of the chapter, prewarm Page 1 of the next chapter
  if (
    options.nextChapterFirstPageUrl &&
    currentIndex >= Math.max(0, pages.length - 3) &&
    !seen.has(options.nextChapterFirstPageUrl) &&
    !isPagePreloaded(options.nextChapterFirstPageUrl) &&
    !inFlightPreloads.has(options.nextChapterFirstPageUrl)
  ) {
    pinnedUrls.add(options.nextChapterFirstPageUrl);
    nextTasks.push({ url: options.nextChapterFirstPageUrl, priority: 'low' });
  }

  // Replace stale queued items so the reader's current reading position always takes precedence
  preloadQueue = nextTasks;
  pumpPreloadQueue(pinnedUrls, Boolean(options.dataSaverMode));
}
