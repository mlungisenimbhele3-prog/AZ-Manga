// Device Capability & Adaptive Performance Engine for AZ OVERVERSE
// Produced by Mlungiseni Mbhele

import { safeStorage } from './safeStorage';

export type DeviceTier = 'ultra' | 'high' | 'balanced' | 'lite_saver';

export interface NetworkDiagnostics {
  effectiveType: string;
  downlinkMbps: number;
  rttMs: number;
  isSaveDataActive: boolean;
  isSlowConnection: boolean;
  recommendedPreloadConcurrency: 1 | 2 | 3 | 4;
}

export interface DeviceDiagnostics {
  tier: DeviceTier;
  hardwareConcurrency: number;
  deviceMemoryGB: number;
  connectionType: string;
  downlinkMbps: number;
  rttMs: number;
  isSaveDataActive: boolean;
  screenRefreshRate: number;
  isTouchDevice: boolean;
  devicePixelRatio: number;
  isLowEndDevice: boolean;
  batteryLevel?: number;
  isBatteryCharging?: boolean;
  gpuRenderer?: string;
}

export interface PerformanceProfileConfig {
  targetFps: number;
  enableBackdropBlur: boolean;
  enableComplexAnimations: boolean;
  imagePreloadCount: number;
  preloadConcurrency: 1 | 2 | 3 | 4;
  maxDecodedPagesInMemory: number;
  supportDoublePage: boolean;
  enableHardwareAcceleration: boolean;
  cacheLimitMB: number;
  reduceDomOverhead: boolean;
  enableIdleChunkPrefetch: boolean;
}

const PROFILE_CONFIGS: Record<DeviceTier, PerformanceProfileConfig> = {
  ultra: {
    targetFps: 120,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 6,
    preloadConcurrency: 4,
    maxDecodedPagesInMemory: 32,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 500,
    reduceDomOverhead: false,
    enableIdleChunkPrefetch: true,
  },
  high: {
    targetFps: 90,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 5,
    preloadConcurrency: 3,
    maxDecodedPagesInMemory: 20,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 300,
    reduceDomOverhead: false,
    enableIdleChunkPrefetch: true,
  },
  balanced: {
    targetFps: 60,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 5,
    preloadConcurrency: 2,
    maxDecodedPagesInMemory: 14,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 150,
    reduceDomOverhead: false,
    enableIdleChunkPrefetch: false,
  },
  lite_saver: {
    targetFps: 60,
    enableBackdropBlur: false,
    enableComplexAnimations: false,
    // Preload next 5 pages sequentially (concurrency 1) so slow networks
    // and low-RAM phones still get seamless reading without bandwidth contention or OOM
    imagePreloadCount: 5,
    preloadConcurrency: 1,
    maxDecodedPagesInMemory: 8,
    supportDoublePage: false,
    enableHardwareAcceleration: false,
    cacheLimitMB: 60,
    reduceDomOverhead: true,
    enableIdleChunkPrefetch: false,
  },
};

let cachedDiagnostics: DeviceDiagnostics | null = null;
let cachedGpuRenderer: string | undefined;
let cachedBatteryLevel: number | undefined;
let cachedBatteryCharging: boolean | undefined;
let measuredRefreshRate: number | null = null;
let refreshCalibrationStarted = false;
let gpuProbed = false;
let listenersInitialized = false;
let readerChunkPrewarmed = false;
let coreChunksPrewarmed = false;

const preloadedUrlCache = new Set<string>();
const profileSubscribers = new Set<(tier: DeviceTier) => void>();
const visibilitySubscribers = new Set<(isVisible: boolean) => void>();

function probeGpuOnce(): string | undefined {
  if (gpuProbed || typeof document === 'undefined') {
    return cachedGpuRenderer;
  }
  gpuProbed = true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const gl = (canvas.getContext('webgl', { powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        cachedGpuRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) {
        loseCtx.loseContext();
      }
    }
  } catch {
    // Safe fallback if WebGL is restricted
  }
  return cachedGpuRenderer;
}

