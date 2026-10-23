import React, { useEffect, useState } from 'react';
import { AdData } from '../../types';
import { ExternalLink, Sparkles } from 'lucide-react';
import { ADMOB_TEST_CONFIG } from '../../utils/admobConfig';

export const TEST_ADMOB_APP_ID = ADMOB_TEST_CONFIG.APP_ID;
export const TEST_ADMOB_BANNER_ID = ADMOB_TEST_CONFIG.BANNER_ID;
export const TEST_ADMOB_APP_OPEN_ID = ADMOB_TEST_CONFIG.APP_OPEN_ID;
export const TEST_ADMOB_REWARDED_INTERSTITIAL_ID = ADMOB_TEST_CONFIG.REWARDED_INTERSTITIAL_ID;
export const TEST_ADMOB_REWARDED_ADS_ID = ADMOB_TEST_CONFIG.REWARDED_ADS_ID;
export const TEST_ADMOB_INTERSTITIAL_ID = ADMOB_TEST_CONFIG.INTERSTITIAL_ID;

// Global singleton flag: AdMob is only initialized ONCE, not in every component
let isAdMobInitialized = false;

export async function initializeAdMobOnce(): Promise<void> {
  if (isAdMobInitialized) return;
  isAdMobInitialized = true;
  try {
    // If Capacitor AdMob plugin is available on native platform
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      testingDevices: ['EMULATOR'],
      initializeForTesting: true,
    });
  } catch {
    // Native plugin unavailable or running in Web/PWA mode - fallback gracefully
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
    initializeAdMobOnce().then(() => {
      import('@capacitor-community/admob')
        .then(({ AdMob, BannerAdSize, BannerAdPosition }) => {
          AdMob.showBanner({
            adId: bannerId,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            isTesting: true,
          })
            .then(() => setIsNativeBannerActive(true))
            .catch(() => setIsNativeBannerActive(false));
        })
        .catch(() => {
          setIsNativeBannerActive(false);
        });
    });
  }, [bannerId]);

  if (variant === 'persistent-bottom') {
    if (isNativeBannerActive) {
      return (
        <div
          id="persistent-admob-native-spacer"
          className="fixed bottom-0 left-0 right-0 z-[115] h-[44px] pointer-events-none"
          aria-hidden="true"
        />
      );
    }

    return (
      <aside
        id="persistent-bottom-admob-banner"
        aria-label="Google AdMob Bottom Banner"
        className={`fixed bottom-0 left-0 right-0 z-[115] h-[44px] bg-slate-950/95 backdrop-blur-md border-t border-amber-500/30 px-3 sm:px-5 flex items-center justify-between gap-2 shadow-2xl select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-bold tracking-wide text-amber-400 shrink-0">
            AdMob
          </span>
          <span aria-hidden="true" className="text-slate-600 shrink-0">·</span>
          <p className="text-xs font-medium text-slate-200 truncate">
            {showAdUnitDetails
              ? `Google AdMob Unit ${bannerId} · 70% Creator Share`
              : ad?.title || 'Google Mobile Ads · Supporting Mangaka Creators'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdUnitDetails((prev) => !prev)}
            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0"
          >
            {showAdUnitDetails ? 'Hide ID' : 'Ad Info'}
          </button>
          {onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="min-h-[32px] flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>Google Play VIP</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  if (isNativeBannerActive) {
    return <div className="h-14 w-full" aria-hidden="true" />;
  }

  return (
    <div
      className={`my-3 overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900 p-3 shadow-lg ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-black flex items-center justify-center">
            {ad?.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.title || 'Google AdMob Sponsor'}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-[10px] font-black text-amber-400">AdMob</div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-amber-300">Google AdMob</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono truncate">{bannerId.slice(-10)}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
              {ad?.title || 'Google Mobile Ads · 70% Creator Revenue Share'}
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              {showAdUnitDetails
                ? `Active AdMob Banner Unit: ${bannerId}`
                : ad?.description || 'Ads directly fund African mangaka and indie storytellers.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="min-h-[40px] flex items-center gap-1 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Remove Ads</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdUnitDetails((prev) => !prev)}
            className="min-h-[40px] flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-bold transition shadow whitespace-nowrap shrink-0"
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
