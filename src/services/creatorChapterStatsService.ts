import { safeStorage } from '../utils/safeStorage';

export interface ChapterReadingMetrics {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  mangaId: string;
  mangaTitle: string;
  mangaCover: string;
  totalReadingDurationSeconds: number;
  totalSessionsCount: number;
  completedSessionsCount: number;
  uniqueReadersCount: number;
  lastReadAt: string;
  averageSecondsPerSession: number;
  completionRatePercent: number;
}

export interface CreatorOverallReadingStats {
  totalReadingDurationSeconds: number;
  totalReadingHours: number;
  totalSessionsCount: number;
  totalCompletedCount: number;
  overallCompletionRatePercent: number;
  averageSessionDurationSeconds: number;
  topChaptersByDuration: ChapterReadingMetrics[];
}

const STORAGE_KEY = 'az_creator_chapter_stats_v1';
const EVENT_NAME = 'az_creator_chapter_stats_updated';

/**
 * Baseline sample data to ensure the Creator Dashboard displays rich, realistic metrics
 * on first launch before live reads occur.
 */
const DEFAULT_INITIAL_METRICS: Record<string, ChapterReadingMetrics> = {
  'nkosi-the-tale-of-myths-ch-1': {
    chapterId: 'nkosi-the-tale-of-myths-ch-1',
    chapterNumber: 1,
    chapterTitle: 'Chapter 1: Awaken the Sun Staff',
    mangaId: 'nkosi-the-tale-of-myths',
    mangaTitle: 'Nkosi the tale of Myths',
    mangaCover: '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
    totalReadingDurationSeconds: 14820, // ~4.1 hours
    totalSessionsCount: 42,
    completedSessionsCount: 36,
    uniqueReadersCount: 38,
    lastReadAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    averageSecondsPerSession: 352,
    completionRatePercent: 85.7,
  },
  'nkosi-the-tale-of-myths-ch-2': {
    chapterId: 'nkosi-the-tale-of-myths-ch-2',
    chapterNumber: 2,
    chapterTitle: 'Chapter 2: The Whispering Highveld',
    mangaId: 'nkosi-the-tale-of-myths',
    mangaTitle: 'Nkosi the tale of Myths',
    mangaCover: '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
    totalReadingDurationSeconds: 9640, // ~2.6 hours
    totalSessionsCount: 28,
    completedSessionsCount: 23,
    uniqueReadersCount: 26,
    lastReadAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    averageSecondsPerSession: 344,
    completionRatePercent: 82.1,
  },
  'last-shaman-of-zambezi-ch-1': {
    chapterId: 'last-shaman-of-zambezi-ch-1',
    chapterNumber: 1,
    chapterTitle: 'Chapter 1: The Baobab Mask',
    mangaId: 'last-shaman-of-zambezi',
    mangaTitle: 'The Last Shaman of Zambezi',
    mangaCover: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
    totalReadingDurationSeconds: 11200, // ~3.1 hours
    totalSessionsCount: 34,
    completedSessionsCount: 29,
    uniqueReadersCount: 31,
    lastReadAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    averageSecondsPerSession: 329,
    completionRatePercent: 85.3,
  },
};

/**
 * Retrieves the raw map of all chapter reading stats from local storage.
 */
export function getRawChapterStatsMap(): Record<string, ChapterReadingMetrics> {
  const stored = safeStorage.getJSON<Record<string, ChapterReadingMetrics> | null>(STORAGE_KEY, null);
  if (!stored || Object.keys(stored).length === 0) {
    safeStorage.setJSON(STORAGE_KEY, DEFAULT_INITIAL_METRICS);
    return { ...DEFAULT_INITIAL_METRICS };
  }
  return stored;
}

/**
 * Returns formatted time string: "2h 45m" or "4m 12s" or "35s"
 */