function startIdleRefreshRateCalibration(): void {
  if (refreshCalibrationStarted || typeof window === 'undefined') return;
  refreshCalibrationStarted = true;

  scheduleIdleTask(() => {
    if (document.visibilityState === 'hidden') return;
    let samples = 0;
    let lastTs = 0;
    let minDelta = Infinity;

    const sampleFrame = (ts: number) => {
      if (lastTs > 0) {
        const delta = ts - lastTs;
        if (delta > 3 && delta < minDelta) {
          minDelta = delta;
        }
        samples++;
      }
      lastTs = ts;
      if (samples < 10) {
        window.requestAnimationFrame(sampleFrame);
        return;
      }
      if (minDelta < Infinity && minDelta > 0) {
        const rawHz = 1000 / minDelta;
        measuredRefreshRate = rawHz >= 108 ? 120 : rawHz >= 80 ? 90 : 60;
        if (cachedDiagnostics) {
          cachedDiagnostics.screenRefreshRate = measuredRefreshRate;
        }
      }
    };

    window.requestAnimationFrame(sampleFrame);
  }, 2200);
}

export function getNetworkDiagnostics(): NetworkDiagnostics {
  if (typeof navigator === 'undefined') {
    return {
      effectiveType: '4g',
      downlinkMbps: 10,
      rttMs: 50,
      isSaveDataActive: false,
      isSlowConnection: false,
      recommendedPreloadConcurrency: 2,
    };
  }

  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const effectiveType: string = connection?.effectiveType || '4g';
  const downlinkMbps: number =
    typeof connection?.downlink === 'number' && connection.downlink > 0 ? connection.downlink : 10;
  const rttMs: number = typeof connection?.rtt === 'number' ? connection.rtt : 60;
  const isSaveDataActive = Boolean(connection?.saveData);

  const isSlowConnection =
    isSaveDataActive ||
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g' ||
    downlinkMbps < 1.5 ||
    rttMs > 350;

  const recommendedPreloadConcurrency: 1 | 2 | 3 | 4 = isSlowConnection
    ? 1
    : downlinkMbps >= 15 && rttMs <= 80
    ? 4
    : downlinkMbps >= 8 && rttMs <= 120
    ? 3
    : 2;

  return {
    effectiveType,
    downlinkMbps,
    rttMs,
    isSaveDataActive,
    isSlowConnection,
    recommendedPreloadConcurrency,
  };
}

function initEnvironmentListeners(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  const nav = navigator as any;
  const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection;

  const handleEnvChange = () => {
    cachedDiagnostics = null;
    const nextTier = getActivePerformanceTier();
    applyPerformanceClasses(nextTier);
    profileSubscribers.forEach((cb) => {
      try {
        cb(nextTier);
      } catch {}
    });
  };

  if (connection && typeof connection.addEventListener === 'function') {
    connection.addEventListener('change', handleEnvChange);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      const visible = document.visibilityState !== 'hidden';
      visibilitySubscribers.forEach((cb) => {
        try {
          cb(visible);
        } catch {}
      });
    });
  }

  if (nav && typeof nav.getBattery === 'function') {
    nav
      .getBattery()
      .then((battery: any) => {
        if (!battery) return;
        const syncBattery = () => {
          const prevLowBattery =
            typeof cachedBatteryLevel === 'number' &&
            cachedBatteryLevel <= 15 &&
            cachedBatteryCharging === false;

          cachedBatteryLevel = Math.round((battery.level ?? 1) * 100);
          cachedBatteryCharging = Boolean(battery.charging);

          if (cachedDiagnostics) {
            cachedDiagnostics.batteryLevel = cachedBatteryLevel;
            cachedDiagnostics.isBatteryCharging = cachedBatteryCharging;
          }

          const nextLowBattery = cachedBatteryLevel <= 15 && !cachedBatteryCharging;
          if (prevLowBattery !== nextLowBattery) {
            handleEnvChange();
          }
        };
        syncBattery();
        if (typeof battery.addEventListener === 'function') {
          battery.addEventListener('levelchange', syncBattery);
          battery.addEventListener('chargingchange', syncBattery);
        }
      })
      .catch(() => {});
  }

  startIdleRefreshRateCalibration();
}

