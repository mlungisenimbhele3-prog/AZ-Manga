import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Zap,
  Battery,
  Wifi,
  Monitor,
  HardDrive,
  Trash2,
  CheckCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Shield,
  Smartphone,
  Gauge,
} from 'lucide-react';
import {
  DeviceTier,
  DeviceDiagnostics,
  detectDeviceCapabilities,
  getActivePerformanceTier,
  setActivePerformanceTier,
  resetPerformanceTierToAuto,
  getProfileConfig,
} from '../../utils/devicePerformance';
import { safeStorage } from '../../utils/safeStorage';

interface DevicePerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTierChanged?: (tier: DeviceTier) => void;
}

export const DevicePerformanceModal: React.FC<DevicePerformanceModalProps> = ({
  isOpen,
  onClose,
  onTierChanged,
}) => {
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics>(detectDeviceCapabilities());
  const [activeTier, setActiveTier] = useState<DeviceTier>(getActivePerformanceTier());
  const [storageStats, setStorageStats] = useState<{ usedMB: number; totalMB: number; percent: number }>({
    usedMB: 0,
    totalMB: 50,
    percent: 0,
  });
  const [clearToast, setClearToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDiagnostics(detectDeviceCapabilities());
      setActiveTier(getActivePerformanceTier());
      safeStorage.getStorageUsageEstimate().then(setStorageStats);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTier = (tier: DeviceTier) => {
    setActiveTier(tier);
    setActivePerformanceTier(tier);
    onTierChanged?.(tier);
  };

  const handleResetAuto = () => {
    const autoTier = resetPerformanceTierToAuto();
    setActiveTier(autoTier);
    onTierChanged?.(autoTier);
    setClearToast(`Reset to Auto: ${autoTier.toUpperCase()} profile calibrated.`);
    setTimeout(() => setClearToast(null), 3000);
  };

  const handleClearCache = () => {
    const freed = safeStorage.evictOldCaches();
    safeStorage.getStorageUsageEstimate().then(setStorageStats);
    setClearToast(`Storage optimized! Evicted ${freed} temporary cache items.`);
    setTimeout(() => setClearToast(null), 3500);
  };

  const profile = getProfileConfig(activeTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Bebas_Neue',sans-serif] text-2xl text-white tracking-wider">
                  DEVICE COMPATIBILITY & PERFORMANCE ENGINE
                </h3>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-2 py-0.5 font-bold uppercase">
                  Adaptive 20×
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrate smoothness, touch latency, and memory usage for your exact device.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {clearToast && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950 border border-emerald-500/40 px-3.5 py-2 text-xs text-emerald-300 shadow">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{clearToast}</span>
            </div>
          )}

          {/* Current Hardware Telemetry */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hardware Telemetry & Specs
              </span>
              <button
                onClick={handleResetAuto}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Calibrate</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>CPU Cores</span>
                </div>
                <span className="font-mono text-base font-black text-white">
                  {diagnostics.hardwareConcurrency} Cores
                </span>
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Device RAM</span>
                </div>
                <span className="font-mono text-base font-black text-white">
                  ~{diagnostics.deviceMemoryGB} GB
                </span>
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Network</span>
                </div>
                <span className="font-mono text-base font-black text-white uppercase">
                  {diagnostics.connectionType}
                </span>
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Display Scale</span>
                </div>
                <span className="font-mono text-base font-black text-white">
                  {diagnostics.devicePixelRatio}x ({diagnostics.screenRefreshRate}Hz)
                </span>
              </div>
            </div>

            {diagnostics.gpuRenderer && (
              <div className="mt-3 pt-2.5 border-t border-slate-900 text-[11px] text-slate-400 truncate">
                <span className="text-slate-500 font-semibold">Detected GPU: </span>
                <span className="font-mono text-slate-300">{diagnostics.gpuRenderer}</span>
              </div>
            )}
          </div>

          {/* Performance Profiles Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Select Performance & Smoothness Profile
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ultra Performance */}
              <button
                onClick={() => handleSelectTier('ultra')}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  activeTier === 'ultra'
                    ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Ultra (120Hz ProMotion)
                  </span>
                  {activeTier === 'ultra' && (
                    <span className="rounded-full bg-amber-500 text-black text-[10px] font-black px-2 py-0.2">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Maximum visual fidelity, dual-page book spread, dynamic lighting, and preloads 4 pages ahead. Ideal for flagship phones & tablets.
                </p>
              </button>

              {/* High Performance */}
              <button
                onClick={() => handleSelectTier('high')}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  activeTier === 'high'
                    ? 'border-purple-400 bg-purple-500/10 ring-2 ring-purple-400/40 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    High (90Hz Fluid)
                  </span>
                  {activeTier === 'high' && (
                    <span className="rounded-full bg-purple-500 text-white text-[10px] font-black px-2 py-0.2">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Smooth 90fps transitions, backdrop-blur effects enabled, and 3-page predictive caching.
                </p>
              </button>

              {/* Balanced Standard */}
              <button
                onClick={() => handleSelectTier('balanced')}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  activeTier === 'balanced'
                    ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Balanced (60Hz Default)
                  </span>
                  {activeTier === 'balanced' && (
                    <span className="rounded-full bg-emerald-500 text-black text-[10px] font-black px-2 py-0.2">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Standard 60fps reading experience optimized for battery efficiency and general mobile devices.
                </p>
              </button>

              {/* Lite Device Saver */}
              <button
                onClick={() => handleSelectTier('lite_saver')}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  activeTier === 'lite_saver'
                    ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    Lite Saver (0% Lag / Low RAM)
                  </span>
                  {activeTier === 'lite_saver' && (
                    <span className="rounded-full bg-cyan-400 text-black text-[10px] font-black px-2 py-0.2">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Zero GPU blur overhead, eliminates thermal throttling on budget phones, reduces RAM consumption by 70%, instant touch response.
                </p>
              </button>
            </div>
          </div>

          {/* Active Profile Rules Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
              Active Optimization Directives
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Target Refresh:</span>
                <span className="font-mono font-bold text-amber-400">{profile.targetFps} FPS</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">GPU Backdrop Blur:</span>
                <span className={`font-bold ${profile.enableBackdropBlur ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {profile.enableBackdropBlur ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Preload Depth:</span>
                <span className="font-mono font-bold text-purple-400">+{profile.imagePreloadCount} Pages</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Dual-Page Tankobon:</span>
                <span className={`font-bold ${profile.supportDoublePage ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {profile.supportDoublePage ? 'READY' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Hardware Layer:</span>
                <span className={`font-bold ${profile.enableHardwareAcceleration ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {profile.enableHardwareAcceleration ? '3D GPU' : '2D CPU'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">RAM Quota Limit:</span>
                <span className="font-mono font-bold text-white">{profile.cacheLimitMB} MB</span>
              </div>
            </div>
          </div>

          {/* Device Storage Management */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Storage & Cache Quota
              </span>
              <span className="text-xs font-mono text-slate-300">
                {storageStats.usedMB} MB used
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, storageStats.percent))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 max-w-sm">
                Safe storage auto-prunes old chapter images when disk space runs low on budget phones.
              </p>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Optimize Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Official IP & Backdrop License Mandate */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 text-slate-400 text-[10px] leading-relaxed text-center">
          All AZ Originals are © AZ OVERVERSE / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ OVERVERSE has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Produced by Mlungiseni Mbhele • AZ OVERVERSE
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 text-xs font-black transition shadow"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
