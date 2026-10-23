import React, { useState, useEffect } from 'react';
import { AdData, Chapter } from '../../types';
import { Play, Sparkles, CheckCircle2, Award, X, ShieldAlert } from 'lucide-react';
import { ADMOB_TEST_CONFIG } from '../../utils/admobConfig';

interface RewardedAdModalProps {
  ad: AdData;
  chapter: Chapter;
  isOpen: boolean;
  onClose: () => void;
  onRewardGranted: (chapterId: string) => void;
  onUpgradeClick: () => void;
  onUnlockComplete?: () => void;
  adUnitId?: string;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  ad,
  chapter,
  isOpen,
  onClose,
  onRewardGranted,
  onUpgradeClick,
  onUnlockComplete,
  adUnitId = ADMOB_TEST_CONFIG.REWARDED_ADS_ID,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [completed, setCompleted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCountdown(10);
      setCompleted(false);
      setImgError(false);
      return;
    }

    // Prepare Native Capacitor AdMob Rewarded Video if running natively
    import('@capacitor-community/admob')
      .then(({ AdMob }) => {
        AdMob.prepareRewardVideoAd({
          adId: adUnitId,
          isTesting: true,
        }).catch(() => {});
      })
      .catch(() => {});
  }, [isOpen, adUnitId]);

  useEffect(() => {
    if (!isPlaying || completed) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCompleted(true);
          onRewardGranted(chapter.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, completed, chapter.id, onRewardGranted]);

  const handleStartAd = async () => {
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      const rewardItem = await AdMob.showRewardVideoAd();
      if (rewardItem) {
        setCompleted(true);
        onRewardGranted(chapter.id);
        return;
      }
    } catch {
      // Running in Web/Preview environment — run interactive AdMob sponsor video countdown
    }
    setIsPlaying(true);
  };

  if (!isOpen) return null;

  return (
    <div
      id="rewarded-ad-overlay"
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        id="rewarded-ad-modal"
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block">Watch Ad to Unlock Chapter</span>
              <span className="text-[10px] font-mono text-amber-400/90 block">
                Google AdMob Rewarded: <code className="bg-black/60 px-1 py-0.5 rounded">{adUnitId}</code>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {!isPlaying && !completed ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400">
                <Play className="w-8 h-8 fill-amber-400 ml-1" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Unlock {chapter.title || `Chapter ${chapter.number}`}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mb-6">
                Watch a short Google AdMob rewarded video to unlock {chapter.title || `Chapter ${chapter.number}`} for free, or subscribe via Google Play Billing for unlimited ad-free access.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  id="start-rewarded-ad-btn"
                  type="button"
                  onClick={handleStartAd}
                  className="min-h-[48px] flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-4 text-sm transition shadow-lg whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-black shrink-0" />
                  <span>Watch Ad & Unlock</span>
                </button>

                <button
                  id="rewarded-sub-option-btn"
                  type="button"
                  onClick={onUpgradeClick}
                  className="min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 font-semibold py-3 px-4 text-sm transition whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Google Play VIP</span>
                </button>
              </div>
            </div>
          ) : isPlaying && !completed ? (
            <div className="flex flex-col gap-3">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                {!imgError && ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 flex flex-col items-center justify-center p-6 text-center">
                    <Award className="w-10 h-10 text-amber-400/60 mb-2" />
                    <span className="text-sm font-bold text-slate-200">{ad.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-black/80 border border-amber-400/80 flex items-center justify-center mb-2">
                    <span className="font-mono text-2xl font-black text-amber-400 tabular-nums">
                      {countdown}
                    </span>
                  </div>
                  <span className="text-xs text-white font-medium bg-black/70 px-3 py-1 rounded-lg">
                    Chapter unlocks in {countdown}s...
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Sponsor: {ad.advertiser}</span>
                <span className="text-amber-400 font-semibold">{ad.title}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-4 text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Next Chapter Unlocked!</h3>
              <p className="text-xs text-slate-300 max-w-sm mb-6">
                Thank you for supporting creators via Google AdMob. {chapter.title || `Chapter ${chapter.number}`} is now unlocked.
              </p>
              <button
                id="enter-unlocked-chapter-btn"
                type="button"
                onClick={() => {
                  onUnlockComplete?.();
                  onClose();
                }}
                className="min-h-[48px] w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 text-sm transition shadow-lg whitespace-nowrap"
              >
                Read Chapter Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
