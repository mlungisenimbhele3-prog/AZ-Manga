/**
 * ReaderConfig.ts
 * Core MANGA Plus Style Reader Configuration & Tuning for AZ Oververse
 */

export type ReadingMode = 'vertical' | 'horizontal_ltr';

export interface ReaderSettings {
  readingMode: ReadingMode; // 'vertical' (AZ Vertical 0px gap) | 'horizontal_ltr' (Left-to-Right Manga)
  preloadAheadCount: number; // Preload Page X+1, X+2 silently in background
  backgroundColor: string; // Solid black #000000 (Zero light leakage)
  fitMode: 'contain'; // object-contain (no crop, no distortion, max screen height)
  centerTapThresholdRatio: number; // Middle 30% of screen triggers menus
  hardwareAcceleration: boolean;
  enablePinchZoom: boolean;
}

export const DEFAULT_READER_CONFIG: ReaderSettings = {
  readingMode: 'horizontal_ltr', // Default to Left-to-Right (LTR) manga mode
  preloadAheadCount: 2,
  backgroundColor: '#000000',
  fitMode: 'contain',
  centerTapThresholdRatio: 0.30, // Middle 30% [35% to 65% horizontal and vertical]
  hardwareAcceleration: true,
  enablePinchZoom: true,
};

/**
 * Preload an image URL into browser cache
 */
export function preloadMangaImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

/**
 * Preload Page X+1 and Page X+2 silently in background
 */
export function preloadUpcomingPages(pages: Array<{ imageUrl: string }>, currentIndex: number, aheadCount = 2) {
  for (let offset = 1; offset <= aheadCount; offset++) {
    const nextIdx = currentIndex + offset;
    if (nextIdx < pages.length && pages[nextIdx]?.imageUrl) {
      preloadMangaImage(pages[nextIdx].imageUrl);
    }
  }
}
