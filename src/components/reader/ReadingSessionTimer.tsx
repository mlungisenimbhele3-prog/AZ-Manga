import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  Clock,
  Flame,
  Sparkles,
  Trophy,
  Share2,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  X,
  Coins,
  BookOpen,
  Zap,
  BarChart3,
  Check,
} from 'lucide-react';
import { safeStorage } from '../../utils/safeStorage';
import { addUserCoins } from '../../utils/readingStreak';
import { StarRatingInput } from '../common/StarRating';
import { Manga, Chapter } from '../../types';
import {
  getChapterReadingMetrics,
  formatCumulativeDuration,
} from '../../services/creatorChapterStatsService';

export interface ChapterReadingSessionSummary {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  mangaId: string;
  mangaTitle: string;
  mangaCover: string;
  durationSeconds: number;
  totalPages: number;
  pagesRead: number;
  secondsPerPage: number;
  pagesPerMinute: number;
  paceLabel: string;
  paceDescription: string;
  badgeColor: string;
  coinsEarned: number;
  xpEarned: number;
  completed: boolean;
  finishedAt: string;
}

const SESSIONS_STORAGE_KEY = 'az_reading_sessions_history_v1';

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatDigitalTimer(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats seconds into a human-readable string (e.g., '4m 18s')
 */
export function formatHumanDuration(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  if (safeSec < 60) {
    return `${safeSec} sec`;
  }
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (secs === 0) {
    return `${mins} min`;
  }
  return `${mins}m ${secs}s`;
}

/**
 * Evaluates the reader's reading pace and generates qualitative metrics
 */
export function calculatePaceCategory(durationSeconds: number, pagesRead: number) {
  const safePages = Math.max(1, pagesRead);
  const secondsPerPage = durationSeconds > 0 ? Number((durationSeconds / safePages).toFixed(1)) : 0;
  const pagesPerMinute = durationSeconds > 0 ? Number(((safePages / durationSeconds) * 60).toFixed(1)) : 0;

  if (secondsPerPage < 9) {
    return {
      pace: 'speed',
      paceLabel: 'Speed Reader',
      paceDescription: 'Swift, high-velocity chapter absorption',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      badgeIcon: '⚡',
      secondsPerPage,
      pagesPerMinute,
    };
  }

  if (secondsPerPage <= 22) {
    return {
      pace: 'steady',
      paceLabel: 'Steady Reader',
      paceDescription: 'Balanced, comfortable visual & dialogue pacing',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeIcon: '🌿',
      secondsPerPage,
      pagesPerMinute,
    };
  }

  if (secondsPerPage <= 45) {
    return {
      pace: 'deep',
      paceLabel: 'Deep Focus',
      paceDescription: 'Thoughtful panel, art, and narrative appreciation',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeIcon: '🔥',
      secondsPerPage,
      pagesPerMinute,
    };
  }

  return {
    pace: 'immersion',
    paceLabel: 'Deep Immersion',
    paceDescription: 'Meticulous panel examination and world-building savor',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    badgeIcon: '✨',
    secondsPerPage,
    pagesPerMinute,
  };
}

/**
 * Computes bonus Pulse Coins & XP for completing the chapter based on duration & pages
 */
export function calculateSessionRewards(durationSeconds: number, pagesRead: number) {
  const safePages = Math.max(1, pagesRead);
  // Award 1 coin per page + bonus for spending at least 2 minutes engaged
  const bonusTimeCoins = durationSeconds >= 120 ? 10 : durationSeconds >= 60 ? 5 : 2;
  const coins = Math.min(50, Math.max(10, Math.round(safePages * 1.2 + bonusTimeCoins)));
  const xp = Math.min(120, Math.max(25, Math.round(safePages * 3 + (durationSeconds >= 120 ? 30 : 15))));

  return { coins, xp };
}

/**
 * Saves a completed session summary to local history and credits coins
 */
export function saveReadingSessionToHistory(summary: ChapterReadingSessionSummary): void {
  try {
    const existing = safeStorage.getJSON<ChapterReadingSessionSummary[]>(SESSIONS_STORAGE_KEY, []);
    const updated = [summary, ...existing.filter((s) => s.chapterId !== summary.chapterId)].slice(0, 50);
    safeStorage.setJSON(SESSIONS_STORAGE_KEY, updated);

    // Credit bonus coins to user balance
    if (summary.coinsEarned > 0) {
      addUserCoins(summary.coinsEarned);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('az_reading_session_saved', { detail: { session: summary } })
      );
    }
  } catch (err) {
    console.error('Failed to save reading session:', err);
  }
}

