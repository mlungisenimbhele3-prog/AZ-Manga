import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdData } from '../../types';
import { Sparkles } from 'lucide-react';
import { ADMOB_TEST_CONFIG } from '../../utils/admobConfig';

export const TEST_ADMOB_APP_ID = ADMOB_TEST_CONFIG.APP_ID;
export const TEST_ADMOB_BANNER_ID = ADMOB_TEST_CONFIG.BANNER_ID;
export const TEST_ADMOB_APP_OPEN_ID = ADMOB_TEST_CONFIG.APP_OPEN_ID;
export const TEST_ADMOB_REWARDED_INTERSTITIAL_ID = ADMOB_TEST_CONFIG.REWARDED_INTERSTITIAL_ID;
export const TEST_ADMOB_REWARDED_ADS_ID = ADMOB_TEST_CONFIG.REWARDED_ADS_ID;
export const TEST_ADMOB_INTERSTITIAL_ID = ADMOB_TEST_CONFIG.INTERSTITIAL_ID;

// Global singleton flag: AdMob is only initialized ONCE on native platforms
let isAdMobInitialized = false;

export async function initializeAdMobOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isAdMobInitialized) return;
  isAdMobInitialized = true;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      testingDevices: ['EMULATOR'],
      initializeForTesting: true,
    });
  } catch {
    // Native plugin unavailable - fallback gracefully to web test banner
  }
}

export interface AdMobBannerProps {
  ad?: AdData;
  bannerId?: string;
  onUpgradeClick?: () => void;
  variant?: 'inline' | 'persistent-bottom';
  className?: string;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  ad,
  bannerId = TEST_ADMOB_BANNER_ID,
  onUpgradeClick,
  variant = 'inline',
  className = '',
}) => {
  const [isNativeBannerActive, setIsNativeBannerActive] = useState(false);
  const [showAdUnitDetails, setShowAdUnitDetails] = useState(false);

  useEffect(() => {
    // Only invoke native Capacitor AdMob overlay on real Android/iOS native runtime.
    // On Web / PWA, `@capacitor-community/admob` resolves a no-op web stub without rendering UI,
    // so we must render our visible Google AdMob Test Ad banner directly in the DOM.
    if (!Capacitor.isNativePlatform()) {
      setIsNativeBannerActive(false);
      return;
    }

    let cancelled = false;
    initializeAdMobOnce().then(() => {
      import('@capacitor-community/admob')
        .then(({ AdMob, BannerAdSize, BannerAdPosition }) => {
          AdMob.showBanner({
            adId: bannerId,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            isTesting: true,
          })
            .then(() => {
              if (!cancelled) setIsNativeBannerActive(true);
            })
            .catch(() => {
              if (!cancelled) setIsNativeBannerActive(false);
            });
        })
        .catch(() => {
          if (!cancelled) setIsNativeBannerActive(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  if (variant === 'persistent-bottom') {
    if (isNativeBannerActive) {
      return (
        <div
          id="persistent-admob-native-spacer"
          className="fixed bottom-0 left-0 right-0 z-[115] h-[50px] pointer-events-none"
          aria-hidden="true"
        />
      );
    }

    return (
      <aside
        id="persistent-bottom-admob-banner"
        role="region"
        aria-label="Google AdMob Bottom Test Ad"
        className={`fixed bottom-0 left-0 right-0 z-[115] h-[50px] bg-slate-950 border-t border-slate-800 px-3 sm:px-5 flex items-center justify-center shadow-2xl select-none ${className}`}
      >
        <div className="w-full max-w-5xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-950 shrink-0">
              Test Ad
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                <span className="truncate">
                  {showAdUnitDetails
                    ? `AdMob Test Banner · ${bannerId}`
                    : 'Google AdMob Test Ad · Nice job! This is a 320×50 test banner.'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tabular-nums truncate hidden sm:block">
                Unit ID: {bannerId} · Test Mode Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdUnitDetails((prev) => !prev)}
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0"
            >
              {showAdUnitDetails ? 'Hide ID' : 'Ad Info'}
            </button>
            {onUpgradeClick && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="min-h-[34px] flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Remove Ads</span>
                <span className="inline sm:hidden">VIP</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  if (isNativeBannerActive) {
    return <div className="h-[50px] w-full" aria-hidden="true" />;
  }

  return (
    <div
      className={`my-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-lg ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center">
            <span className="text-[10px] font-bold text-amber-400">Test Ad</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-amber-300">Google AdMob Test Ad</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums truncate">{bannerId}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
              {ad?.title || 'Nice job! This is a Google AdMob test banner.'}
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              {showAdUnitDetails
                ? `Active AdMob Test Banner Unit: ${bannerId}`
                : ad?.description || 'Test mode enabled for safe development and verification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="min-h-[40px] flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Remove Ads</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdUnitDetails((prev) => !prev)}
            className="min-h-[40px] flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0"
          >
            <span>{showAdUnitDetails ? 'Hide Unit ID' : 'Ad Info'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Also export BannerAd alias for interoperability
export const BannerAd = AdMobBanner;