export function detectDeviceCapabilities(forceRefresh = false): DeviceDiagnostics {
  if (typeof window === 'undefined') {
    return {
      tier: 'balanced',
      hardwareConcurrency: 4,
      deviceMemoryGB: 4,
      connectionType: '4g',
      downlinkMbps: 10,
      rttMs: 50,
      isSaveDataActive: false,
      screenRefreshRate: 60,
      isTouchDevice: false,
      devicePixelRatio: 1,
      isLowEndDevice: false,
    };
  }

  initEnvironmentListeners();

  if (cachedDiagnostics && !forceRefresh) {
    return cachedDiagnostics;
  }

  const nav = navigator as any;
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const net = getNetworkDiagnostics();
  const dpr = window.devicePixelRatio || 1;
  const isTouch = nav.maxTouchPoints > 0 || 'ontouchstart' in window;
  const gpuRenderer = probeGpuOnce();

  const lowerGpu = (gpuRenderer || '').toLowerCase();
  const isBudgetGpu =
    lowerGpu.includes('mali-400') ||
    lowerGpu.includes('mali-450') ||
    lowerGpu.includes('mali-t') ||
    lowerGpu.includes('mali-g31') ||
    lowerGpu.includes('mali-g51') ||
    lowerGpu.includes('mali-g52') ||
    lowerGpu.includes('mali-g57') ||
    lowerGpu.includes('adreno (tm) 3') ||
    lowerGpu.includes('adreno (tm) 4') ||
    lowerGpu.includes('adreno (tm) 504') ||
    lowerGpu.includes('adreno (tm) 505') ||
    lowerGpu.includes('adreno (tm) 506') ||
    lowerGpu.includes('adreno (tm) 508') ||
    lowerGpu.includes('adreno (tm) 509') ||
    lowerGpu.includes('adreno (tm) 610') ||
    lowerGpu.includes('adreno (tm) 612') ||
    lowerGpu.includes('adreno (tm) 613') ||
    lowerGpu.includes('adreno (tm) 616') ||
    lowerGpu.includes('powervr') ||
    lowerGpu.includes('vivante') ||
    lowerGpu.includes('unisoc') ||
    lowerGpu.includes('spreadtrum') ||
    lowerGpu.includes('swiftshader') ||
    lowerGpu.includes('llvmpipe');

  const isFlagshipGpu =
    lowerGpu.includes('adreno (tm) 7') ||
    lowerGpu.includes('adreno (tm) 8') ||
    lowerGpu.includes('immortalis') ||
    lowerGpu.includes('mali-g710') ||
    lowerGpu.includes('mali-g715') ||
    lowerGpu.includes('mali-g720') ||
    lowerGpu.includes('mali-g77') ||
    lowerGpu.includes('mali-g78') ||
    lowerGpu.includes('apple') ||
    lowerGpu.includes('nvidia') ||
    lowerGpu.includes('radeon') ||
    lowerGpu.includes('arc') ||
    lowerGpu.includes('metal');

  const isLowBatteryUnplugged =
    typeof cachedBatteryLevel === 'number' &&
    cachedBatteryLevel <= 15 &&
    cachedBatteryCharging === false;

  const isLowMemory = memory <= 2;
  const isLowCores = cores <= 2;
  const isLowEndDevice =
    isLowMemory ||
    isLowCores ||
    net.isSlowConnection ||
    net.isSaveDataActive ||
    isBudgetGpu ||
    isLowBatteryUnplugged;

  let tier: DeviceTier = 'balanced';
  if (isLowEndDevice || net.isSaveDataActive || isLowBatteryUnplugged) {
    tier = 'lite_saver';
  } else if ((cores >= 8 && memory >= 6 && !net.isSlowConnection) || isFlagshipGpu) {
    tier = 'ultra';
  } else if (cores >= 6 && memory >= 4 && !net.isSlowConnection) {
    tier = 'high';
  } else {
    tier = 'balanced';
  }

  const screenRefreshRate =
    measuredRefreshRate ||
    (window.screen && (window.screen as any).refreshRate
      ? (window.screen as any).refreshRate
      : tier === 'ultra'
      ? 120
      : tier === 'high'
      ? 90
      : 60);

  cachedDiagnostics = {
    tier,
    hardwareConcurrency: cores,
    deviceMemoryGB: memory,
    connectionType: net.effectiveType,
    downlinkMbps: net.downlinkMbps,
    rttMs: net.rttMs,
    isSaveDataActive: net.isSaveDataActive,
    screenRefreshRate,
    isTouchDevice: isTouch,
    devicePixelRatio: dpr,
    isLowEndDevice,
    batteryLevel: cachedBatteryLevel,
    isBatteryCharging: cachedBatteryCharging,
    gpuRenderer,
  };

  return cachedDiagnostics;
}

const STORAGE_KEY = 'ka_pulse_performance_tier';

export function getActivePerformanceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  const stored = safeStorage.getItem(STORAGE_KEY);
  if (
    stored &&
    (stored === 'ultra' || stored === 'high' || stored === 'balanced' || stored === 'lite_saver')
  ) {
    return stored as DeviceTier;
  }
  return detectDeviceCapabilities().tier;
}

export function setActivePerformanceTier(tier: DeviceTier): void {
  if (typeof window === 'undefined') return;
  safeStorage.setItem(STORAGE_KEY, tier);
  applyPerformanceClasses(tier);
  profileSubscribers.forEach((cb) => {
    try {
      cb(tier);
    } catch {}
  });
}

