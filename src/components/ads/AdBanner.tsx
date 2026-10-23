import React from 'react';
import { AdData } from '../../types';
import { ExternalLink, Sparkles, X } from 'lucide-react';

interface AdBannerProps {
  ad: AdData;
  onUpgradeClick: () => void;
  variant?: 'inline' | 'floating-bottom' | 'compact';
  onDismiss?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  ad,
  onUpgradeClick,
  variant = 'inline',
  onDismiss,
}) => {
  if (!ad) return null;

  return (
    <div
      id={`ad-banner-${ad.id}`}
      className={`relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3.5 shadow-lg transition-all ${
        variant === 'floating-bottom'
          ? 'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl border-amber-500/40 shadow-2xl backdrop-blur-md'
          : 'w-full my-4'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left Side: Badge & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border border-slate-700">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-semibold text-center text-amber-400 py-0.5">
              AD
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/80 text-amber-300">
                {ad.badge}
              </span>
              <span className="text-xs text-slate-400 truncate">{ad.advertiser}</span>
            </div>
            <h4 className="text-sm font-semibold text-white truncate hover:text-amber-400 cursor-pointer">
              {ad.title}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-1">{ad.description}</p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            id={`ad-cta-btn-${ad.id}`}
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition shadow-sm whitespace-nowrap shrink-0"
          >
            <span>{ad.ctaText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            id="ad-remove-upgrade-btn"
            onClick={onUpgradeClick}
            title="Remove ads with VIP Pass"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/40 text-xs font-medium transition"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Remove Ads</span>
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white rounded transition"
              title="Hide banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