export function formatCumulativeDuration(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

/**
 * Formats time in digital format 00:00:00 or 00:00
 */
export function formatDigitalCumulative(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface LogChapterReadingPayload {
  chapterId: string;
  chapterNumber: number;
  chapterTitle?: string;
  mangaId: string;
  mangaTitle?: string;
  mangaCover?: string;
  deltaSeconds: number;
  isNewSession?: boolean;
  isCompleted?: boolean;
}

/**
 * Real-time logger: Accumulates reading duration for a specific chapter and updates
 * Creator Dashboard statistics immediately.
 */
export function logChapterReadingTime(payload: LogChapterReadingPayload): ChapterReadingMetrics {
  const map = getRawChapterStatsMap();
  const cid = payload.chapterId || `${payload.mangaId}-ch-${payload.chapterNumber || 1}`;

  const existing = map[cid] || {
    chapterId: cid,
    chapterNumber: payload.chapterNumber || 1,
    chapterTitle: payload.chapterTitle || `Chapter ${payload.chapterNumber || 1}`,
    mangaId: payload.mangaId,
    mangaTitle: payload.mangaTitle || 'Untitled Series',
    mangaCover: payload.mangaCover || '',
    totalReadingDurationSeconds: 0,
    totalSessionsCount: 0,
    completedSessionsCount: 0,
    uniqueReadersCount: 1,
    lastReadAt: new Date().toISOString(),
    averageSecondsPerSession: 0,
    completionRatePercent: 0,
  };

  const addedDuration = Math.max(0, payload.deltaSeconds || 0);
  const newDuration = existing.totalReadingDurationSeconds + addedDuration;
  const newSessions = existing.totalSessionsCount + (payload.isNewSession ? 1 : 0);
  const safeSessions = Math.max(1, newSessions);
  const newCompleted = existing.completedSessionsCount + (payload.isCompleted ? 1 : 0);
  const completionRate = Number(((newCompleted / safeSessions) * 100).toFixed(1));
  const avgSeconds = Math.round(newDuration / safeSessions);

  const updated: ChapterReadingMetrics = {
    ...existing,
    chapterTitle: payload.chapterTitle || existing.chapterTitle,
    mangaTitle: payload.mangaTitle || existing.mangaTitle,
    mangaCover: payload.mangaCover || existing.mangaCover,
    totalReadingDurationSeconds: newDuration,
    totalSessionsCount: safeSessions,
    completedSessionsCount: Math.min(safeSessions, newCompleted),
    averageSecondsPerSession: avgSeconds,
    completionRatePercent: Math.min(100, completionRate),
    lastReadAt: new Date().toISOString(),
  };

  map[cid] = updated;
  safeStorage.setJSON(STORAGE_KEY, map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          chapterId: cid,
          updatedMetrics: updated,
          deltaSeconds: addedDuration,
        },
      })
    );
  }

  return updated;
}

/**
 * Returns metrics for a single chapter.
 */
export function getChapterReadingMetrics(chapterId: string): ChapterReadingMetrics | null {
  const map = getRawChapterStatsMap();
  return map[chapterId] || null;
}

/**
 * Returns all chapter reading metrics sorted by highest cumulative reading duration.
 */
export function getAllChapterReadingMetrics(mangaIdFilter?: string): ChapterReadingMetrics[] {
  const map = getRawChapterStatsMap();
  let list = Object.values(map);
  if (mangaIdFilter) {
    list = list.filter((m) => m.mangaId === mangaIdFilter);
  }
  return list.sort((a, b) => b.totalReadingDurationSeconds - a.totalReadingDurationSeconds);
}

/**
 * Computes creator-wide summary metrics across all published chapters.
 */
export function getCreatorOverallReadingStats(mangaIdFilter?: string): CreatorOverallReadingStats {
  const chapters = getAllChapterReadingMetrics(mangaIdFilter);
  const totalDuration = chapters.reduce((sum, c) => sum + c.totalReadingDurationSeconds, 0);
  const totalSessions = chapters.reduce((sum, c) => sum + c.totalSessionsCount, 0);
  const totalCompleted = chapters.reduce((sum, c) => sum + c.completedSessionsCount, 0);
  const safeSessions = Math.max(1, totalSessions);

  return {
    totalReadingDurationSeconds: totalDuration,
    totalReadingHours: Number((totalDuration / 3600).toFixed(1)),
    totalSessionsCount: totalSessions,
    totalCompletedCount: totalCompleted,
    overallCompletionRatePercent:
      totalSessions > 0 ? Number(((totalCompleted / safeSessions) * 100).toFixed(1)) : 0,
    averageSessionDurationSeconds: Math.round(totalDuration / safeSessions),
    topChaptersByDuration: chapters.slice(0, 5),
  };
}

/**
 * Subscription helper for React components to re-render when real-time stats update.
 */
export function subscribeToCreatorChapterStats(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
