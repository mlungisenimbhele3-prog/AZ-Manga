import crypto from 'crypto';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, hasLiveDatabase, pool, withDbRetry } from './index.ts';
import { ensureCreatorTables, publishDueScheduledChapters } from './creator.ts';
import { getDevLayeredStore } from './layeredStore.ts';
import {
  awards,
  chapters,
  comments,
  creatorFollows,
  issues,
  mangas,
  pageViews,
  DbAward,
  DbComment,
  DbIssue,
} from './schema.ts';
import {
  getSeedReleaseDay,
  normalizeReleaseDay,
} from '../utils/releaseSchedule.ts';
import type { Chapter, Manga, ReleaseDay } from '../types.ts';

export const LAUNCH_ISSUE_ID = 'issue-01-launch';
export const LAUNCH_ISSUE_NUMBER = 1;
export const LAUNCH_ISSUE_EDITION_LABEL = 'ISSUE #01 • NOVEMBER 2026 • LAUNCH EDITION';
export const LAUNCH_ISSUE_HEADLINE = 'Weekly AZ Stories • Launch Week';

export const LAUNCH_AWARD_ID = 'moty-season-1';
export const LAUNCH_AWARD_TITLE = 'Manga of the Year Awards — Coming Soon';
export const LAUNCH_AWARD_SUBTITLE = 'Voting opens after our first season. Stay tuned.';

const CORE_LAUNCH_MANGAS = [
  {
    id: 'nkosi-the-tale-of-myths',
    creatorId: 'creator-mlungiseni-mbhele',
    creatorEmail: 'mlungisenimbhele3@gmail.com',
    title: 'Nkosi the tale of Myths',
    synopsis:
      'Born with the sacred lineage of mythical African deities and ancient kings, young Nkosi embarks on an epic odyssey through forgotten kingdoms to unravel celestial lore and protect the realm from mythological titans.',
    coverUrl: '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
    genres: JSON.stringify(['Afro-Fantasy', 'Action', 'Fantasy', 'Shonen', 'Adventure']),
    ageRating: '13+',
    language: 'English',
    type: 'original',
    releaseDay: 'WED',
    status: 'Coming Soon',
    approvalStatus: 'approved',
  },
  {
    id: 'last-shaman-of-zambezi',
    creatorId: 'creator-sipho-dlamini',
    creatorEmail: 'sipho@azoververse.com',
    title: 'The Last Shaman of Zambezi',
    synopsis:
      'Deep within the thundering mists and towering baobabs of the Zambezi, ancient guardian spirits and ancestral masks awaken. A young shaman apprentice wielding the sacred feather staff must master ancestral lightning before the river falls silent.',
    coverUrl: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
    genres: JSON.stringify(['Ancestral Horror', 'Afro-Fantasy', 'Fantasy', 'Adventure', 'Action', 'Supernatural']),
    ageRating: '13+',
    language: 'English',
    type: 'backdrop',
    releaseDay: 'FRI',
    status: 'Coming Soon',
    approvalStatus: 'approved',
  },
  {
    id: 'echoes-of-the-highveld',
    creatorId: 'creator-tendai-moyo',
    creatorEmail: 'tendai@azoververse.com',
    title: 'Echoes of the Highveld',
    synopsis:
      'A journey through the plateau. Beneath radiant sunbeams breaking over rolling golden grasslands and ancient mountains, a lone traveler follows whispered winds to uncover the timeless echoes and lost memories of the Highveld.',
    coverUrl: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
    genres: JSON.stringify(['Kasi-Punk', 'Sci-Fi', 'Adventure', 'Drama', 'Historical', 'Seinen']),
    ageRating: '13+',
    language: 'English',
    type: 'backdrop',
    releaseDay: 'SUN',
    status: 'Coming Soon',
    approvalStatus: 'approved',
  },
];

let catalogInitialized = false;
let catalogInitPromise: Promise<void> | null = null;

function parseChapterPagesFromRow(row: {
  id: string;
  panels: string;
  pagesJson?: string | null;
}): Array<{ id: string; pageNumber: number; imageUrl: string }> {
  const fromPagesJson = (() => {
    try {
      const parsed = JSON.parse(row.pagesJson || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((url, idx) => ({
            id: `${row.id}-p-${idx + 1}`,
            pageNumber: idx + 1,
            imageUrl: url.trim(),
          }));
      }
    } catch {
      // ignore
    }
    return null;
  })();

  if (fromPagesJson && fromPagesJson.length > 0) {
    return fromPagesJson;
  }

  try {
    const parsedPanels = JSON.parse(row.panels || '[]');
    if (Array.isArray(parsedPanels)) {
      return parsedPanels
        .filter((p: any) => p && typeof p.imageUrl === 'string' && p.imageUrl.trim().length > 0)
        .map((p: any, idx: number) => ({
          id: typeof p.id === 'string' ? p.id : `${row.id}-p-${idx + 1}`,
          pageNumber: Number(p.pageNumber) || idx + 1,
          imageUrl: String(p.imageUrl).trim(),
        }));
    }
  } catch {
    // ignore
  }
  return [];
}

