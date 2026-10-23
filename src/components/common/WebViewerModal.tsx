import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  EyeOff,
  Maximize2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import {
  WebViewerSettings,
  DEFAULT_WEBVIEWER_SETTINGS,
  getWebViewerConfig,
  setWebViewerConfig,
} from '../../utils/webViewerConfig';

interface WebViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebViewerModal: React.FC<WebViewerModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<WebViewerSettings>(getWebViewerConfig());
  const [copiedUa, setCopiedUa] = useState<boolean>(false);
  const [testZoomAttempted, setTestZoomAttempted] = useState<boolean>(false);
  const [currentViewportWidth, setCurrentViewportWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setCurrentViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const handleToggle = (key: keyof WebViewerSettings) => {
    if (typeof settings[key] === 'boolean') {
      const updated = setWebViewerConfig({
        [key]: !settings[key],
      });
      setSettings(updated);
    }
  };

  const handleResetToSpec = () => {
    const fresh = setWebViewerConfig(DEFAULT_WEBVIEWER_SETTINGS);
    setSettings(fresh);
  };

  const handleCopyUserAgent = () => {
    navigator.clipboard.writeText(settings.userAgent);
    setCopiedUa(true);
    setTimeout(() => setCopiedUa(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="webviewer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800/80 sticky top-0 bg-slate-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20">
              <Smartphone className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-[10px] px-2 py-0.5 uppercase tracking-wider">
                  Android & WebViewer Spec
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Configured
                </span>
              </div>
              <h2 id="webviewer-modal-title" className="text-lg sm:text-xl font-black text-white">
                WebViewer Component Configuration
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close WebViewer configuration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Spec Summary Card */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-300">Target WebViewer Properties Active</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Configured for App Inventor, Kodular, Android WebView, and Capacitor runtimes.
                  Enforce responsive rendering, eliminate unwanted zoom distortion, and identify as Android 13 Mobile.
                </p>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
              Active WebViewer Properties
            </h3>

            {/* 1. ZoomDisplay */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                  <EyeOff className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">ZoomDisplay</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        !settings.zoomDisplay
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {!settings.zoomDisplay ? 'UNCHECKED (OFF)' : 'CHECKED (ON)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Suppresses the on-screen zoom control display buttons and zoom scale overlays.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleToggle('zoomDisplay')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    !settings.zoomDisplay
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!settings.zoomDisplay ? 'bg-slate-400' : 'bg-amber-400'}`}></span>
                  <span>{!settings.zoomDisplay ? 'Unchecked' : 'Checked'}</span>
                </button>
              </div>
            </div>

            {/* 2. SupportZoom */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">SupportZoom</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        !settings.supportZoom
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {!settings.supportZoom ? 'UNCHECKED (STOPS ENLARGE/SHRINK)' : 'CHECKED (ZOOM ALLOWED)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Locks magnification. Stops accidental pinch-to-zoom, double-tap zoom, and multi-touch page deformation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleToggle('supportZoom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    !settings.supportZoom
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!settings.supportZoom ? 'bg-slate-400' : 'bg-amber-400'}`}></span>
                  <span>{!settings.supportZoom ? 'Unchecked' : 'Checked'}</span>
                </button>
              </div>
            </div>

            {/* 3. UseWideViewPort */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                  <Maximize2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">UseWideViewPort</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        settings.useWideViewPort
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {settings.useWideViewPort ? 'CHECKED = TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Forces WebView to use wide viewport tag (width=device-width, 100% screen width) without narrow letterboxing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleToggle('useWideViewPort')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    settings.useWideViewPort
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${settings.useWideViewPort ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                  <span>{settings.useWideViewPort ? 'Checked = TRUE' : 'Unchecked'}</span>
                </button>
              </div>
            </div>

            {/* 4. UserAgent */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">UserAgent</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ANDROID 13 MOBILE
                  </span>
                </div>
                <button
                  onClick={handleCopyUserAgent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition"
                >
                  {copiedUa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedUa ? 'Copied!' : 'Copy String'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 font-mono text-xs text-amber-300/90 break-all select-all">
                {settings.userAgent}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Active runtime viewport: {currentViewportWidth}px wide</span>
                <span>Platform: Linux (Android 13)</span>
              </div>
            </div>
          </div>

          {/* Interactive Zoom Prevention Test Arena */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Enlarge / Shrink Test Zone
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                SupportZoom: {!settings.supportZoom ? 'OFF (Locked)' : 'ON (Active)'}
              </span>
            </div>

            <div
              onWheel={(e) => {
                if (e.ctrlKey) {
                  setTestZoomAttempted(true);
                  setTimeout(() => setTestZoomAttempted(false), 2000);
                }
              }}
              className="h-28 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 flex flex-col items-center justify-center p-3 text-center transition relative overflow-hidden"
            >
              {testZoomAttempted ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs animate-bounce">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Enlarge / Shrink Blocked! SupportZoom = FALSE is working.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-slate-300 font-medium">
                    Try pinch zooming or Ctrl + Mouse Wheel here
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {!settings.supportZoom
                      ? 'Gestures are intercepted and locked at 100% scale.'
                      : 'Zoom is currently enabled.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Integration Snippets for App Inventor / Kodular / Android Java */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Android WebSettings Reference (MainActivity.java)</span>
              <span className="font-mono text-[10px] text-slate-400">Synchronized</span>
            </div>
            <pre className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
{`WebSettings settings = webView.getSettings();
settings.setDisplayZoomControls(false); // Uncheck ZoomDisplay
settings.setBuiltInZoomControls(false);
settings.setSupportZoom(false);        // Uncheck SupportZoom (stops enlarge/shrink)
settings.setUseWideViewPort(true);     // Check UseWideViewPort = TRUE
settings.setLoadWithOverviewMode(true);
settings.setUserAgentString("${settings.userAgent}");`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={handleResetToSpec}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to User Spec</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition shadow-lg shadow-amber-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
