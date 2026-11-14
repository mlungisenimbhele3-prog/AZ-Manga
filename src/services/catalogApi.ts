import type { Manga } from '../types';

export interface CatalogIssue {
  id: string;
  issueNumber: number;
  editionLabel: string;
  headline: string;
  isActive: boolean;
}

export interface CatalogAwardsState {
  id: string;
  year: number;
  title: string;
  subtitle: string;
  status: string;
  winnerMangaId: string | null;
  winnerCitation: string | null;
  votesCount: number;
}

export interface CatalogSnapshot {
  dbConnected: boolean;
  mangas: Array<{ id: string; views: number; likes: number; status: string; approvalStatus: string }>;
  chapters: Array<{ id: string; mangaId: string; reads: number; likes: number; publishStatus: string }>;
  activeIssue: CatalogIssue;
  awards: CatalogAwardsState;
  followerCounts: Record<string, number>;
}

export const DEFAULT_LAUNCH_ISSUE: CatalogIssue = {
  id: 'issue-01-launch',
  issueNumber: 1,
  editionLabel: 'ISSUE #01 • NOVEMBER 2026 • LAUNCH EDITION',
  headline: 'Weekly AZ Stories • Launch Week',
  isActive: true,
};

export const DEFAULT_AWARDS_STATE: CatalogAwardsState = {
  id: 'moty-season-1',
  year: 2026,
  title: 'Manga of the Year Awards — Coming Soon',
  subtitle: 'Voting opens after our first season. Stay tuned.',
  status: 'coming_soon',
  winnerMangaId: null,
  winnerCitation: null,
  votesCount: 0,
};

export function formatViews(views?: number | null): string {
  const safe = Number(views || 0);
  if (!Number.isFinite(safe) || safe <= 0) return '0';
  if (safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(1)}M`;
  }
  if (safe >= 1_000) {
    return `${(safe / 1_000).toFixed(1)}K`;
  }
  return String(Math.floor(safe));
}

export async function fetchCatalogSnapshot(): Promise<CatalogSnapshot | null> {
  try {
    const res = await fetch('/api/catalog', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      dbConnected: Boolean(data.dbConnected),
      mangas: Array.isArray(data.mangas) ? data.mangas : [],
      chapters: Array.isArray(data.chapters) ? data.chapters : [],
      activeIssue: data.activeIssue || DEFAULT_LAUNCH_ISSUE,
      awards: data.awards || DEFAULT_AWARDS_STATE,
      followerCounts:
        data.followerCounts && typeof data.followerCounts === 'object' ? data.followerCounts : {},
    };
  } catch {
    return null;
  }
}

export function applyCatalogMetricsToMangas(
  list: Manga[],
  snapshot: CatalogSnapshot
): Manga[] {
  const mangaMetricsById = new Map(snapshot.mangas.map((m) => [m.id, m]));
  const chapterMetricsById = new Map(snapshot.chapters.map((c) => [c.id, c]));

  return list.map((manga) => {
    const dbM = mangaMetricsById.get(manga.id);
    const updatedChapters = (manga.chapters || []).map((ch) => {
      const dbCh = chapterMetricsById.get(ch.id);
      if (!dbCh) return ch;
      return {
        ...ch,
        likesCount: Number(dbCh.likes ?? ch.likesCount ?? 0),
      };
    });

    if (!dbM) {
      return {
        ...manga,
        views: Number(manga.views || 0),
        chapters: updatedChapters,
      };
    }

    return {
      ...manga,
      views: Number(dbM.views || 0),
      chapters: updatedChapters,
    };
  });
}

export async function recordRealChapterView(
  mangaId: string,
  chapterId: string
): Promise<{ counted: boolean; views?: number; reads?: number }> {
  try {
    const res = await fetch('/api/catalog/chapter-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mangaId, chapterId }),
    });
    if (!res.ok) return { counted: false };
    return await res.json();
  } catch {
    return { counted: false };
  }
}

export async function toggleCreatorFollowApi(input: {
  creatorId: string;
  creatorName: string;
  followerKey: string;
  action: 'follow' | 'unfollow';
}): Promise<{ success: boolean; followersCount: number }> {
  try {
    const res = await fetch('/api/catalog/creator-follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { success: false, followersCount: 0 };
    return await res.json();
  } catch {
    return { success: false, followersCount: 0 };
  }
}