function isRowPublishedChapter(row: {
  status?: string | null;
  publishStatus?: string | null;
}): boolean {
  const st = (row.status || '').trim().toLowerCase();
  const pst = (row.publishStatus || '').trim().toLowerCase();
  if (st === 'scheduled' || st === 'draft') return false;
  if (pst === 'scheduled' || pst.includes('coming soon')) return false;
  return st === 'published' || pst === 'live';
}

function serializeDbChapterToFrontend(row: any): Chapter {
  const pages = parseChapterPagesFromRow(row);
  return {
    id: row.id,
    mangaId: row.mangaId,
    number: Number(row.number) || 1,
    title: row.title,
    releaseDate: row.releaseDate,
    scheduledFor: row.scheduledFor ?? null,
    status: row.status === 'scheduled' ? 'scheduled' : row.status === 'draft' ? 'draft' : 'published',
    publishStatus: row.publishStatus,
    pageCount: Math.max(Number(row.pageCount) || 0, pages.length),
    accessType: 'free',
    pages,
    likesCount: Number(row.likes) || 0,
    commentsCount: Number(row.commentsCount) || 0,
  };
}

function resolveAuthorNameFromEmail(email: string, mangaId: string): string {
  if (mangaId === 'nkosi-the-tale-of-myths') return 'Mlungiseni Mbhele';
  if (mangaId === 'last-shaman-of-zambezi') return 'Sipho Dlamini';
  if (mangaId === 'echoes-of-the-highveld') return 'Tendai Moyo';
  const prefix = (email || 'creator').split('@')[0];
  return prefix || 'AZ Creator';
}

function serializeDbMangaToFrontend(row: any, publishedChapters: Chapter[]): Manga {
  const seriesType: 'original' | 'backdrop' =
    row.type === 'original' || row.id === 'nkosi-the-tale-of-myths'
      ? 'original'
      : 'backdrop';
  const releaseDay = normalizeReleaseDay(row.releaseDay, getSeedReleaseDay(row.id));
  const viewsCached = Number(row.totalViewsCached ?? row.views ?? 0) || 0;
  const parsedGenres = (() => {
    try {
      const g = JSON.parse(row.genres || '["Action"]');
      return Array.isArray(g) ? g : ['Action'];
    } catch {
      return ['Action'];
    }
  })();

  const sortedChapters = [...publishedChapters].sort((a, b) => b.number - a.number);
  const authorName = resolveAuthorNameFromEmail(row.creatorEmail, row.id);
  const coverUrl = row.coverUrl || '';
  const hasRealChapters = sortedChapters.some((c) => c.pages && c.pages.length > 0);
  const isComingSoon =
    !hasRealChapters ||
    String(row.status || '').toLowerCase().includes('coming');

  return {
    id: row.id,
    title: row.title,
    author: authorName,
    artist: authorName,
    cover: coverUrl,
    coverImage: coverUrl,
    coverUrl,
    bannerImage: coverUrl,
    genres: parsedGenres,
    status: 'ONGOING',
    synopsis: row.synopsis || '',
    rating: 0,
    ratingCount: 0,
    views: viewsCached,
    totalViewsCached: viewsCached,
    bookmarksCount: Number(row.likes) || 0,
    monetizationModel: 'hybrid',
    featured: seriesType === 'original',
    type: seriesType,
    releaseDay,
    isOriginal: seriesType === 'original',
    isBackdrop: seriesType === 'backdrop',
    isCanvas: seriesType === 'backdrop',
    isComingSoon,
    approvalStatus: (row.approvalStatus as any) || 'approved',
    submittedByEmail: row.creatorEmail,
    chapters: sortedChapters,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
  };
}

/**
 * Ensures public catalog tables exist and seeds only launch-state rows (Issue #01, Coming Soon Awards, 0 views/likes).
 */
