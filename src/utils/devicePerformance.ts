// Device Capability & Adaptive Performance Engine for AZ OVERVERSE
// Produced by Mlungiseni Mbhele

export type DeviceTier = 'ultra' | 'high' | 'balanced' | 'lite_saver';

export interface NetworkDiagnostics {
  effectiveType: string;
  downlinkMbps: number;
  rttMs: number;
  isSaveDataActive: boolean;
  isSlowConnection: boolean;
  recommendedPreloadConcurrency: 1 | 2 | 3;
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
  preloadConcurrency: 1 | 2 | 3;
  maxDecodedPagesInMemory: number;
  supportDoublePage: boolean;
  enableHardwareAcceleration: boolean;
  cacheLimitMB: number;
  reduceDomOverhead: boolean;
}

const PROFILE_CONFIGS: Record<DeviceTier, PerformanceProfileConfig> = {
  ultra: {
    targetFps: 120,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 4,
    preloadConcurrency: 3,
    maxDecodedPagesInMemory: 24,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 500,
    reduceDomOverhead: false,
  },
  high: {
    targetFps: 90,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 3,
    preloadConcurrency: 3,
    maxDecodedPagesInMemory: 16,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 300,
    reduceDomOverhead: false,
  },
  balanced: {
    targetFps: 60,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 3,
    preloadConcurrency: 2,
    maxDecodedPagesInMemory: 10,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 150,
    reduceDomOverhead: false,
  },
  lite_saver: {
    targetFps: 60,
    enableBackdropBlur: false,
    enableComplexAnimations: false,
    // Always preload the next 3 pages sequentially (concurrency 1) so slow networks
    // and low-RAM phones still get seamless reading without bandwidth contention or OOM
    imagePreloadCount: 3,
    preloadConcurrency: 1,
    maxDecodedPagesInMemory: 6,
    supportDoublePage: false,
    enableHardwareAcceleration: false,
    cacheLimitMB: 60,
    reduceDomOverhead: true,
  },
};

let cachedDiagnostics: DeviceDiagnostics | null = null;
let cachedGpuRenderer: string | undefined;
let gpuProbed = false;
let listenersInitialized = false;
let readerChunkPrewarmed = false;

const preloadedUrlCache = new Set<string>();
const profileSubscribers = new Set<(tier: DeviceTier) => void>();

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

  const recommendedPreloadConcurrency: 1 | 2 | 3 = isSlowConnection
    ? 1
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

  if (nav && typeof nav.getBattery === 'function') {
    nav
      .getBattery()
      .then((battery: any) => {
        if (!battery) return;
        const syncBattery = () => {
          if (cachedDiagnostics) {
            cachedDiagnostics.batteryLevel = Math.round((battery.level ?? 1) * 100);
            cachedDiagnostics.isBatteryCharging = Boolean(battery.charging);
          }
          if (!battery.charging && typeof battery.level === 'number' && battery.level <= 0.15) {
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
    lowerGpu.includes('mali-t') ||
    lowerGpu.includes('mali-g52') ||
    lowerGpu.includes('mali-g57') ||
    lowerGpu.includes('adreno (tm) 3') ||
    lowerGpu.includes('adreno (tm) 505') ||
    lowerGpu.includes('adreno (tm) 506') ||
    lowerGpu.includes('adreno (tm) 610') ||
    lowerGpu.includes('powervr');

  const isFlagshipGpu =
    lowerGpu.includes('adreno (tm) 7') ||
    lowerGpu.includes('adreno (tm) 8') ||
    lowerGpu.includes('immortalis') ||
    lowerGpu.includes('apple') ||
    lowerGpu.includes('nvidia') ||
    lowerGpu.includes('radeon');

  const isLowMemory = memory <= 2;
  const isLowCores = cores <= 2;
  const isLowEndDevice =
    isLowMemory || isLowCores || net.isSlowConnection || net.isSaveDataActive || isBudgetGpu;

  let tier: DeviceTier = 'balanced';
  if (isLowEndDevice || net.isSaveDataActive) {
    tier = 'lite_saver';
  } else if ((cores >= 8 && memory >= 6 && !net.isSlowConnection) || isFlagshipGpu) {
    tier = 'ultra';
  } else if (cores >= 6 && memory >= 4 && !net.isSlowConnection) {
    tier = 'high';
  } else {
    tier = 'balanced';
  }

  const screenRefreshRate =
    window.screen && (window.screen as any).refreshRate
      ? (window.screen as any).refreshRate
      : tier === 'ultra'
      ? 120
      : tier === 'high'
      ? 90
      : 60;

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
    gpuRenderer,
  };

  return cachedDiagnostics;
}

const STORAGE_KEY = 'ka_pulse_performance_tier';

export function getActivePerformanceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (
      stored &&
      (stored === 'ultra' || stored === 'high' || stored === 'balanced' || stored === 'lite_saver')
    ) {
      return stored as DeviceTier;
    }
  } catch {
    // Safe fallback
  }
  return detectDeviceCapabilities().tier;
}

export function setActivePerformanceTier(tier: DeviceTier): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch {}
  applyPerformanceClasses(tier);
  profileSubscribers.forEach((cb) => {
    try {
      cb(tier);
    } catch {}
  });
}

export function resetPerformanceTierToAuto(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
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
  root.classList.remove('tier-ultra', 'tier-high', 'tier-balanced', 'tier-lite-saver');
  root.classList.add(`tier-${tier.replace('_', '-')}`);

  if (tier === 'lite_saver') {
    root.classList.add('lite-mode-active');
  } else {
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

export function preloadMangaImages(imageUrls: string[], priorityCount = 3): void {
  if (typeof window === 'undefined' || !imageUrls || imageUrls.length === 0) return;
  const targets = imageUrls.slice(0, priorityCount);

  targets.forEach((url) => {
    if (!url || preloadedUrlCache.has(url)) return;
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
