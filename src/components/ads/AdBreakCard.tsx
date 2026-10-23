import React from 'react';
import { AdData } from '../../types';
import { Sparkles, ExternalLink } from 'lucide-react';

interface AdBreakCardProps {
  ad: AdData;
  onUpgradeClick: () => void;
}

export const AdBreakCard: React.FC<AdBreakCardProps> = ({ ad, onUpgradeClick }) => {
  const [acknowledged, setAcknowledged] = React.useState(false);
  if (!ad) return null;

  return (
    <div
      id="in-stream-ad-break"
      className="my-6 mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Google AdMob · Sponsored Break
        </span>
        <button
          onClick={onUpgradeClick}
          className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 transition"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Google Play VIP</span>
        </button>
      </div>

      <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-28 w-full sm:w-44 rounded-lg object-cover border border-slate-800"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 text-left">
          <span className="text-xs text-slate-400 font-medium">{ad.advertiser}</span>
          <h4 className="text-base font-bold text-white mb-1">{ad.title}</h4>
          <p className="text-xs text-slate-300 line-clamp-2 mb-3">{ad.description}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAcknowledged(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
            >
              <span>{acknowledged ? 'Sponsor Viewed' : ad.ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-400">Scroll down to continue manga</span>
          </div>
        </div>
      </div>
    </div>
  );
};