export async function ensureCatalogTables(): Promise<void> {
  if (!hasLiveDatabase()) {
    catalogInitialized = true;
    return;
  }
  if (catalogInitialized) return;
  if (catalogInitPromise) return catalogInitPromise;

  catalogInitPromise = (async () => {
    try {
      await ensureCreatorTables();
      await withDbRetry(async () => {
        const existingCatalogRes = await pool.query<{ table_name: string }>(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('issues', 'awards', 'creator_follows')
        `);
        const catalogSet = new Set(existingCatalogRes.rows.map((r) => r.table_name));
        if (
          !catalogSet.has('issues') ||
          !catalogSet.has('awards') ||
          !catalogSet.has('creator_follows')
        ) {
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS issues (
                id TEXT PRIMARY KEY,
                issue_number INTEGER NOT NULL,
                edition_label TEXT NOT NULL,
                headline TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              CREATE TABLE IF NOT EXISTS awards (
                id TEXT PRIMARY KEY,
                year INTEGER NOT NULL DEFAULT 2026,
                title TEXT NOT NULL,
                subtitle TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'coming_soon',
                winner_manga_id TEXT,
                winner_citation TEXT,
                votes_count INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              CREATE TABLE IF NOT EXISTS creator_follows (
                id TEXT PRIMARY KEY,
                creator_id TEXT NOT NULL,
                creator_name TEXT NOT NULL,
                follower_key TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_follows_unique
                ON creator_follows (creator_id, follower_key);
              CREATE INDEX IF NOT EXISTS idx_creator_follows_creator_id
                ON creator_follows (creator_id);
            `);
          } catch (ddlErr: any) {
            if (ddlErr?.code !== '42501') throw ddlErr;
          }
        }

        for (const m of CORE_LAUNCH_MANGAS) {
          await pool.query(
            `
              INSERT INTO mangas (
                id, creator_id, creator_email, title, synopsis, cover_url,
                genres, age_rating, language, type, release_day, status, approval_status,
                views, total_views_cached, likes
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 0, 0)
              ON CONFLICT (id) DO UPDATE SET
                release_day = EXCLUDED.release_day
            `,
            [
              m.id,
              m.creatorId,
              m.creatorEmail,
              m.title,
              m.synopsis,
              m.coverUrl,
              m.genres,
              m.ageRating,
              m.language,
              m.type,
              m.releaseDay,
              m.status,
              m.approvalStatus,
            ]
          );
        }

        const existingIssues = await pool.query(`SELECT COUNT(*)::int AS cnt FROM issues`);
        if ((existingIssues.rows[0]?.cnt ?? 0) === 0) {
          await pool.query(
            `
              INSERT INTO issues (id, issue_number, edition_label, headline, is_active)
              VALUES ($1, $2, $3, $4, true)
              ON CONFLICT (id) DO NOTHING
            `,
            [
              LAUNCH_ISSUE_ID,
              LAUNCH_ISSUE_NUMBER,
              LAUNCH_ISSUE_EDITION_LABEL,
              LAUNCH_ISSUE_HEADLINE,
            ]
          );
        }

        const existingAwards = await pool.query(`SELECT COUNT(*)::int AS cnt FROM awards`);
        if ((existingAwards.rows[0]?.cnt ?? 0) === 0) {
          await pool.query(
            `
              INSERT INTO awards (id, year, title, subtitle, status, winner_manga_id, winner_citation, votes_count)
              VALUES ($1, 2026, $2, $3, 'coming_soon', NULL, NULL, 0)
              ON CONFLICT (id) DO NOTHING
            `,
            [LAUNCH_AWARD_ID, LAUNCH_AWARD_TITLE, LAUNCH_AWARD_SUBTITLE]
          );
        }
      });

      catalogInitialized = true;
    } catch (error) {
      catalogInitPromise = null;
      throw error;
    }
  })();

  return catalogInitPromise;
}

