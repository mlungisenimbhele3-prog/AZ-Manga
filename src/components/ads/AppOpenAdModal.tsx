import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { ADMOB_CONFIG } from '../../utils/admobConfig';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';
import { initializeAdMobOnce } from './AdMobBanner';

interface AppOpenAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  adUnitId?: string;
  onUpgradeClick?: () => void;
}

export const AppOpenAdModal: React.FC<AppOpenAdModalProps> = ({
  isOpen,
  onClose,
  adUnitId = ADMOB_CONFIG.INTERSTITIAL_ID,
  onUpgradeClick,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanDismiss(false);
      return;
    }

    if (Capacitor.isNativePlatform()) {
      initializeAdMobOnce().then(() => {
        import('@capacitor-community/admob')
          .then(async ({ AdMob }) => {
            await AdMob.prepareInterstitial({
              adId: adUnitId,
              isTesting: false,
            });
            await AdMob.showInterstitial();
          })
          .catch(() => {});
      });
    }

    setCountdown(5);
    setCanDismiss(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanDismiss(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, adUnitId]);

  if (!isOpen) return null;

  return (
    <div
      id="app-open-ad-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="app-open-ad-modal"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl flex flex-col justify-between"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <img
              src={APP_LOGO_SRC}
              alt="AZ OVERVERSE"
              className="h-8 w-8 rounded-lg object-cover shrink-0 border border-amber-500/30"
            />
            <div>
              <span className="text-xs font-bold text-white block">Google AdMob Interstitial</span>
              <span className="text-[9px] font-mono text-amber-400/90 block">
                Unit ID: <code className="bg-black/60 px-1 py-0.2 rounded">{adUnitId}</code>
              </span>
            </div>
          </div>

          <div>
            {canDismiss ? (
              <button
                id="dismiss-app-open-ad-btn"
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-black transition shadow"
              >
                <span>Continue to App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                Dismiss in {countdown}s
              </span>
            )}
          </div>
        </div>

        {/* Ad Body Hero */}
        <div className="p-6 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-amber-950/40 via-slate-950 to-purple-950/40 p-5 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-amber-500 text-black px-2 py-0.5 text-[10px] font-black uppercase">
                Google AdMob
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                70% Rev-Share Active
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-white">
                AZ OVERVERSE • Next-Gen Digital Manga
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                Empowering African mangaka with direct creator monetization and global reader distribution.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified AdMob Partner</span>
              </div>
              <span className="text-amber-400 font-mono text-[10px]">
                app-open-v1
              </span>
            </div>
          </div>

          {/* Value proposition & Upgrade CTA */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <h5 className="text-xs font-bold text-white">Want zero ads forever?</h5>
              <p className="text-[11px] text-slate-400">
                Upgrade to VIP Pass for ad-free chapters & early releases.
              </p>
            </div>
            {onUpgradeClick && (
              <button
                onClick={() => {
                  onClose();
                  onUpgradeClick();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 px-3 py-1.5 text-xs font-bold transition whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>VIP Pass (R89)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-5 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>Ad unit loaded: {adUnitId.slice(-10)}</span>
          <span className="text-amber-400 font-semibold text-[11px]">
            Google AdMob SDK Active
          </span>
        </div>
      </div>
    </div>
  );
};
