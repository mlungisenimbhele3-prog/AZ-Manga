import React, { useState } from 'react';
import { Download, Smartphone, Apple, Check, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenStoreModal?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenStoreModal,
  className = '',
  fullWidth = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  // If already running standalone and not requesting store modal, show subtle badge
  if (isInstalled) {
    return (
      <button
        onClick={onOpenStoreModal}
        className={`flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition shadow-sm ${
          fullWidth ? 'w-full justify-center' : ''
        } ${className}`}
        title="App Installed - View App Hub"
      >
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>Installed (PWA)</span>
      </button>
    );
  }

  // Handle direct install for Chromium / Android
  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else if (onOpenStoreModal) {
      onOpenStoreModal();
    } else {
      setShowBrowserGuide(true);
    }
  };

  return (
    <>
      <button
        id="navbar-install-app-btn"
        onClick={handleInstallClick}
        className={`flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-black font-black px-3 py-2 text-xs transition shadow-md shadow-emerald-950/40 active:scale-98 ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        title="Install OVERVERSE on your phone, tablet, or PC"
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>{isIOS ? 'Install OVERVERSE (iOS)' : 'Install OVERVERSE App'}</span>
      </button>

      {showBrowserGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowBrowserGuide(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Install OVERVERSE</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed space-y-2">
              <span className="block">1. Open OVERVERSE in a full browser tab if viewing in preview.</span>
              <span className="block">2. Tap your browser menu (<strong>⋮</strong>) or address bar install icon.</span>
              <span className="block">3. Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</span>
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowBrowserGuide(false)}
                className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed space-y-2">
              <span className="block">1. In Safari, tap the <strong>Share</strong> icon <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> at the bottom.</span>
              <span className="block">2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              <span className="block">3. Tap <strong>Add</strong> in the top right corner.</span>
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
