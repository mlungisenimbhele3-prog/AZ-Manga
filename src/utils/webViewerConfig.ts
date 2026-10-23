/**
 * WebViewer Component Configuration & Bridge
 * 
 * Target WebViewer specifications:
 * - ZoomDisplay: Unchecked (false) - Disables on-screen zoom control displays
 * - SupportZoom: Unchecked (false) - Disables multi-touch pinch & enlarge/shrink gestures
 * - UseWideViewPort: Checked (true) - Enables full wide viewport rendering following HTML viewport
 * - UserAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome... Mobile"
 */

import { safeStorage } from './safeStorage';

export interface WebViewerSettings {
  homeUrl: string;           // 'https://az-oververse.ai.studio'
  zoomDisplay: boolean;      // false = Unchecked (hide on-screen zoom display)
  supportZoom: boolean;      // false = Unchecked (stops enlarge/shrink gestures)
  useWideViewPort: boolean;  // true  = Checked (wide responsive viewport)
  userAgent: string;         // 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome... Mobile'
}

export const DEFAULT_WEBVIEWER_SETTINGS: WebViewerSettings = {
  homeUrl: 'https://az-oververse.ai.studio',
  zoomDisplay: false,       // Uncheck ZoomDisplay
  supportZoom: false,       // Uncheck SupportZoom (stops enlarge/shrink)
  useWideViewPort: true,    // Check UseWideViewPort = TRUE
  userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome... Mobile',
};

const STORAGE_KEY = 'ka_plus_webviewer_settings';

// Global reference for active listener removal
let pinchPreventCleanup: (() => void) | null = null;

/**
 * Stop enlarge and shrink gestures:
 * - Multi-touch pinch-to-zoom (2+ fingers)
 * - Double-tap zoom on mobile
 * - Ctrl + Mouse wheel zoom on desktop
 * - Ctrl + '+' / '-' / '0' keyboard zoom
 */
export function applyEnlargeShrinkBlocker(block: boolean) {
  if (pinchPreventCleanup) {
    pinchPreventCleanup();
    pinchPreventCleanup = null;
  }

  if (!block) return;

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      // Disallow multi-touch zoom gestures (Stops enlarge/shrink)
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  // Safari gesture prevention
  const handleGestureStart = (e: Event) => {
    e.preventDefault();
  };

  const handleGestureChange = (e: Event) => {
    e.preventDefault();
  };

  // Prevent Ctrl + Wheel zoom
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  // Prevent Ctrl + +/-/0 zoom keys
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) {
      e.preventDefault();
    }
  };

  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('gesturestart', handleGestureStart as any, { passive: false });
  window.addEventListener('gesturechange', handleGestureChange as any, { passive: false });
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keydown', handleKeyDown, { capture: true });

  pinchPreventCleanup = () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('gesturestart', handleGestureStart as any);
    window.removeEventListener('gesturechange', handleGestureChange as any);
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
  };
}

/**
 * Configure Viewport Meta Tag for UseWideViewPort
 */
export function applyWideViewPortMeta(useWide: boolean) {
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }

  if (useWide) {
    viewportMeta.content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';
  } else {
    viewportMeta.content = 'width=device-width, initial-scale=1.0';
  }
}

/**
 * Retrieve current saved or default WebViewer configuration
 */
export function getWebViewerConfig(): WebViewerSettings {
  try {
    const saved = safeStorage.getJSON<WebViewerSettings | null>(STORAGE_KEY, null);
    if (saved) {
      return {
        homeUrl: 'https://az-oververse.ai.studio',
        zoomDisplay: saved.zoomDisplay ?? DEFAULT_WEBVIEWER_SETTINGS.zoomDisplay,
        supportZoom: saved.supportZoom ?? DEFAULT_WEBVIEWER_SETTINGS.supportZoom,
        useWideViewPort: saved.useWideViewPort ?? DEFAULT_WEBVIEWER_SETTINGS.useWideViewPort,
        userAgent: saved.userAgent || DEFAULT_WEBVIEWER_SETTINGS.userAgent,
      };
    }
  } catch (e) {
    // fallback
  }
  return { ...DEFAULT_WEBVIEWER_SETTINGS };
}

/**
 * Persist and activate WebViewer configuration
 */
export function setWebViewerConfig(config: Partial<WebViewerSettings>): WebViewerSettings {
  const current = getWebViewerConfig();
  const updated: WebViewerSettings = {
    ...current,
    ...config,
  };

  safeStorage.setJSON(STORAGE_KEY, updated);
  applyWebViewerConfig(updated);
  return updated;
}

/**
 * Apply the configuration to the DOM, touch event loop, and window globals
 */
export function applyWebViewerConfig(config: WebViewerSettings) {
  // 1. SupportZoom: if false (Unchecked), block enlarge/shrink
  applyEnlargeShrinkBlocker(!config.supportZoom);

  // 2. UseWideViewPort: if true, ensure wide viewport meta is active
  applyWideViewPortMeta(config.useWideViewPort);

  // 3. ZoomDisplay: inject or toggle CSS class to hide native zoom overlay / indicators
  if (!config.zoomDisplay) {
    document.documentElement.classList.add('webviewer-hide-zoom-display');
  } else {
    document.documentElement.classList.remove('webviewer-hide-zoom-display');
  }

  // 4. UserAgent: publish to window for webview bridges and diagnostic inspectors
  try {
    (window as any).__WEBVIEWER_CONFIG__ = {
      ...config,
      activeUserAgent: config.userAgent,
      platform: 'Android 13 / Mobile WebViewer',
      timestamp: new Date().toISOString(),
    };

    // Override navigator.userAgent property if permitted by browser runtime
    if (Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')?.configurable) {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => config.userAgent,
        configurable: true,
      });
    }
  } catch (err) {
    // Non-fatal if navigator is read-only in certain strict browsers
  }
}

/**
 * Initialize WebViewer listeners on app start
 */
export function initWebViewer() {
  const config = getWebViewerConfig();
  applyWebViewerConfig(config);
  return config;
}
