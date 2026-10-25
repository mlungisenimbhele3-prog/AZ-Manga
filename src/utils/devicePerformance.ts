// Device Capability & Performance Optimization Engine for AZ OVERVERSE
// Produced by Mlungiseni Mbhele

export type DeviceTier = 'ultra' | 'high' | 'balanced' | 'lite_saver';

export interface DeviceDiagnostics {
  tier: DeviceTier;
  hardwareConcurrency: number;
  deviceMemoryGB: number;
  connectionType: string;
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
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 300,
    reduceDomOverhead: false,
  },
  balanced: {
    targetFps: 60,
    enableBackdropBlur: true,
    enableComplexAnimations: true,
    imagePreloadCount: 2,
    supportDoublePage: true,
    enableHardwareAcceleration: true,
    cacheLimitMB: 150,
    reduceDomOverhead: false,
  },
  lite_saver: {
    targetFps: 60,
    enableBackdropBlur: false,
    enableComplexAnimations: false,
    imagePreloadCount: 1,
    supportDoublePage: false,
    enableHardwareAcceleration: false,
    cacheLimitMB: 50,
    reduceDomOverhead: true,
  },
};

let cachedDiagnostics: DeviceDiagnostics | null = null;
const preloadedUrlCache = new Set<string>();

export function detectDeviceCapabilities(): DeviceDiagnostics {
  if (typeof window === 'undefined') {
    return {
      tier: 'balanced',
      hardwareConcurrency: 4,
      deviceMemoryGB: 4,
      connectionType: '4g',
      isSaveDataActive: false,
      screenRefreshRate: 60,
      isTouchDevice: false,
      devicePixelRatio: 1,
      isLowEndDevice: false,
    };
  }

  if (cachedDiagnostics) {
    return cachedDiagnostics;
  }

  const nav = navigator as any;
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const connType = connection ? connection.effectiveType || '4g' : '4g';
  const isSaveData = connection ? Boolean(connection.saveData) : false;
  const dpr = window.devicePixelRatio || 1;
  const isTouch = nav.maxTouchPoints > 0 || 'ontouchstart' in window;

  // Probe GPU renderer once and immediately release temporary WebGL context
  let gpuRenderer: string | undefined;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const gl = (canvas.getContext('webgl', { powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) {
        loseCtx.loseContext();
      }
    }
  } catch {
    // Safe fallback if WebGL is restricted
  }

  const lowerGpu = (gpuRenderer || '').toLowerCase();
  const isBudgetGpu =
    lowerGpu.includes('mali-400') ||
    lowerGpu.includes('mali-t') ||
    lowerGpu.includes('mali-g52') ||
    lowerGpu.includes('adreno (tm) 3') ||
    lowerGpu.includes('adreno (tm) 505') ||
    lowerGpu.includes('adreno (tm) 506') ||
    lowerGpu.includes('powervr');

  const isFlagshipGpu =
    lowerGpu.includes('adreno (tm) 7') ||
    lowerGpu.includes('immortalis') ||
    lowerGpu.includes('apple') ||
    lowerGpu.includes('nvidia') ||
    lowerGpu.includes('radeon');

  const isSlowNetwork = connType === 'slow-2g' || connType === '2g' || connType === '3g';
  const isLowMemory = memory <= 2;
  const isLowCores = cores <= 2;
  const isLowEndDevice = isLowMemory || isLowCores || isSlowNetwork || isSaveData || isBudgetGpu;

  let tier: DeviceTier = 'balanced';
  if (isLowEndDevice || isSaveData) {
    tier = 'lite_saver';
  } else if ((cores >= 8 && memory >= 6 && !isSlowNetwork) || isFlagshipGpu) {
    tier = 'ultra';
  } else if (cores >= 6 && memory >= 4 && !isSlowNetwork) {
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
    connectionType: connType,
    isSaveDataActive: isSaveData,
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
}

export function resetPerformanceTierToAuto(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  const auto = detectDeviceCapabilities();
  applyPerformanceClasses(auto.tier);
  return auto.tier;
}

export function getProfileConfig(tier?: DeviceTier): PerformanceProfileConfig {
  const activeTier = tier || getActivePerformanceTier();
  return PROFILE_CONFIGS[activeTier];
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

export function preloadMangaImages(imageUrls: string[], priorityCount = 2): void {
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