// -------------------------------------------------------------
// COMPONENT 1: ReadingSessionTimerPill (Top Bar HUD Widget)
// -------------------------------------------------------------
export interface ReadingSessionTimerPillProps {
  elapsedSeconds: number;
  isRunning: boolean;
  onTogglePause: () => void;
  onOpenSummary: () => void;
  currentPage: number;
  totalPages: number;
}

export const ReadingSessionTimerPill: React.FC<ReadingSessionTimerPillProps> = ({
  elapsedSeconds,
  isRunning,
  onTogglePause,
  onOpenSummary,
  currentPage,
  totalPages,
}) => {
  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      <button
        type="button"
        onClick={onOpenSummary}
        className={`group min-h-[38px] flex items-center gap-2 px-3 py-1.5 rounded-xl border transition shadow-sm ${
          isRunning
            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300'
        }`}
        title={`Session Timer: ${formatDigitalTimer(elapsedSeconds)} · Tap for Chapter Summary`}
        aria-label={`Reading session timer: ${formatDigitalTimer(elapsedSeconds)}`}
      >
        <div className="relative flex items-center justify-center">
          <Timer
            className={`w-3.5 h-3.5 shrink-0 ${
              isRunning ? 'text-amber-400 animate-pulse' : 'text-slate-400'
            }`}
          />
          {isRunning && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping opacity-75" />
          )}
        </div>

        <span className="font-mono text-xs tabular-nums font-bold tracking-tight">
          {formatDigitalTimer(elapsedSeconds)}
        </span>

        {!isRunning && (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider">
            Paused
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePause();
        }}
        className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border transition ${
          isRunning
            ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-300 hover:text-white'
            : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-black font-bold'
        }`}
        title={isRunning ? 'Pause Reading Timer' : 'Resume Reading Timer'}
        aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
      >
        {isRunning ? (
          <Pause className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-black shrink-0" />
        )}
      </button>
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENT 2: ReadingSessionSummaryCard (End of Chapter Card)
// -------------------------------------------------------------
export interface ReadingSessionSummaryCardProps {
  summary: ChapterReadingSessionSummary;
  onViewModal: () => void;
  onReadNextChapter?: () => void;
  hasNextChapter: boolean;
}

export const ReadingSessionSummaryCard: React.FC<ReadingSessionSummaryCardProps> = ({
  summary,
  onViewModal,
  onReadNextChapter,
  hasNextChapter,
}) => {
  return (
    <div
      id="reader-session-summary-card"
      className="w-full rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900/90 p-5 sm:p-6 text-left shadow-2xl space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Chapter Reading Session
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate max-w-sm">
              Ch. {summary.chapterNumber}: {summary.chapterTitle}
            </h4>
          </div>
        </div>

        <span
          className={`self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 rounded-xl border ${summary.badgeColor}`}
        >
          {summary.paceLabel}
        </span>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Time Spent
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-lg font-black text-amber-300 tabular-nums">
              {formatHumanDuration(summary.durationSeconds)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            {formatDigitalTimer(summary.durationSeconds)} active
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Pages Read
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-lg font-black text-white tabular-nums">
              {summary.pagesRead}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {summary.totalPages}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
            100% Completed
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Reading Pace
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-lg font-black text-cyan-300 tabular-nums">
              {summary.secondsPerPage}s
            </span>
            <span className="text-[10px] text-slate-400">/page</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block truncate">
            {summary.pagesPerMinute} pages/min
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Session Earned
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-base font-black text-amber-300">
              +{summary.coinsEarned}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              +{summary.xpEarned} XP
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Streak reinforced</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <button
          type="button"
          onClick={onViewModal}
          className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-white px-4 py-2 text-xs font-bold transition shadow-sm"
        >
          <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>View Detailed Summary Card</span>
        </button>

        {hasNextChapter && onReadNextChapter && (
          <button
            type="button"
            onClick={onReadNextChapter}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-black transition active:scale-95 shadow-md"
          >
            <span>Continue Next Chapter</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENT 3: ReadingSessionSummaryModal (Celebration Modal)
// -------------------------------------------------------------
export interface ReadingSessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ChapterReadingSessionSummary;
  manga: Manga;
  chapter: Chapter;
  onReadNextChapter?: () => void;
  hasNextChapter: boolean;
  onRestartChapter?: () => void;
  onRateChapter?: (score: 1 | 2 | 3 | 4 | 5) => void;
  userChapterRating?: number;
  averageChapterRating?: number;
}

export const ReadingSessionSummaryModal: React.FC<ReadingSessionSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  manga,
  chapter,
  onReadNextChapter,
  hasNextChapter,
  onRestartChapter,
  onRateChapter,
  userChapterRating = 0,
  averageChapterRating = 0,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const chapterMetrics = useMemo(() => {
    return chapter?.id ? getChapterReadingMetrics(chapter.id) : null;
  }, [chapter?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleShareSummary = async () => {
    const shareText = [
      `📖 Finished reading Ch. ${summary.chapterNumber} of "${manga.title}"!`,
      `⏱ Time: ${formatHumanDuration(summary.durationSeconds)} (${summary.secondsPerPage}s/page)`,
      `⚡ Reader Pace: ${summary.paceLabel}`,
      `🇿🇦 Read on AZ OVERVERSE • Next-Gen African Manga`,
    ].join('\n');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2400);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reading Session Summary"
      className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* Dimmed Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-fadeIn cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-4 w-full max-w-lg rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#101420] via-slate-950 to-black p-6 sm:p-7 text-white shadow-2xl overflow-hidden z-10 animate-scaleUp"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          aria-label="Close summary dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Header Ribbon */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Chapter Completed</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white truncate max-w-xs sm:max-w-md mx-auto">
            {chapter.title || `Chapter ${chapter.number}`}
          </h3>
          <p className="text-xs text-slate-400 truncate">{manga.title}</p>
        </div>

        {/* Hero Timer Display */}
        <div className="my-4 p-5 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-500/40 text-center relative overflow-hidden shadow-inner">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Total Reading Time
          </span>

          <div className="flex items-center justify-center gap-3">
            <Clock className="w-7 h-7 text-amber-400 animate-pulse shrink-0" />
            <span className="font-['Bebas_Neue',sans-serif] text-5xl sm:text-6xl tracking-wider text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              {formatDigitalTimer(summary.durationSeconds)}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-300 mt-1">
            {formatHumanDuration(summary.durationSeconds)} of uninterrupted reading
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/70 border border-white/10 text-xs">
            <span className="text-amber-400 font-bold">{summary.paceLabel}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono">{summary.secondsPerPage}s per page</span>
          </div>

          {chapterMetrics && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Logged to Creator Studio</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-amber-300">
                {formatCumulativeDuration(chapterMetrics.totalReadingDurationSeconds)} total chapter reads
              </span>
            </div>
          )}
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 text-left">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pages Read
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-base font-black text-white">
                {summary.pagesRead}
              </span>
              <span className="text-xs font-mono text-slate-400">/ {summary.totalPages}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold block">100% finished</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Reading Speed
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-base font-black text-cyan-300">
                {summary.pagesPerMinute}
              </span>
              <span className="text-[10px] text-slate-400">pg/min</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              ~{summary.secondsPerPage}s / page
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Coins & XP Bonus
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono text-base font-black text-amber-300">
                +{summary.coinsEarned}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                +{summary.xpEarned} XP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">Streak updated</span>
          </div>
        </div>

        {/* Chapter Star Rating Widget */}
        {onRateChapter && (
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-200 block">
                Rate Chapter {chapter.number}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Your rating supports the creator
              </span>
            </div>

            <StarRatingInput
              idPrefix={`modal-summary-rate-${chapter.id}`}
              value={userChapterRating}
              averageRating={averageChapterRating}
              onRate={onRateChapter}
              size="md"
              showStatusLabel
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {hasNextChapter && onReadNextChapter ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onReadNextChapter();
              }}
              className="min-h-[48px] w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm px-5 py-3 transition active:scale-[0.98] shadow-lg"
            >
              <span>Continue to Next Chapter</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm px-5 py-3 transition active:scale-[0.98] shadow-lg"
            >
              <span>Done · Return to Reader</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareSummary}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold px-3 py-2.5 transition"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Summary Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share Stats</span>
                </>
              )}
            </button>

            {onRestartChapter && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRestartChapter();
                }}
                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-2.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Re-read Chapter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
