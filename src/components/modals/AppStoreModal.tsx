import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Download,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  QrCode,
  Layers,
  Terminal,
  Share2,
  Award,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';

interface AppStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (title: string, desc?: string, type?: 'success' | 'info' | 'favorite' | 'vip') => void;
}

export const AppStoreModal: React.FC<AppStoreModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'apple' | 'packaging' | 'qr'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const appUrl = 'https://az-oververse.ai.studio';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    appUrl
  )}&bgcolor=0e1117&color=ffd700&margin=10`;

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify?.(`${label} Copied!`, 'Saved to your clipboard.', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        onNotify?.('Installation Accepted!', 'AZ OVERVERSE is adding to your home screen.', 'vip');
      }
    } else if (isIOS) {
      setActiveTab('apple');
      onNotify?.('iOS Installation Guide', 'Follow the 2-step Safari home screen instructions.', 'info');
    } else {
      onNotify?.(
        'PWA Standalone Ready',
        'Use the browser menu (⋮) -> "Install App" or "Add to Home Screen".',
        'info'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f0424] border border-amber-500/40 shadow-inner overflow-hidden">
                <img
                  src={APP_LOGO_SRC}
                  alt="AZ OVERVERSE App Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">
                    AZ OVERVERSE Mobile App
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                    Signed v1.0.2
                  </span>
                </div>
                <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Produced by Mlungiseni Mbhele</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Google Play & Apple Ready</span>
                </p>
              </div>
            </div>

            <button
              id="appstore-modal-close-btn"
              onClick={onClose}
              className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'android'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950/50'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Google Play / Android</span>
            </button>

            <button
              onClick={() => setActiveTab('apple')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'apple'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>Apple App Store / iOS</span>
            </button>

            <button
              onClick={() => setActiveTab('packaging')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'packaging'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-950/50'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Store Packaging & TWA</span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'qr'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Phone QR Install</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* TAB 1: Android & Google Play */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500 text-black px-2 py-0.5 text-[10px] font-black uppercase">
                      Instant WebAPK
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      Install Directly on Android Device
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                    Install AZ OVERVERSE with one tap. Runs standalone in fullscreen without address bar, supports offline chapter reading and high-refresh scrolling.
                  </p>
                </div>

                <button
                  id="android-direct-install-btn"
                  onClick={handleDirectInstall}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs px-5 py-3 shadow-lg shadow-emerald-950/60 transition whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalled ? 'App Already Installed' : 'Install App on Device'}</span>
                </button>
              </div>

              {/* Signed Google Play Console Release Bundle v1.0.2 */}
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/25 p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-semibold">
                    <span>Release v1.0.2 (Code 102)</span>
                    <span aria-hidden="true">·</span>
                    <span>com.azoververse.app</span>
                    <span aria-hidden="true">·</span>
                    <span>RSA-2048 SHA256withRSA Signed</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Signed Google Play Store Release Bundle (AZ-OVERVERSE-signed.aab)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ready for Google Play Console upload: cryptographically signed <code className="text-cyan-300 font-mono text-[11px]">AZ-OVERVERSE-signed.aab</code> built with package <code className="text-emerald-300 font-mono text-[11px]">com.azoververse.app</code>, version <code className="text-amber-300 font-mono text-[11px]">1.0.2</code> (versionCode 102), Target SDK 35, and the Black AZ launcher icon.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                  <a
                    id="android-aab-direct-download-link"
                    href="/AZ-OVERVERSE-signed.aab"
                    download="AZ-OVERVERSE-signed.aab"
                    className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-5 py-2.5 shadow-lg shadow-cyan-950/50 transition whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download AZ-OVERVERSE-signed.aab</span>
                  </a>
                </div>
              </div>

              {/* Google Play Store Badge / Listing Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0f0424] border border-slate-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={APP_LOGO_SRC}
                        alt="AZ OVERVERSE Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Google Play Store Submission Profile</h5>
                      <p className="text-[11px] text-slate-400">
                        Package: <code className="text-emerald-400">com.azoververse.app</code> · v1.0.2
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                    Play Console Signed
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center text-xs">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Producer</div>
                    <div className="text-xs font-bold text-amber-400 truncate">Mlungiseni Mbhele</div>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Rating</div>
                    <div className="text-xs font-bold text-white">Teen 13+ (Comics)</div>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Monetization</div>
                    <div className="text-xs font-bold text-white">70% Creator Rev</div>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Architecture</div>
                    <div className="text-xs font-bold text-emerald-400">TWA / PWA</div>
                  </div>
                </div>
              </div>

              {/* Google AdMob Production Ad Units */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500 text-black px-2 py-0.5 text-[10px] font-black uppercase">
                      AdMob Live Units
                    </span>
                    <h5 className="text-xs font-bold text-white">Google Mobile Ads Production IDs</h5>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Production Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-sans font-semibold">App ID (Manifest)</div>
                    <code className="text-[11px] text-amber-400 block break-all">ca-app-pub-7570164094154420~3142297870</code>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-sans font-semibold">Banner</div>
                    <code className="text-[11px] text-cyan-400 block break-all">ca-app-pub-7570164094154420/3068852398</code>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-sans font-semibold">Interstitial</div>
                    <code className="text-[11px] text-emerald-400 block break-all">ca-app-pub-7570164094154420/2379433436</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Apple App Store & iOS */}
          {activeTab === 'apple' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                    <Apple className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Install on iPhone & iPad (Safari Web Clip)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Zero-app-store-fee native experience on iOS 16.4+ with push notifications
                    </p>
                  </div>
                </div>

                {/* 2-Step iOS instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">
                        1
                      </span>
                      <span className="text-xs font-bold text-white">Tap Safari Share</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Tap the <strong className="text-blue-400">Share</strong> button (the box with an upward arrow) in the Safari bottom toolbar.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">
                        2
                      </span>
                      <span className="text-xs font-bold text-white">Add to Home Screen</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Scroll down and select <strong className="text-blue-400 font-semibold">"Add to Home Screen"</strong>. Icon and splash art are pre-configured.
                    </p>
                  </div>
                </div>

                {/* iOS App Store / Capacitor Metadata */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Bundle / Package ID:</span>
                    <code className="text-amber-400">com.azoververse.app</code>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Developer Team:</span>
                    <span className="text-white font-semibold">Mlungiseni Mbhele</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Apple Touch Icon:</span>
                    <span className="text-emerald-400 font-mono">/apple-touch-icon.png (180x180)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Store Packaging (Bubblewrap & PWABuilder) */}
          {activeTab === 'packaging' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Google Play Store (Bubblewrap CLI Command)
                    </h4>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `npm i -g @bubblewrap/cli && bubblewrap init --manifest=${appUrl}/manifest.json && bubblewrap build`,
                        'bubblewrap',
                        'Play Store Command'
                      )
                    }
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white transition"
                  >
                    {copiedKey === 'bubblewrap' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Command</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-xl bg-black/80 border border-slate-800 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <code>
                    npx @bubblewrap/cli init --manifest={appUrl}/manifest.json
                    <br />
                    npx @bubblewrap/cli build
                  </code>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generates a signed <code className="text-white">.aab</code> (Android App Bundle) ready to drag and drop directly into your Google Play Developer Console.
                </p>
              </div>

              {/* PWABuilder 1-Click Link */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold text-white">PWABuilder (Microsoft / Google Partner)</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Instant packaging for Google Play, Apple App Store, and Windows Store.
                  </p>
                </div>
                <a
                  href={`https://www.pwabuilder.com?site=${encodeURIComponent(appUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 text-xs font-bold transition shadow"
                >
                  <span>Open PWABuilder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: Phone QR Code */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
                <img
                  src={qrCodeUrl}
                  alt="Scan to open on smartphone"
                  className="w-48 h-48 rounded-xl object-contain"
                />
              </div>

              <div className="max-w-sm space-y-1">
                <h4 className="text-sm font-bold text-white">Scan with your Phone Camera</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instantly opens AZ OVERVERSE on your smartphone. Android will display the instant install banner and iOS will prompt to Add to Home Screen.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full max-w-sm">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-300 font-mono select-all"
                />
                <button
                  onClick={() => copyToClipboard(appUrl, 'qrUrl', 'App URL')}
                  className="rounded-xl bg-amber-500 text-black px-3 py-2 text-xs font-bold hover:bg-amber-400 transition"
                >
                  {copiedKey === 'qrUrl' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Executive Producer: <strong className="text-white">Mlungiseni Mbhele</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDirectInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 font-bold transition shadow"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isInstalled ? 'Running Standalone' : 'Install PWA'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2 font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
