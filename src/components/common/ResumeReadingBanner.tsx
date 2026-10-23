import React from 'react';
import { Play, BookOpen, Clock, X } from 'lucide-react';
import { Manga } from '../../types';

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
  onDismiss: () => void;
  onResume: (mangaId: string, chapterId: string) => void;
}

export const ResumeReadingBanner: React.FC<ResumeReadingBannerProps> = ({
  progress,
  onDismiss,
  onResume,
}) => {
  if (!progress) return null;

  const percent = progress.totalPages > 0 ? Math.round(((progress.pageIndex + 1) / progress.totalPages) * 100) : 0;

  return (
    <div
      id="resume-reading-productivity-banner"
      className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-3 sm:p-4 shadow-lg flex items-center justify-between gap-4 animate-fadeIn"
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <img
          src={progress.coverImage}
          alt={progress.mangaTitle}
          className="h-12 w-9 rounded-lg object-cover border border-amber-500/30 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="flex items-center gap-1 rounded bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 tracking-wider uppercase">
              <Clock className="w-2.5 h-2.5" />
              RESUME READING
            </span>
            <span className="text-[10px] text-amber-300 font-mono">
              Ch. {progress.chapterNumber} • Page {progress.pageIndex + 1}/{progress.totalPages} ({percent}%)
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
            {progress.mangaTitle}: <span className="text-slate-300 font-normal">{progress.chapterTitle}</span>
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          id="resume-reading-now-btn"
          onClick={() => onResume(progress.mangaId, progress.chapterId)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black px-3.5 py-2 text-xs transition shadow-md"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span className="hidden sm:inline">Continue</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          title="Dismiss resume banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
