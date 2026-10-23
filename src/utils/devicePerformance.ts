// Device Capability & Performance Optimization Engine for KA Plus: African Pulse
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
    enableBackdropBlur: false, // Critical: Disable GPU backdrop-blur on low-end Mali/Adreno GPUs
    enableComplexAnimations: false,
    imagePreloadCount: 1,
    supportDoublePage: false,
    enableHardwareAcceleration: false, // Avoid VRAM blowups on low-RAM devices
    cacheLimitMB: 50,
    reduceDomOverhead: true,
  },
};

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

  const nav = navigator as any;
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4; // in GB
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const connType = connection ? connection.effectiveType || '4g' : '4g';
  const isSaveData = connection ? Boolean(connection.saveData) : false;
  const dpr = window.devicePixelRatio || 1;
  const isTouch = nav.maxTouchPoints > 0 || 'ontouchstart' in window;

  // Detect GPU information via WebGL
  let gpuRenderer: string | undefined;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    // Ignore WebGL error
  }

  // Detect low-end GPU markers
  const lowerGpu = (gpuRenderer || '').toLowerCase();
  const isBudgetGpu = lowerGpu.includes('mali-400') ||
    lowerGpu.includes('mali-t') ||
    lowerGpu.includes('mali-g52') ||
    lowerGpu.includes('adreno (tm) 3') ||
    lowerGpu.includes('adreno (tm) 505') ||
    lowerGpu.includes('adreno (tm) 506') ||
    lowerGpu.includes('powervr');
  
  const isFlagshipGpu = lowerGpu.includes('adreno (tm) 7') ||
    lowerGpu.includes('immortalis') ||
    lowerGpu.includes('apple') ||
    lowerGpu.includes('nvidia') ||
    lowerGpu.includes('radeon');

  // Detect low-end markers
  const isSlowNetwork = connType === 'slow-2g' || connType === '2g' || connType === '3g';
  const isLowMemory = memory <= 2;
  const isLowCores = cores <= 2;
  const isLowEndDevice = isLowMemory || isLowCores || isSlowNetwork || isSaveData || isBudgetGpu;

  // Calculate estimated tier
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

  // Refresh rate estimate (standard default 60, modern 120Hz devices)
  const screenRefreshRate = window.screen && (window.screen as any).refreshRate ? (window.screen as any).refreshRate : (tier === 'ultra' ? 120 : tier === 'high' ? 90 : 60);

  return {
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
}

const STORAGE_KEY = 'ka_pulse_performance_tier';

export function getActivePerformanceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'ultra' || stored === 'high' || stored === 'balanced' || stored === 'lite_saver')) {
    return stored as DeviceTier;
  }
  const auto = detectDeviceCapabilities();
  return auto.tier;
}

export function setActivePerformanceTier(tier: DeviceTier): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, tier);
  // Apply global class to document for zero-CSS overhead switches
  applyPerformanceClasses(tier);
}

export function resetPerformanceTierToAuto(): DeviceTier {
  if (typeof window === 'undefined') return 'balanced';
  localStorage.removeItem(STORAGE_KEY);
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

/**
 * High-performance RAF scheduler ensuring 60Hz/120Hz render synchronization
 */
export function scheduleFrame(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    callback();
    return () => {};
  }
  const frameId = window.requestAnimationFrame(() => callback());
  return () => window.cancelAnimationFrame(frameId);
}

/**
 * Preloads manga page images with asynchronous decoding to prevent main-thread jank
 */
export function preloadMangaImages(imageUrls: string[], priorityCount = 2): void {
  if (typeof window === 'undefined' || !imageUrls || imageUrls.length === 0) return;
  const targets = imageUrls.slice(0, priorityCount);

  targets.forEach((url) => {
    if (!url) return;
    try {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    } catch (e) {
      // Safe fallback if preloading fails
    }
  });
}

