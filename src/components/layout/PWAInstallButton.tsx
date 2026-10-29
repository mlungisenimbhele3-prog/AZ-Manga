import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Apple, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';

export interface PWAInstallButtonProps {
  onOpenStoreModal?: () => void;
  className?: string;
  fullWidth?: boolean;
  compact?: boolean;
  alwaysShowInMenu?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenStoreModal,
  className = '',
  fullWidth = false,
  compact = false,
  alwaysShowInMenu = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  // Automatically hide install UI when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  // In compact header mode, only render when native install prompt is available or on iOS Safari
  if (compact && !isInstallable && !isIOS) {
    return null;
  }

  // In standard mode outside menus, hide if neither installable nor iOS nor menu-forced
  if (!alwaysShowInMenu && !isInstallable && !isIOS) {
    return null;
  }

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

  const modals =
    typeof document !== 'undefined' && (showBrowserGuide || showIOSGuide)
      ? createPortal(
          <>
            {showBrowserGuide && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-left">
                  <button
                    onClick={() => setShowBrowserGuide(false)}
                    className="absolute right-3 top-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Close install instructions"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-3 pr-8">
                    <img
                      src={APP_LOGO_SRC}
                      alt="AZ OVERVERSE"
                      className="h-9 w-9 rounded-full bg-black object-contain shrink-0"
                    />
                    <h3 className="text-base font-bold text-white">Install OVERVERSE</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed space-y-2">
                    <span className="block">
                      1. Open OVERVERSE in a full browser tab if viewing inside an embedded frame.
                    </span>
                    <span className="block">
                      2. Tap your browser menu (<strong>⋮</strong>) or the address bar install icon.
                    </span>
                    <span className="block">
                      3. Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                    </span>
                  </p>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => setShowBrowserGuide(false)}
                      className="min-h-[44px] w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showIOSGuide && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-left">
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="absolute right-3 top-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Close iOS install instructions"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-3 pr-8">
                    <img
                      src={APP_LOGO_SRC}
                      alt="AZ OVERVERSE"
                      className="h-9 w-9 rounded-full bg-black object-contain shrink-0"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                      <span className="text-[11px] text-amber-400 inline-flex items-center gap-1">
                        <Apple className="w-3 h-3" /> Safari Home Screen
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed space-y-2">
                    <span className="block">
                      1. In Safari, tap the <strong>Share</strong> icon{' '}
                      <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> in the toolbar.
                    </span>
                    <span className="block">
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </span>
                    <span className="block">
                      3. Tap <strong>Add</strong> in the top right corner to launch OVERVERSE standalone.
                    </span>
                  </p>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => setShowIOSGuide(false)}
                      className="min-h-[44px] w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )
      : null;

  if (compact) {
    return (
      <>
        <button
          id="header-install-pwa-btn"
          type="button"
          onClick={handleInstallClick}
          className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-2 text-xs transition active:scale-95 shadow-sm ${className}`}
          title="Install OVERVERSE App"
          aria-label="Install OVERVERSE App"
        >
          <Download className="w-4 h-4 stroke-[2.5] shrink-0" />
          <span className="hidden sm:inline">{isIOS ? 'Install on iOS' : 'Install App'}</span>
        </button>
        {modals}
      </>
    );
  }

  return (
    <>
      <button
        id="navbar-install-app-btn"
        type="button"
        onClick={handleInstallClick}
        className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-3.5 py-2.5 text-xs transition shadow-md shadow-emerald-950/40 active:scale-98 ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        title="Install OVERVERSE on your phone, tablet, or desktop"
      >
        <Download className="w-4 h-4 stroke-[2.5] shrink-0" />
        <span>{isIOS ? 'Install OVERVERSE on iOS' : 'Install OVERVERSE App'}</span>
      </button>
      {modals}
    </>
  );
};
