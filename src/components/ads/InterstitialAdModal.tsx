import React, { useState, useEffect } from 'react';
import { AdData } from '../../types';
import { Sparkles, X, Volume2, VolumeX, ShieldCheck, ArrowRight } from 'lucide-react';
import { ADMOB_TEST_CONFIG } from '../../utils/admobConfig';

interface InterstitialAdModalProps {
  ad: AdData;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  nextChapterTitle?: string;
  adUnitId?: string;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  ad,
  isOpen,
  onClose,
  onUpgradeClick,
  nextChapterTitle,
  adUnitId = ADMOB_TEST_CONFIG.REWARDED_INTERSTITIAL_ID,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(5);
      setCanSkip(false);
      return;
    }

    // Try preparing Native Capacitor AdMob Interstitial if running natively
    import('@capacitor-community/admob')
      .then(({ AdMob }) => {
        AdMob.prepareInterstitial({
          adId: adUnitId,
          isTesting: true,
        }).catch(() => {});
      })
      .catch(() => {});

    setSecondsLeft(5);
    setCanSkip(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="interstitial-ad-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="interstitial-ad-modal"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl"
      >
        {/* Top Bar: Monetization Notice & Skip Button */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            <div>
              <span className="text-xs font-semibold text-slate-300 block">
                AZ OVERVERSE Reader Sponsor
              </span>
              <span className="text-[9px] font-mono text-amber-400/90 block">
                Rewarded Interstitial: <code className="bg-black/60 px-1 py-0.2 rounded">{adUnitId}</code>
              </span>
            </div>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              FREE AD-SUPPORTED
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 text-slate-400 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {canSkip ? (
              <button
                id="skip-interstitial-ad-btn"
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition"
              >
                <span>Continue Reading</span>
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 font-mono">
                <span>Skip in</span>
                <span className="font-bold text-amber-400">{secondsLeft}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Sponsor Media Showcase */}
        <div className="relative aspect-video w-full overflow-hidden bg-black group">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          {/* Ad Overlay Content */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {ad.tagline}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
              {ad.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
              {ad.description}
            </p>
          </div>
        </div>

        {/* Bottom CTA & VIP Upgrade Banner */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400">Advertiser</span>
              <p className="text-sm font-semibold text-slate-200">{ad.advertiser}</p>
            </div>
            <button
              id="interstitial-ad-cta-btn"
              onClick={canSkip ? onClose : onUpgradeClick}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 font-bold text-black text-sm transition shadow-md whitespace-nowrap shrink-0"
            >
              <span>{ad.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* VIP Pitch Bar */}
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Tired of waiting on ads?
                  <span className="text-[10px] text-amber-300 font-normal">Only R89/mo</span>
                </h4>
                <p className="text-[11px] text-purple-200">
                  Enjoy 100% ad-free reading + instant VIP chapter access.
                </p>
              </div>
            </div>

            <button
              id="interstitial-upgrade-vip-btn"
              onClick={onUpgradeClick}
              className="shrink-0 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
            >
              Go VIP
            </button>
          </div>

          {nextChapterTitle && (
            <div className="text-center text-[11px] text-slate-400">
              Next Up: <span className="text-slate-200 font-medium">{nextChapterTitle}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
