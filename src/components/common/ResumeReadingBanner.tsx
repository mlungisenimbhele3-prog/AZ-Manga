import React from 'react';
import { Play, BookOpen, Clock, ChevronRight, Bookmark } from 'lucide-react';

export interface LastReadProgress {
  mangaId: string;
  mangaTitle: string;
  coverImage: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  pageIndex: number;
  totalPages: number;
  timestamp: string;
}

interface ResumeReadingBannerProps {
  progress: LastReadProgress | null;
  onDismiss?: () => void;
  onResume: (mangaId: string, chapterId: string) => void;
  className?: string;
}

export const ResumeReadingBanner: React.FC<ResumeReadingBannerProps> = ({
  progress,
  onDismiss,
  onResume,
  className = '',
}) => {
  if (!progress) return null;

  const total = Math.max(1, progress.totalPages || 20);
  const current = Math.min(total, (progress.pageIndex ?? 0) + 1);
  const percent = Math.min(100, Math.max(5, Math.round((current / total) * 100)));

  return (
    <div
      id="resume-reading-productivity-banner"
      className={`relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl transition-all hover:border-amber-500/70 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Manga & Chapter Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative group/cover shrink-0">
            <img
              src={progress.coverImage}
              alt={progress.mangaTitle}
              className="h-16 w-12 sm:h-20 sm:w-14 rounded-xl object-cover border-2 border-amber-500/40 shadow-lg shadow-black/60 group-hover/cover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="flex items-center gap-1 rounded bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 tracking-wider uppercase shadow-sm">
                <Clock className="w-3 h-3 text-black" />
                CONTINUE READING
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">
                Chapter {progress.chapterNumber}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-white truncate drop-shadow-sm">
              {progress.mangaTitle}
            </h3>
            <p className="text-xs text-slate-300 truncate">
              {progress.chapterTitle || `Chapter ${progress.chapterNumber}`}
            </p>

            {/* Visual Progress Bar */}
            <div className="mt-2.5 max-w-md">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span className="text-amber-400 font-bold">{percent}% Read</span>
                <span className="text-slate-400">
                  Page {current} of {total}
                </span>
              </div>
              <div className="w-full bg-slate-950/90 h-2.5 rounded-full overflow-hidden border border-slate-700/70 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.65)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
          <button
            id="resume-reading-now-btn"
            type="button"
            onClick={() => onResume(progress.mangaId, progress.chapterId)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black px-5 py-2.5 text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Resume Chapter {progress.chapterNumber}</span>
            <ChevronRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
