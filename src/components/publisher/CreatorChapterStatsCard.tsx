import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  getAllChapterReadingMetrics,
  getCreatorOverallReadingStats,
  subscribeToCreatorChapterStats,
  formatCumulativeDuration,
  formatDigitalCumulative,
  ChapterReadingMetrics,
} from '../../services/creatorChapterStatsService';

interface CreatorChapterStatsCardProps {
  mangaIdFilter?: string;
  className?: string;
  compact?: boolean;
}

export const CreatorChapterStatsCard: React.FC<CreatorChapterStatsCardProps> = ({
  mangaIdFilter,
  className = '',
  compact = false,
}) => {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return subscribeToCreatorChapterStats(() => {
      setRevision((prev) => prev + 1);
    });
  }, []);

  const overallStats = useMemo(() => {
    return getCreatorOverallReadingStats(mangaIdFilter);
  }, [mangaIdFilter, revision]);

  const chapterMetrics = useMemo(() => {
    return getAllChapterReadingMetrics(mangaIdFilter);
  }, [mangaIdFilter, revision]);

  const formatRelativeTime = (isoString: string): string => {
    if (!isoString) return 'Never';
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 60000) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      id="creator-reading-statistics-panel"
      className={`rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-950/90 via-[#0d111d] to-slate-950 p-5 sm:p-6 text-white space-y-6 shadow-xl ${className}`}
    >
      {/* Header with Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white">
                Chapter Reading Duration &amp; Engagement Stats
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Reader Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time cumulative reader duration and chapter completion analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Auto-logging from ReaderView</span>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Total Read Time</span>
          </span>
          <div className="mt-2">
            <span className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wider text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.25)]">
              {formatCumulativeDuration(overallStats.totalReadingDurationSeconds)}
            </span>
            <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
              {formatDigitalCumulative(overallStats.totalReadingDurationSeconds)} cumulative
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reader Sessions</span>
          </span>
          <div className="mt-2">
            <span className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wider text-white">
              {overallStats.totalSessionsCount.toLocaleString()}
            </span>
            <span className="block text-[11px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{overallStats.totalCompletedCount} completed (100%)</span>
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completion Rate</span>
          </span>
          <div className="mt-2">
            <span className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wider text-emerald-300">
              {overallStats.overallCompletionRatePercent}%
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, overallStats.overallCompletionRatePercent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Avg Reader Duration</span>
          </span>
          <div className="mt-2">
            <span className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wider text-purple-300">
              {formatCumulativeDuration(overallStats.averageSessionDurationSeconds)}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              per chapter read session
            </span>
          </div>
        </div>
      </div>

      {/* Per-Chapter Cumulative Duration Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Cumulative Reading Duration Per Chapter</span>
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {chapterMetrics.length} Chapters Logged
          </span>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 overflow-hidden divide-y divide-slate-800/70">
          {chapterMetrics.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No reading sessions logged yet. Open any chapter in the reader to start accumulating real-time duration!
            </div>
          ) : (
            chapterMetrics.map((item) => {
              return (
                <div
                  key={item.chapterId}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
                >
                  {/* Chapter identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    {item.mangaCover && (
                      <img
                        src={item.mangaCover}
                        alt={item.chapterTitle}
                        className="w-10 h-14 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-xs">
                          {item.chapterTitle}
                        </span>
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 font-mono">
                          Ch. {item.chapterNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {item.mangaTitle} · Last read {formatRelativeTime(item.lastReadAt)}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Columns */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 font-mono text-xs">
                    {/* Cumulative Time */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block font-sans uppercase tracking-wider font-semibold">
                        Total Time
                      </span>
                      <span className="font-bold text-amber-300 text-sm">
                        {formatCumulativeDuration(item.totalReadingDurationSeconds)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatDigitalCumulative(item.totalReadingDurationSeconds)}
                      </span>
                    </div>

                    {/* Sessions & Completion */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block font-sans uppercase tracking-wider font-semibold">
                        Sessions
                      </span>
                      <span className="font-bold text-white">
                        {item.totalSessionsCount}
                      </span>
                      <span className="text-[10px] text-emerald-400 block font-sans">
                        {item.completionRatePercent}% comp.
                      </span>
                    </div>

                    {/* Average Time per Reader */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block font-sans uppercase tracking-wider font-semibold">
                        Avg / Reader
                      </span>
                      <span className="font-bold text-slate-200">
                        {formatCumulativeDuration(item.averageSecondsPerSession)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        pace
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorChapterStatsCard;
