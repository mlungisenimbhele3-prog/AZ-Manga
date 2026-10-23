import React, { useState } from 'react';
import { BonusContentItem, UserSubscription } from '../../types';
import {
  X,
  Sparkles,
  Crown,
  Download,
  BookOpen,
  Image as ImageIcon,
  Lock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ShieldCheck,
  Heart,
  Share2,
  CheckCircle,
} from 'lucide-react';

interface BonusContentViewerModalProps {
  item: BonusContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  userSubscription: UserSubscription;
  onUpgradeClick: () => void;
}

export const BonusContentViewerModal: React.FC<BonusContentViewerModalProps> = ({
  item,
  isOpen,
  onClose,
  userSubscription,
  onUpgradeClick,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const isPatronUser = userSubscription.tier === 'patron';
  const pages = item.pages && item.pages.length > 0 ? item.pages : [item.coverImage];

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
    // Trigger download of image
    const link = document.createElement('a');
    link.href = item.downloadUrl || pages[currentPage];
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_4k.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div
      id="bonus-content-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="bonus-content-modal"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-rose-500/40 bg-slate-950 text-white shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-rose-950/70 via-slate-900 to-purple-950/70 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-black shadow-md">
              <Crown className="w-5 h-5 fill-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {item.category.toUpperCase()} • PATRON EXCLUSIVE
                </span>
                {item.resolution && (
                  <span className="hidden sm:inline text-[10px] font-mono text-slate-400">
                    {item.resolution}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                {item.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              id="bonus-modal-close-btn"
              onClick={onClose}
              className="rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-black/60 min-h-[350px]">
          {isPatronUser ? (
            /* Unlocked View for Patron */
            <div className="w-full flex flex-col items-center">
              <div className="relative max-w-2xl w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center group">
                <img
                  src={pages[currentPage]}
                  alt={item.title}
                  className="w-full max-h-[58vh] object-contain select-none"
                  loading="lazy"
                />

                {/* Multi-page controls if omake or sketch series */}
                {pages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 hover:bg-black p-2.5 text-white disabled:opacity-30 disabled:pointer-events-none transition shadow"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
                      disabled={currentPage === pages.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 hover:bg-black p-2.5 text-white disabled:opacity-30 disabled:pointer-events-none transition shadow"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-xs font-mono text-amber-300 border border-amber-500/30">
                      Page {currentPage + 1} of {pages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Author Notes & Description */}
              <div className="mt-4 w-full max-w-2xl space-y-2">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                {item.authorNote && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200/90 leading-relaxed">
                      <strong className="text-amber-300 block mb-0.5">Author's Studio Note:</strong>
                      {item.authorNote}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Locked Preview for Free / VIP / Early Access Users */
            <div className="relative w-full max-w-lg p-6 rounded-3xl border border-rose-500/40 bg-gradient-to-b from-slate-900 to-slate-950 text-center shadow-2xl flex flex-col items-center">
              {/* Blurred background teaser */}
              <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-5 border border-slate-800">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover blur-md scale-105 opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col items-center justify-center p-4">
                  <div className="h-14 w-14 rounded-2xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 mb-2 shadow-xl">
                    <Lock className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                    Locked Content
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-black text-white">
                Exclusive to Creator Patron Pass
              </h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed max-w-md">
                "{item.title}" is reserved exclusively for Patron tier subscribers. Subscribe to instantly view author sketches, bonus full-color omake chapters, high-res 4K wallpapers, and support African creators with a 70% direct royalty pool!
              </p>

              <div className="mt-5 w-full flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="unlock-bonus-patron-btn"
                  onClick={() => {
                    onClose();
                    onUpgradeClick();
                  }}
                  className="w-full flex-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 py-3 text-xs font-black text-white transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>Join Patron Tier to Unlock</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition"
                >
                  Maybe Later
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>70% of Patron memberships go directly to African manga creators</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {isPatronUser && (
          <div className="border-t border-slate-800/80 bg-slate-950 px-5 py-3 flex items-center justify-between gap-3 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">Patron Privilege Active</span>
            </div>

            <div className="flex items-center gap-3">
              {isCopied && (
                <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                  Link copied!
                </span>
              )}
              {downloadSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Download started!</span>
                </span>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-black transition shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Asset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