export async function getActiveIssue(): Promise<DbIssue> {
  if (!hasLiveDatabase()) {
    return getDevLayeredStore().issue;
  }
  await ensureCatalogTables();
  return withDbRetry(async () => {
    const rows = await db
      .select()
      .from(issues)
      .where(eq(issues.isActive, true))
      .orderBy(asc(issues.issueNumber))
      .limit(1);

    if (rows[0]) return rows[0];

    return {
      id: LAUNCH_ISSUE_ID,
      issueNumber: LAUNCH_ISSUE_NUMBER,
      editionLabel: LAUNCH_ISSUE_EDITION_LABEL,
      headline: LAUNCH_ISSUE_HEADLINE,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
}

export async function getActiveAwardsState(): Promise<DbAward> {
  if (!hasLiveDatabase()) {
    return getDevLayeredStore().award;
  }
  await ensureCatalogTables();
  return withDbRetry(async () => {
    const rows = await db.select().from(awards).limit(1);
    if (rows[0]) return rows[0];

    return {
      id: LAUNCH_AWARD_ID,
      year: 2026,
      title: LAUNCH_AWARD_TITLE,
      subtitle: LAUNCH_AWARD_SUBTITLE,
      status: 'coming_soon',
      winnerMangaId: null,
      winnerCitation: null,
      votesCount: 0,
      updatedAt: new Date(),
    };
  });
}

/**
 * Paginated GET /api/manga query. Returns series with published chapters ONLY
 * plus light upcomingSchedules metadata for "Coming this week".
 */
export async function listPaginatedMangas(options: {
  limit?: number;
  offset?: number;
  type?: 'original' | 'backdrop';
  releaseDay?: ReleaseDay;
}): Promise<{
  mangas: Manga[];
  upcomingSchedules: Array<{
    mangaId: string;
    title: string;
    releaseDay: ReleaseDay;
    scheduledFor: string | null;
    chapterNumber: number | null;
    type: 'original' | 'backdrop';
  }>;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}> {
  const limit = Math.max(1, Math.min(50, Math.floor(Number(options.limit) || 20)));
  const offset = Math.max(0, Math.floor(Number(options.offset) || 0));

  await publishDueScheduledChapters();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    let allMangas = Array.from(store.mangas.values());
    if (options.type) {
      allMangas = allMangas.filter((m) =>
        options.type === 'original' ? m.type === 'original' : m.type !== 'original'
      );
    }
    if (options.releaseDay) {
      allMangas = allMangas.filter(
        (m) => normalizeReleaseDay(m.releaseDay, getSeedReleaseDay(m.id)) === options.releaseDay
      );
    }

    allMangas.sort((a, b) => {
      if (a.type === 'original' && b.type !== 'original') return -1;
      if (a.type !== 'original' && b.type === 'original') return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const total = allMangas.length;
    const paged = allMangas.slice(offset, offset + limit);
    const allChapters = Array.from(store.chapters.values());

    const resultMangas = paged.map((m) => {
      const pubChapters = allChapters
        .filter((c) => c.mangaId === m.id && isRowPublishedChapter(c))
        .map(serializeDbChapterToFrontend);
      return serializeDbMangaToFrontend(m, pubChapters);
    });

    const scheduledMap = new Map<string, { scheduledFor: string | null; chapterNumber: number | null }>();
    for (const ch of allChapters) {
      if (ch.status === 'scheduled' || (ch.publishStatus || '').toLowerCase() === 'scheduled') {
        scheduledMap.set(ch.mangaId, {
          scheduledFor: ch.scheduledFor ?? null,
          chapterNumber: Number(ch.number) || 1,
        });
      }
    }

    const upcomingSchedules = Array.from(store.mangas.values()).map((m) => {
      const sched = scheduledMap.get(m.id);
      return {
        mangaId: m.id,
        title: m.title,
        releaseDay: normalizeReleaseDay(m.releaseDay, getSeedReleaseDay(m.id)),
        scheduledFor: sched?.scheduledFor ?? null,
        chapterNumber: sched?.chapterNumber ?? null,
        type: (m.type === 'original' ? 'original' : 'backdrop') as 'original' | 'backdrop',
      };
    });

    return {
      mangas: resultMangas,
      upcomingSchedules,
      limit,
      offset,
      total,
      hasMore: offset + paged.length < total,
    };
  }

  await ensureCatalogTables();
  return withDbRetry(async () => {
    const conditions: any[] = [];
    if (options.type) conditions.push(eq(mangas.type, options.type));
    if (options.releaseDay) conditions.push(eq(mangas.releaseDay, options.releaseDay));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRes, pagedRows, upcomingRows] = await Promise.all([
      whereClause
        ? db.select({ cnt: sql<number>`count(*)::int` }).from(mangas).where(whereClause)
        : db.select({ cnt: sql<number>`count(*)::int` }).from(mangas),
      whereClause
        ? db
            .select()
            .from(mangas)
            .where(whereClause)
            .orderBy(asc(mangas.createdAt))
            .limit(limit)
            .offset(offset)
        : db
            .select()
            .from(mangas)
            .orderBy(asc(mangas.createdAt))
            .limit(limit)
            .offset(offset),
      db
        .select({
          mangaId: chapters.mangaId,
          scheduledFor: chapters.scheduledFor,
          number: chapters.number,
        })
        .from(chapters)
        .where(eq(chapters.status, 'scheduled'))
        .limit(50),
    ]);

    const total = Number(countRes[0]?.cnt) || 0;
    const mangaIds = pagedRows.map((m) => m.id);
    const chRows =
      mangaIds.length > 0
        ? await db
            .select()
            .from(chapters)
            .where(inArray(chapters.mangaId, mangaIds))
            .orderBy(desc(chapters.number))
        : [];

    const chaptersByManga = new Map<string, Chapter[]>();
    for (const ch of chRows) {
      if (!isRowPublishedChapter(ch)) continue;
      const list = chaptersByManga.get(ch.mangaId) || [];
      list.push(serializeDbChapterToFrontend(ch));
      chaptersByManga.set(ch.mangaId, list);
    }

    const schedMap = new Map<string, { scheduledFor: string | null; chapterNumber: number }>();
    for (const u of upcomingRows) {
      if (!schedMap.has(u.mangaId)) {
        schedMap.set(u.mangaId, {
          scheduledFor: u.scheduledFor ?? null,
          chapterNumber: Number(u.number) || 1,
        });
      }
    }

    const upcomingSchedules = pagedRows.map((m) => {
      const sched = schedMap.get(m.id);
      return {
        mangaId: m.id,
        title: m.title,
        releaseDay: normalizeReleaseDay(m.releaseDay, getSeedReleaseDay(m.id)),
        scheduledFor: sched?.scheduledFor ?? null,
        chapterNumber: sched?.chapterNumber ?? null,
        type: (m.type === 'original' ? 'original' : 'backdrop') as 'original' | 'backdrop',
      };
    });

    return {
      mangas: pagedRows.map((m) =>
        serializeDbMangaToFrontend(m, chaptersByManga.get(m.id) || [])
      ),
      upcomingSchedules,
      limit,
      offset,
      total,
      hasMore: offset + pagedRows.length < total,
    };
  });
}

/**
 * Paginated GET /api/chapters query. Strictly returns published chapters only.
 */
export async function listPaginatedPublishedChapters(options: {
  mangaId?: string;
  chapterId?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  chapters: Chapter[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}> {
  const limit = Math.max(1, Math.min(50, Math.floor(Number(options.limit) || 20)));
  const offset = Math.max(0, Math.floor(Number(options.offset) || 0));

  await publishDueScheduledChapters();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    let list = Array.from(store.chapters.values()).filter((c) => isRowPublishedChapter(c));
    if (options.mangaId) {
      list = list.filter((c) => c.mangaId === options.mangaId);
    }
    if (options.chapterId) {
      list = list.filter((c) => c.id === options.chapterId);
    }
    list.sort((a, b) => b.number - a.number);
    const total = list.length;
    const paged = list.slice(offset, offset + limit);
    return {
      chapters: paged.map(serializeDbChapterToFrontend),
      limit,
      offset,
      total,
      hasMore: offset + paged.length < total,
    };
  }

  await ensureCatalogTables();
  return withDbRetry(async () => {
    const conditions: any[] = [eq(chapters.status, 'published')];
    if (options.mangaId) conditions.push(eq(chapters.mangaId, options.mangaId));
    if (options.chapterId) conditions.push(eq(chapters.id, options.chapterId));
    const whereClause = and(...conditions);

    const [countRes, rows] = await Promise.all([
      db.select({ cnt: sql<number>`count(*)::int` }).from(chapters).where(whereClause),
      db
        .select()
        .from(chapters)
        .where(whereClause)
        .orderBy(desc(chapters.number))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(countRes[0]?.cnt) || 0;
    return {
      chapters: rows.filter(isRowPublishedChapter).map(serializeDbChapterToFrontend),
      limit,
      offset,
      total,
      hasMore: offset + rows.length < total,
    };
  });
}

/**
 * Paginated GET /api/comments query.
 */
export async function listPaginatedComments(options: {
  chapterId: string;
  limit?: number;
  offset?: number;
}): Promise<{
  comments: Array<{
    id: string;
    chapterId: string;
    mangaId: string;
    userId: string;
    userName: string;
    text: string;
    pageNumber?: number;
    isSpoiler: boolean;
    parentId: string | null;
    rootId: string | null;
    depth: number;
    replyToUserName?: string;
    userBadge?: string;
    status: 'published' | 'deleted';
    timestamp: string;
  }>;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}> {
  const limit = Math.max(1, Math.min(50, Math.floor(Number(options.limit) || 20)));
  const offset = Math.max(0, Math.floor(Number(options.offset) || 0));

  const serialize = (c: DbComment) => ({
    id: c.id,
    chapterId: c.chapterId,
    mangaId: c.mangaId,
    userId: c.userId,
    userName: c.userName,
    text: c.text,
    ...(typeof c.pageNumber === 'number' ? { pageNumber: c.pageNumber } : {}),
    isSpoiler: Boolean(c.isSpoiler),
    parentId: c.parentId ?? null,
    rootId: c.rootId ?? null,
    depth: Number(c.depth) || 0,
    ...(c.replyToUserName ? { replyToUserName: c.replyToUserName } : {}),
    ...(c.userBadge ? { userBadge: c.userBadge } : {}),
    status: (c.status === 'deleted' ? 'deleted' : 'published') as 'published' | 'deleted',
    timestamp:
      c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : new Date().toISOString(),
  });

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const filtered = Array.from(store.comments.values())
      .filter((c) => c.chapterId === options.chapterId && c.status !== 'deleted')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);
    return {
      comments: paged.map(serialize),
      limit,
      offset,
      total,
      hasMore: offset + paged.length < total,
    };
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const whereClause = and(
      eq(comments.chapterId, options.chapterId),
      eq(comments.status, 'published')
    );

    const [countRes, rows] = await Promise.all([
      db.select({ cnt: sql<number>`count(*)::int` }).from(comments).where(whereClause),
      db
        .select()
        .from(comments)
        .where(whereClause)
        .orderBy(asc(comments.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(countRes[0]?.cnt) || 0;
    return {
      comments: rows.map(serialize),
      limit,
      offset,
      total,
      hasMore: offset + rows.length < total,
    };
  });
}

export async function createCommentRecord(input: {
  chapterId: string;
  mangaId: string;
  userId: string;
  userName: string;
  text: string;
  pageNumber?: number;
  isSpoiler?: boolean;
  parentId?: string | null;
  rootId?: string | null;
  depth?: number;
  replyToUserName?: string;
  userBadge?: string;
}): Promise<{
  id: string;
  chapterId: string;
  mangaId: string;
  userId: string;
  userName: string;
  text: string;
  pageNumber?: number;
  isSpoiler: boolean;
  parentId: string | null;
  rootId: string | null;
  depth: number;
  replyToUserName?: string;
  userBadge?: string;
  status: 'published';
  timestamp: string;
}> {
  const now = new Date();
  const id = `comm-${crypto.randomUUID().slice(0, 12)}`;
  const row: DbComment = {
    id,
    chapterId: input.chapterId,
    mangaId: input.mangaId,
    userId: input.userId,
    userName: input.userName.trim().slice(0, 60),
    text: input.text.trim().slice(0, 500),
    pageNumber: typeof input.pageNumber === 'number' ? input.pageNumber : null,
    isSpoiler: Boolean(input.isSpoiler),
    parentId: input.parentId ?? null,
    rootId: input.rootId ?? null,
    depth: Number(input.depth) || 0,
    replyToUserName: input.replyToUserName ?? null,
    userBadge: input.userBadge ?? null,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  };

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    store.comments.set(row.id, row);
    const ch = store.chapters.get(input.chapterId);
    if (ch) {
      store.chapters.set(ch.id, {
        ...ch,
        commentsCount: (ch.commentsCount || 0) + 1,
      });
    }
  } else {
    await ensureCreatorTables();
    await withDbRetry(async () => {
      await db.insert(comments).values(row);
      await db
        .update(chapters)
        .set({ commentsCount: sql`${chapters.commentsCount} + 1` })
        .where(eq(chapters.id, input.chapterId));
    });
  }

  return {
    id: row.id,
    chapterId: row.chapterId,
    mangaId: row.mangaId,
    userId: row.userId,
    userName: row.userName,
    text: row.text,
    ...(typeof row.pageNumber === 'number' ? { pageNumber: row.pageNumber } : {}),
    isSpoiler: row.isSpoiler,
    parentId: row.parentId,
    rootId: row.rootId,
    depth: row.depth,
    ...(row.replyToUserName ? { replyToUserName: row.replyToUserName } : {}),
    ...(row.userBadge ? { userBadge: row.userBadge } : {}),
    status: 'published',
    timestamp: now.toISOString(),
  };
}

/**
 * Inserts a raw view event row into `page_views` ONLY.
 * NEVER updates `mangas` on every view — a 5-minute batch job aggregates into `total_views_cached`.
 */
export async function insertPageViewRow(input: {
  mangaId: string;
  chapterId: string;
}): Promise<{ queued: boolean; id?: string; reason?: string }> {
  if (!input.mangaId || !input.chapterId || input.chapterId.includes('__preview')) {
    return { queued: false, reason: 'Preview or invalid chapter' };
  }

  const now = new Date();
  const id = `pv-${crypto.randomUUID().slice(0, 12)}`;

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const ch = store.chapters.get(input.chapterId);
    if (!ch || ch.mangaId !== input.mangaId || !isRowPublishedChapter(ch)) {
      return { queued: false, reason: 'Chapter is not published' };
    }
    store.pageViews.push({
      id,
      chapterId: input.chapterId,
      mangaId: input.mangaId,
      processed: false,
      createdAt: now,
    });
    return { queued: true, id };
  }

  await ensureCatalogTables();
  return withDbRetry(async () => {
    const [ch] = await db
      .select({
        id: chapters.id,
        mangaId: chapters.mangaId,
        status: chapters.status,
        publishStatus: chapters.publishStatus,
      })
      .from(chapters)
      .where(eq(chapters.id, input.chapterId))
      .limit(1);

    if (!ch || ch.mangaId !== input.mangaId || !isRowPublishedChapter(ch)) {
      return { queued: false, reason: 'Chapter is not published' };
    }

    await db.insert(pageViews).values({
      id,
      chapterId: input.chapterId,
      mangaId: input.mangaId,
      processed: false,
      createdAt: now,
    });

    return { queued: true, id };
  });
}

/**
 * 5-minute background aggregator:
 * Sums unprocessed rows in `page_views`, marks them processed, and updates
 * `mangas.total_views_cached`, `mangas.views`, and `chapters.reads`.
 */
export async function aggregatePageViewsBatch(): Promise<{
  processedRows: number;
  updatedMangas: number;
}> {
  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const pending = store.pageViews.filter((pv) => !pv.processed);
    if (pending.length === 0) return { processedRows: 0, updatedMangas: 0 };

    const mangaDeltas = new Map<string, number>();
    const chapterDeltas = new Map<string, number>();

    for (const pv of pending) {
      pv.processed = true;
      mangaDeltas.set(pv.mangaId, (mangaDeltas.get(pv.mangaId) || 0) + 1);
      chapterDeltas.set(pv.chapterId, (chapterDeltas.get(pv.chapterId) || 0) + 1);
    }

    const now = new Date();
    for (const [mId, delta] of mangaDeltas.entries()) {
      const m = store.mangas.get(mId);
      if (m) {
        const nextTotal = (m.totalViewsCached || m.views || 0) + delta;
        store.mangas.set(mId, {
          ...m,
          totalViewsCached: nextTotal,
          views: nextTotal,
          updatedAt: now,
        });
      }
    }

    for (const [chId, delta] of chapterDeltas.entries()) {
      const ch = store.chapters.get(chId);
      if (ch) {
        store.chapters.set(chId, {
          ...ch,
          reads: (ch.reads || 0) + delta,
          updatedAt: now,
        });
      }
    }

    return {
      processedRows: pending.length,
      updatedMangas: mangaDeltas.size,
    };
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const pendingRes = await pool.query<{
      id: string;
      manga_id: string;
      chapter_id: string;
    }>(`SELECT id, manga_id, chapter_id FROM page_views WHERE processed = false LIMIT 5000`);

    if (pendingRes.rows.length === 0) {
      return { processedRows: 0, updatedMangas: 0 };
    }

    const ids: string[] = [];
    const mangaDeltas = new Map<string, number>();
    const chapterDeltas = new Map<string, number>();

    for (const row of pendingRes.rows) {
      ids.push(row.id);
      mangaDeltas.set(row.manga_id, (mangaDeltas.get(row.manga_id) || 0) + 1);
      chapterDeltas.set(row.chapter_id, (chapterDeltas.get(row.chapter_id) || 0) + 1);
    }

    await pool.query(
      `UPDATE page_views SET processed = true WHERE id = ANY($1::text[])`,
      [ids]
    );

    for (const [mId, delta] of mangaDeltas.entries()) {
      await pool.query(
        `
          UPDATE mangas
          SET total_views_cached = COALESCE(total_views_cached, views, 0) + $1,
              views = COALESCE(total_views_cached, views, 0) + $1,
              updated_at = NOW()
          WHERE id = $2
        `,
        [delta, mId]
      );
    }

    for (const [chId, delta] of chapterDeltas.entries()) {
      await pool.query(
        `
          UPDATE chapters
          SET reads = COALESCE(reads, 0) + $1,
              updated_at = NOW()
          WHERE id = $2
        `,
        [delta, chId]
      );
    }

    return {
      processedRows: ids.length,
      updatedMangas: mangaDeltas.size,
    };
  });
}

export async function getPublicCatalogMetrics(): Promise<{
  mangas: Array<{
    id: string;
    type: 'original' | 'backdrop';
    releaseDay: ReleaseDay;
    views: number;
    totalViewsCached: number;
    likes: number;
    status: string;
    approvalStatus: string;
  }>;
  chapters: Array<{
    id: string;
    mangaId: string;
    reads: number;
    likes: number;
    pageCount: number;
    publishStatus: string;
    status: string;
  }>;
  activeIssue: DbIssue;
  awards: DbAward;
  followerCounts: Record<string, number>;
}> {
  await publishDueScheduledChapters();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const followerCounts: Record<string, number> = {};
    for (const [cid, set] of store.creatorFollows.entries()) {
      followerCounts[cid] = set.size;
    }
    return {
      mangas: Array.from(store.mangas.values()).map((m) => ({
        id: m.id,
        type: m.type === 'original' ? 'original' : 'backdrop',
        releaseDay: normalizeReleaseDay(m.releaseDay, getSeedReleaseDay(m.id)),
        views: Number(m.totalViewsCached ?? m.views) || 0,
        totalViewsCached: Number(m.totalViewsCached ?? m.views) || 0,
        likes: Number(m.likes) || 0,
        status: m.status,
        approvalStatus: m.approvalStatus,
      })),
      chapters: Array.from(store.chapters.values())
        .filter(isRowPublishedChapter)
        .map((c) => ({
          id: c.id,
          mangaId: c.mangaId,
          reads: Number(c.reads) || 0,
          likes: Number(c.likes) || 0,
          pageCount: Number(c.pageCount) || 0,
          publishStatus: c.publishStatus,
          status: c.status,
        })),
      activeIssue: store.issue,
      awards: store.award,
      followerCounts,
    };
  }

  await ensureCatalogTables();
  return withDbRetry(async () => {
    const [dbMangas, dbChapters, activeIssue, awardState, followRows] =
      await Promise.all([
        db
          .select({
            id: mangas.id,
            type: mangas.type,
            releaseDay: mangas.releaseDay,
            views: mangas.views,
            totalViewsCached: mangas.totalViewsCached,
            likes: mangas.likes,
            status: mangas.status,
            approvalStatus: mangas.approvalStatus,
          })
          .from(mangas),
        db
          .select({
            id: chapters.id,
            mangaId: chapters.mangaId,
            reads: chapters.reads,
            likes: chapters.likes,
            pageCount: chapters.pageCount,
            publishStatus: chapters.publishStatus,
            status: chapters.status,
          })
          .from(chapters)
          .where(eq(chapters.status, 'published')),
        getActiveIssue(),
        getActiveAwardsState(),
        db
          .select({
            creatorId: creatorFollows.creatorId,
            cnt: sql<number>`count(*)::int`,
          })
          .from(creatorFollows)
          .groupBy(creatorFollows.creatorId),
      ]);

    const followerCounts: Record<string, number> = {};
    for (const row of followRows) {
      followerCounts[row.creatorId] = Number(row.cnt) || 0;
    }

    return {
      mangas: dbMangas.map((m) => ({
        ...m,
        type: m.type === 'original' ? 'original' : 'backdrop',
        releaseDay: normalizeReleaseDay(m.releaseDay, getSeedReleaseDay(m.id)),
        views: Number(m.totalViewsCached ?? m.views) || 0,
        totalViewsCached: Number(m.totalViewsCached ?? m.views) || 0,
      })),
      chapters: dbChapters,
      activeIssue,
      awards: awardState,
      followerCounts,
    };
  });
}

export async function recordLiveChapterView(
  mangaId: string,
  chapterId: string
): Promise<{ counted: boolean; views?: number; reads?: number; reason?: string }> {
  const res = await insertPageViewRow({ mangaId, chapterId });
  return {
    counted: res.queued,
    reason: res.reason,
  };
}

export async function toggleCreatorFollowInDb(input: {
  creatorId: string;
  creatorName: string;
  followerKey: string;
  action: 'follow' | 'unfollow';
}): Promise<{ followersCount: number }> {
  const cleanCreatorId = input.creatorId.trim().slice(0, 120);
  const cleanFollowerKey = input.followerKey.trim().toLowerCase().slice(0, 140);

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const existing = store.creatorFollows.get(cleanCreatorId) || new Set<string>();
    if (input.action === 'follow') {
      existing.add(cleanFollowerKey);
    } else {
      existing.delete(cleanFollowerKey);
    }
    store.creatorFollows.set(cleanCreatorId, existing);
    return { followersCount: existing.size };
  }

  await ensureCatalogTables();
  return withDbRetry(async () => {
    if (input.action === 'follow') {
      await pool.query(
        `
          INSERT INTO creator_follows (id, creator_id, creator_name, follower_key)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (creator_id, follower_key) DO NOTHING
        `,
        [
          `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          cleanCreatorId,
          input.creatorName.trim().slice(0, 120),
          cleanFollowerKey,
        ]
      );
    } else {
      await pool.query(
        `DELETE FROM creator_follows WHERE creator_id = $1 AND follower_key = $2`,
        [cleanCreatorId, cleanFollowerKey]
      );
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM creator_follows WHERE creator_id = $1`,
      [cleanCreatorId]
    );

    return {
      followersCount: Number(countRes.rows[0]?.cnt) || 0,
    };
  });
}