export function resetPerformanceTierToAuto(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  safeStorage.removeItem(STORAGE_KEY);
  const auto = detectDeviceCapabilities(true);
  applyPerformanceClasses(auto.tier);
  profileSubscribers.forEach((cb) => {
    try {
      cb(auto.tier);
    } catch {}
  });
  return auto.tier;
}

export function subscribeToPerformanceTier(callback: (tier: DeviceTier) => void): () => void {
  initEnvironmentListeners();
  profileSubscribers.add(callback);
  return () => {
    profileSubscribers.delete(callback);
  };
}

export function subscribeToAppVisibility(callback: (isVisible: boolean) => void): () => void {
  initEnvironmentListeners();
  visibilitySubscribers.add(callback);
  return () => {
    visibilitySubscribers.delete(callback);
  };
}

export function getProfileConfig(tier?: DeviceTier): PerformanceProfileConfig {
  const activeTier = tier || getActivePerformanceTier();
  return PROFILE_CONFIGS[activeTier];
}

export function isLowEndOrReducedMotion(tier?: DeviceTier): boolean {
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
      }
    } catch {}
  }
  const activeTier = tier || getActivePerformanceTier();
  return activeTier === 'lite_saver';
}

export function applyPerformanceClasses(tier: DeviceTier): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const targetClass = `tier-${tier.replace('_', '-')}`;
  if (!root.classList.contains(targetClass)) {
    root.classList.remove('tier-ultra', 'tier-high', 'tier-balanced', 'tier-lite-saver');
    root.classList.add(targetClass);
  }

  if (tier === 'lite_saver') {
    if (!root.classList.contains('lite-mode-active')) {
      root.classList.add('lite-mode-active');
    }
  } else if (root.classList.contains('lite-mode-active')) {
    root.classList.remove('lite-mode-active');
  }
}

export function scheduleFrame(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    callback();
    return () => {};
  }
  const frameId = window.requestAnimationFrame(() => callback());
  return () => window.cancelAnimationFrame(frameId);
}

export function scheduleIdleTask(callback: () => void, timeoutMs = 1200): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const win = window as any;
  if (typeof win.requestIdleCallback === 'function') {
    const id = win.requestIdleCallback(() => callback(), { timeout: timeoutMs });
    return () => {
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(id);
      }
    };
  }
  const timer = window.setTimeout(callback, 120);
  return () => window.clearTimeout(timer);
}

/**
 * Prewarms the lazy-loaded ReaderView chunk on hover/touch intent so opening
 * a chapter is instantaneous (< 16ms) even on slow mobile networks.
 */
export function prewarmReaderChunk(): void {
  if (readerChunkPrewarmed || typeof window === 'undefined') return;
  readerChunkPrewarmed = true;
  scheduleIdleTask(() => {
    import('../components/reader/ReaderView').catch(() => {
      readerChunkPrewarmed = false;
    });
  }, 800);
}

/**
 * On High & Ultra devices with fast, non-Save-Data connections, pre-compiles core
 * interactive route/modal chunks during browser idle frames for 0ms navigation.
 */
export function prewarmHighEndAppChunks(tier?: DeviceTier): void {
  if (coreChunksPrewarmed || typeof window === 'undefined') return;
  const profile = getProfileConfig(tier);
  if (!profile.enableIdleChunkPrefetch) return;
  const net = getNetworkDiagnostics();
  if (net.isSlowConnection || net.isSaveDataActive) return;

  coreChunksPrewarmed = true;
  scheduleIdleTask(() => {
    if (document.visibilityState === 'hidden') return;
    void import('../components/reader/ReaderView').catch(() => {});
    readerChunkPrewarmed = true;
    scheduleIdleTask(() => {
      if (document.visibilityState === 'hidden') return;
      void import('../components/manga/MangaDetailModal').catch(() => {});
      void import('../pages/BackdropPage').catch(() => {});
    }, 2500);
  }, 1800);
}

export function preloadMangaImages(imageUrls: string[], priorityCount = 3): void {
  if (typeof window === 'undefined' || !imageUrls || imageUrls.length === 0) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

  const targets = imageUrls.slice(0, priorityCount);

  targets.forEach((url) => {
    if (!url || preloadedUrlCache.has(url)) return;
    if (preloadedUrlCache.size > 200) {
      preloadedUrlCache.clear();
    }
    preloadedUrlCache.add(url);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    } catch {
      // Safe fallback
    }
  });
}

