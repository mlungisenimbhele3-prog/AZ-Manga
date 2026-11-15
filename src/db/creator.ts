import { desc, eq } from 'drizzle-orm';
import { db, hasLiveDatabase, pool, withDbRetry } from './index.ts';
import { getDevLayeredStore } from './layeredStore.ts';
import {
  mangas,
  chapters,
  payouts,
  DbManga,
  DbChapter,
  DbPayout,
} from './schema.ts';
import {
  getCurrentSastDateString,
  getNextReleaseDateForDay,
  getReleaseWeekWindow,
  getSeedReleaseDay,
  normalizeReleaseDay,
} from '../utils/releaseSchedule.ts';
import type { ReleaseDay } from '../types.ts';

let tablesInitialized = false;
let tableInitPromise: Promise<void> | null = null;

export class WeeklyChapterLimitError extends Error {
  statusCode = 409;
  nextReleaseDayLabel: string;
  nextReleaseDateIso: string;

  constructor(message: string, nextReleaseDayLabel: string, nextReleaseDateIso: string) {
    super(message);
    this.name = 'WeeklyChapterLimitError';
    this.nextReleaseDayLabel = nextReleaseDayLabel;
    this.nextReleaseDateIso = nextReleaseDateIso;
  }
}

export class Base64ImageRejectedError extends Error {
  statusCode = 400;

  constructor(message = 'Database stores CDN URLs only. Upload images to CDN first.') {
    super(message);
    this.name = 'Base64ImageRejectedError';
  }
}

export class ReleaseDayLockedError extends Error {
  statusCode = 400;

  constructor(message = 'Release day is locked once chapters have been published for this series.') {
    super(message);
    this.name = 'ReleaseDayLockedError';
  }
}

export function isBase64ImagePayload(value?: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^\s*data:image\//i.test(value);
}

export function assertNoBase64Images(input: {
  coverUrl?: string;
  panels?: Array<{ imageUrl?: string } | string>;
  pagesJson?: string[];
}): void {
  if (isBase64ImagePayload(input.coverUrl)) {
    throw new Base64ImageRejectedError();
  }
  if (Array.isArray(input.panels)) {
    for (const p of input.panels) {
      const url = typeof p === 'string' ? p : p?.imageUrl;
      if (isBase64ImagePayload(url)) {
        throw new Base64ImageRejectedError();
      }
    }
  }
  if (Array.isArray(input.pagesJson)) {
    for (const url of input.pagesJson) {
      if (isBase64ImagePayload(url)) {
        throw new Base64ImageRejectedError();
      }
    }
  }
}

/**
 * Idempotently creates and migrates Creator Dashboard + 3-Layer tables & indexes in Neon Postgres.
 * Always runs idempotent DDL/migrations on first startup (never skips new columns/indexes).
 */
export async function ensureCreatorTables(): Promise<void> {
  if (!hasLiveDatabase()) {
    tablesInitialized = true;
    return;
  }
  if (tablesInitialized) return;
  if (tableInitPromise) return tableInitPromise;

  tableInitPromise = (async () => {
    try {
      await withDbRetry(async () => {
        const existingTblRes = await pool.query<{ table_name: string }>(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('users', 'mangas', 'chapters', 'payouts', 'comments', 'page_views')
        `);
        const existingSet = new Set(existingTblRes.rows.map((r) => r.table_name));
        const hasAllCoreTables =
          existingSet.has('users') &&
          existingSet.has('mangas') &&
          existingSet.has('chapters') &&
          existingSet.has('payouts') &&
          existingSet.has('comments') &&
          existingSet.has('page_views');

        if (!hasAllCoreTables) {
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                pen_name TEXT NOT NULL,
                studio_name TEXT DEFAULT 'Mlungiseni NM Studio',
                bio TEXT DEFAULT '',
                avatar_url TEXT,
                backup_email TEXT,
                email_verified BOOLEAN NOT NULL DEFAULT false,
                verification_token TEXT,
                reset_token TEXT,
                totp_enabled BOOLEAN NOT NULL DEFAULT false,
                totp_secret TEXT,
                totp_pending_secret TEXT,
                totp_recovery_codes TEXT,
                role TEXT NOT NULL DEFAULT 'creator',
                followed_manga TEXT NOT NULL DEFAULT '[]',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              ALTER TABLE users ADD COLUMN IF NOT EXISTS followed_manga TEXT NOT NULL DEFAULT '[]';

              CREATE TABLE IF NOT EXISTS mangas (
                id TEXT PRIMARY KEY,
                creator_id TEXT NOT NULL,
                creator_email TEXT NOT NULL,
                title TEXT NOT NULL,
                synopsis TEXT NOT NULL DEFAULT '',
                cover_url TEXT NOT NULL DEFAULT '',
                genres TEXT NOT NULL DEFAULT '["Action"]',
                age_rating TEXT NOT NULL DEFAULT '13+',
                language TEXT NOT NULL DEFAULT 'English',
                type TEXT NOT NULL DEFAULT 'backdrop',
                release_day TEXT NOT NULL DEFAULT 'WED',
                status TEXT NOT NULL DEFAULT 'Draft',
                approval_status TEXT NOT NULL DEFAULT 'pending_review',
                views INTEGER NOT NULL DEFAULT 0,
                total_views_cached INTEGER NOT NULL DEFAULT 0,
                likes INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              ALTER TABLE mangas ADD COLUMN IF NOT EXISTS release_day TEXT NOT NULL DEFAULT 'WED';
              ALTER TABLE mangas ADD COLUMN IF NOT EXISTS total_views_cached INTEGER NOT NULL DEFAULT 0;

              CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                manga_id TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                number INTEGER NOT NULL,
                title TEXT NOT NULL,
                panels TEXT NOT NULL DEFAULT '[]',
                pages_json TEXT NOT NULL DEFAULT '[]',
                page_count INTEGER NOT NULL DEFAULT 8 CHECK (page_count >= 8 AND page_count <= 50),
                status TEXT NOT NULL DEFAULT 'published',
                publish_status TEXT NOT NULL DEFAULT 'Coming Soon • Panels In Production',
                scheduled_for TEXT,
                reads INTEGER NOT NULL DEFAULT 0,
                likes INTEGER NOT NULL DEFAULT 0,
                comments_count INTEGER NOT NULL DEFAULT 0,
                release_date TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              ALTER TABLE chapters ADD COLUMN IF NOT EXISTS pages_json TEXT NOT NULL DEFAULT '[]';
              ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

              CREATE TABLE IF NOT EXISTS payouts (
                id TEXT PRIMARY KEY,
                creator_id TEXT NOT NULL,
                creator_email TEXT NOT NULL,
                amount_zar DOUBLE PRECISION NOT NULL,
                method TEXT NOT NULL,
                account_reference TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Pending',
                paid_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

              CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                chapter_id TEXT NOT NULL,
                manga_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                text TEXT NOT NULL,
                page_number INTEGER,
                is_spoiler BOOLEAN NOT NULL DEFAULT false,
                parent_id TEXT,
                root_id TEXT,
                depth INTEGER NOT NULL DEFAULT 0,
                reply_to_user_name TEXT,
                user_badge TEXT,
                status TEXT NOT NULL DEFAULT 'published',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              CREATE TABLE IF NOT EXISTS page_views (
                id TEXT PRIMARY KEY,
                chapter_id TEXT NOT NULL,
                manga_id TEXT NOT NULL,
                processed BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );

              CREATE INDEX IF NOT EXISTS idx_mangas_creator_email ON mangas (creator_email);
              CREATE INDEX IF NOT EXISTS idx_mangas_type ON mangas (type);
              CREATE INDEX IF NOT EXISTS idx_mangas_release_day ON mangas (release_day);
              CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters (manga_id);
              CREATE INDEX IF NOT EXISTS idx_chapters_manga_publish_date ON chapters (manga_id, release_date);
              CREATE INDEX IF NOT EXISTS idx_chapters_status_scheduled ON chapters (status, scheduled_for);
              CREATE INDEX IF NOT EXISTS idx_comments_chapter_created ON comments (chapter_id, created_at);
              CREATE INDEX IF NOT EXISTS idx_page_views_chapter_created ON page_views (chapter_id, created_at);
              CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts (creator_id);
            `);
          } catch (ddlErr: any) {
            if (ddlErr?.code !== '42501') throw ddlErr;
          }
        }

        // Ensure fixed launch series release days
        await pool.query(`
          UPDATE mangas SET release_day = 'WED' WHERE id = 'nkosi-the-tale-of-myths' AND (release_day IS NULL OR release_day <> 'WED');
          UPDATE mangas SET release_day = 'FRI' WHERE id = 'last-shaman-of-zambezi' AND (release_day IS NULL OR release_day <> 'FRI');
          UPDATE mangas SET release_day = 'SUN' WHERE id = 'echoes-of-the-highveld' AND (release_day IS NULL OR release_day <> 'SUN');
        `);
      });
      tablesInitialized = true;
    } catch (error) {
      tableInitPromise = null;
      throw error;
    }
  })();

  return tableInitPromise;
}

/**
 * Transitions scheduled chapters whose SAST scheduled_for date <= today to published/Live.
 */
export async function publishDueScheduledChapters(): Promise<number> {
  const todaySast = getCurrentSastDateString();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    let flipped = 0;
    const now = new Date();
    for (const [id, ch] of store.chapters.entries()) {
      const isSched =
        ch.status === 'scheduled' ||
        (ch.publishStatus || '').toLowerCase() === 'scheduled';
      if (isSched && ch.scheduledFor && ch.scheduledFor.slice(0, 10) <= todaySast) {
        const updatedCh: DbChapter = {
          ...ch,
          status: 'published',
          publishStatus: 'Live',
          releaseDate: ch.scheduledFor.slice(0, 10),
          scheduledFor: null,
          updatedAt: now,
        };
        store.chapters.set(id, updatedCh);
        const parent = store.mangas.get(ch.mangaId);
        if (parent) {
          store.mangas.set(ch.mangaId, {
            ...parent,
            status: 'Live',
            approvalStatus: 'approved',
            updatedAt: now,
          });
        }
        flipped++;
      }
    }
    return flipped;
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const dueResult = await pool.query<{ id: string; manga_id: string; scheduled_for: string }>(
      `
        SELECT id, manga_id, scheduled_for
        FROM chapters
        WHERE (status = 'scheduled' OR LOWER(publish_status) = 'scheduled')
          AND scheduled_for IS NOT NULL
          AND SUBSTRING(scheduled_for, 1, 10) <= $1
      `,
      [todaySast]
    );

    if (dueResult.rows.length === 0) return 0;

    const chapterIds = dueResult.rows.map((r) => r.id);
    const mangaIds = Array.from(new Set(dueResult.rows.map((r) => r.manga_id)));

    await pool.query(
      `
        UPDATE chapters
        SET status = 'published',
            publish_status = 'Live',
            release_date = COALESCE(NULLIF(SUBSTRING(scheduled_for, 1, 10), ''), release_date),
            scheduled_for = NULL,
            updated_at = NOW()
        WHERE id = ANY($1::text[])
      `,
      [chapterIds]
    );

    await pool.query(
      `
        UPDATE mangas
        SET status = 'Live',
            approval_status = 'approved',
            updated_at = NOW()
        WHERE id = ANY($1::text[])
      `,
      [mangaIds]
    );

    return dueResult.rows.length;
  });
}

export async function listCreatorMangas(
  creatorId: string,
  creatorEmail: string
): Promise<DbManga[]> {
  await publishDueScheduledChapters();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const emailLower = (creatorEmail || '').trim().toLowerCase();
    return Array.from(store.mangas.values())
      .filter(
        (m) =>
          m.creatorId === creatorId ||
          (emailLower && m.creatorEmail.toLowerCase() === emailLower)
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const byId = await db
      .select()
      .from(mangas)
      .where(eq(mangas.creatorId, creatorId))
      .orderBy(desc(mangas.updatedAt));

    if (byId.length > 0 || !creatorEmail) {
      return byId;
    }

    return db
      .select()
      .from(mangas)
      .where(eq(mangas.creatorEmail, creatorEmail.trim().toLowerCase()))
      .orderBy(desc(mangas.updatedAt));
  });
}

export async function listChaptersForCreator(creatorId: string): Promise<DbChapter[]> {
  await publishDueScheduledChapters();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    return Array.from(store.chapters.values())
      .filter((c) => c.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  await ensureCreatorTables();
  return withDbRetry(async () =>
    db
      .select()
      .from(chapters)
      .where(eq(chapters.creatorId, creatorId))
      .orderBy(desc(chapters.createdAt))
  );
}

export async function upsertCreatorManga(input: {
  id: string;
  creatorId: string;
  creatorEmail: string;
  title: string;
  synopsis: string;
  coverUrl: string;
  genres: string[];
  ageRating: string;
  language: string;
  type?: 'original' | 'backdrop';
  releaseDay?: ReleaseDay | string;
  status: 'Draft' | 'Coming Soon' | 'Live';
  approvalStatus?: string;
}): Promise<DbManga> {
  assertNoBase64Images({ coverUrl: input.coverUrl });

  const seriesType: 'original' | 'backdrop' =
    input.type === 'original' ? 'original' : 'backdrop';
  const cleanReleaseDay = normalizeReleaseDay(
    input.releaseDay,
    getSeedReleaseDay(input.id)
  );
  const now = new Date();

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const existing = store.mangas.get(input.id);
    const hasChapters = Array.from(store.chapters.values()).some(
      (c) => c.mangaId === input.id
    );
    if (
      existing &&
      hasChapters &&
      input.releaseDay &&
      normalizeReleaseDay(existing.releaseDay) !== cleanReleaseDay
    ) {
      throw new ReleaseDayLockedError();
    }

    const row: DbManga = {
      id: input.id,
      creatorId: input.creatorId,
      creatorEmail: input.creatorEmail.trim().toLowerCase(),
      title: input.title,
      synopsis: input.synopsis,
      coverUrl: input.coverUrl,
      genres: JSON.stringify(input.genres),
      ageRating: input.ageRating,
      language: input.language,
      type: existing?.type === 'original' || input.id === 'nkosi-the-tale-of-myths'
        ? 'original'
        : existing?.type === 'backdrop'
        ? 'backdrop'
        : seriesType,
      releaseDay: existing && hasChapters ? existing.releaseDay : cleanReleaseDay,
      status: input.status,
      approvalStatus:
        input.approvalStatus ||
        (input.status === 'Live' ? 'approved' : 'pending_review'),
      views: existing?.views ?? 0,
      totalViewsCached: existing?.totalViewsCached ?? 0,
      likes: existing?.likes ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    store.mangas.set(row.id, row);
    return row;
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existingRows = await db
      .select()
      .from(mangas)
      .where(eq(mangas.id, input.id))
      .limit(1);
    const existing = existingRows[0];

    let effectiveReleaseDay = cleanReleaseDay;
    if (existing) {
      const chRows = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.mangaId, input.id))
        .limit(1);
      if (chRows.length > 0 && input.releaseDay) {
        const existingDay = normalizeReleaseDay(existing.releaseDay);
        if (existingDay !== cleanReleaseDay) {
          throw new ReleaseDayLockedError();
        }
        effectiveReleaseDay = existingDay;
      }
    }

    const rows = await db
      .insert(mangas)
      .values({
        id: input.id,
        creatorId: input.creatorId,
        creatorEmail: input.creatorEmail.trim().toLowerCase(),
        title: input.title,
        synopsis: input.synopsis,
        coverUrl: input.coverUrl,
        genres: JSON.stringify(input.genres),
        ageRating: input.ageRating,
        language: input.language,
        type: seriesType,
        releaseDay: effectiveReleaseDay,
        status: input.status,
        approvalStatus:
          input.approvalStatus ||
          (input.status === 'Live' ? 'approved' : 'pending_review'),
        views: 0,
        totalViewsCached: 0,
        likes: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: mangas.id,
        set: {
          title: input.title,
          synopsis: input.synopsis,
          coverUrl: input.coverUrl,
          genres: JSON.stringify(input.genres),
          ageRating: input.ageRating,
          language: input.language,
          type: seriesType,
          releaseDay: effectiveReleaseDay,
          status: input.status,
          approvalStatus:
            input.approvalStatus ||
            (input.status === 'Live' ? 'approved' : 'pending_review'),
          updatedAt: now,
        },
      })
      .returning();

    return rows[0];
  });
}

export async function updateCreatorMangaRecord(
  id: string,
  creatorId: string,
  patch: Partial<{
    title: string;
    synopsis: string;
    coverUrl: string;
    type: 'original' | 'backdrop';
    releaseDay: ReleaseDay;
    status: string;
    approvalStatus: string;
  }>
): Promise<DbManga | null> {
  if (patch.coverUrl) {
    assertNoBase64Images({ coverUrl: patch.coverUrl });
  }

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const existing = store.mangas.get(id);
    if (!existing || existing.creatorId !== creatorId) return null;

    if (patch.releaseDay) {
      const hasChapters = Array.from(store.chapters.values()).some(
        (c) => c.mangaId === id
      );
      if (hasChapters && normalizeReleaseDay(existing.releaseDay) !== patch.releaseDay) {
        throw new ReleaseDayLockedError();
      }
    }

    const updated: DbManga = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    store.mangas.set(id, updated);
    return updated;
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db
      .select()
      .from(mangas)
      .where(eq(mangas.id, id))
      .limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return null;
    }

    if (patch.releaseDay) {
      const chRows = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.mangaId, id))
        .limit(1);
      if (
        chRows.length > 0 &&
        normalizeReleaseDay(existing[0].releaseDay) !== patch.releaseDay
      ) {
        throw new ReleaseDayLockedError();
      }
    }

    const updated = await db
      .update(mangas)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(mangas.id, id))
      .returning();

    return updated[0] ?? null;
  });
}

export async function deleteCreatorMangaRecord(
  id: string,
  creatorId: string
): Promise<boolean> {
  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const existing = store.mangas.get(id);
    if (!existing || existing.creatorId !== creatorId) return false;
    for (const [cid, ch] of store.chapters.entries()) {
      if (ch.mangaId === id) store.chapters.delete(cid);
    }
    store.mangas.delete(id);
    return true;
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db
      .select()
      .from(mangas)
      .where(eq(mangas.id, id))
      .limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return false;
    }
    await db.delete(chapters).where(eq(chapters.mangaId, id));
    await db.delete(mangas).where(eq(mangas.id, id));
    return true;
  });
}

export async function createCreatorChapterRecord(input: {
  id: string;
  mangaId: string;
  creatorId: string;
  number: number;
  title: string;
  panels: Array<{ id: string; pageNumber: number; imageUrl: string }>;
  publishStatus: 'Coming Soon • Panels In Production' | 'Live' | 'Scheduled';
  scheduledFor?: string | null;
  releaseDate: string;
}): Promise<DbChapter> {
  if (!Array.isArray(input.panels) || input.panels.length < 8 || input.panels.length > 50) {
    throw new Error('Chapter must be 8-50 pages');
  }

  const pageUrls = input.panels.map((p) => String(p.imageUrl).trim());
  assertNoBase64Images({ panels: input.panels, pagesJson: pageUrls });

  const isScheduled = input.publishStatus === 'Scheduled';
  const isLive = input.publishStatus === 'Live';
  const normalizedStatus: 'published' | 'scheduled' | 'draft' = isLive
    ? 'published'
    : isScheduled
    ? 'scheduled'
    : 'draft';

  const now = new Date();
  const todaySast = getCurrentSastDateString(now);

  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const parentManga = store.mangas.get(input.mangaId);
    const seriesReleaseDay = normalizeReleaseDay(
      parentManga?.releaseDay,
      getSeedReleaseDay(input.mangaId)
    );

    const targetDate = isScheduled
      ? (input.scheduledFor?.slice(0, 10) ||
          getNextReleaseDateForDay(seriesReleaseDay, todaySast, false).isoDate)
      : (input.releaseDate?.slice(0, 10) || todaySast);

    const { weekStartIso, weekEndIso, nextReleaseLabel, nextReleaseIso } =
      getReleaseWeekWindow(seriesReleaseDay, targetDate);

    // Check max 1 chapter per release week for this series
    for (const existingCh of store.chapters.values()) {
      if (existingCh.mangaId !== input.mangaId || existingCh.id === input.id) continue;
      if (existingCh.status === 'draft') continue;
      const chDate = (
        existingCh.scheduledFor ||
        existingCh.releaseDate ||
        ''
      ).slice(0, 10);
      if (chDate >= weekStartIso && chDate <= weekEndIso) {
        throw new WeeklyChapterLimitError(
          `You already published this week. Your next release day is ${nextReleaseLabel}.`,
          nextReleaseLabel,
          nextReleaseIso
        );
      }
    }

    const row: DbChapter = {
      id: input.id,
      mangaId: input.mangaId,
      creatorId: input.creatorId,
      number: input.number,
      title: input.title,
      panels: JSON.stringify(input.panels),
      pagesJson: JSON.stringify(pageUrls),
      pageCount: input.panels.length,
      status: normalizedStatus,
      publishStatus: input.publishStatus,
      scheduledFor: isScheduled ? targetDate : null,
      reads: 0,
      likes: 0,
      commentsCount: 0,
      releaseDate: isScheduled ? targetDate : (input.releaseDate || todaySast),
      createdAt: now,
      updatedAt: now,
    };
    store.chapters.set(row.id, row);

    if (parentManga) {
      store.mangas.set(parentManga.id, {
        ...parentManga,
        status: isLive ? 'Live' : parentManga.status === 'Live' ? 'Live' : 'Coming Soon',
        approvalStatus: isLive ? 'approved' : parentManga.approvalStatus,
        updatedAt: now,
      });
    }

    return row;
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const parentRows = await db
      .select()
      .from(mangas)
      .where(eq(mangas.id, input.mangaId))
      .limit(1);
    const parentManga = parentRows[0];
    const seriesReleaseDay = normalizeReleaseDay(
      parentManga?.releaseDay,
      getSeedReleaseDay(input.mangaId)
    );

    const targetDate = isScheduled
      ? (input.scheduledFor?.slice(0, 10) ||
          getNextReleaseDateForDay(seriesReleaseDay, todaySast, false).isoDate)
      : (input.releaseDate?.slice(0, 10) || todaySast);

    const { weekStartIso, weekEndIso, nextReleaseLabel, nextReleaseIso } =
      getReleaseWeekWindow(seriesReleaseDay, targetDate);

    // Enforce max 1 chapter per release week in DB
    const existingChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.mangaId, input.mangaId));

    for (const existingCh of existingChapters) {
      if (existingCh.id === input.id) continue;
      if (existingCh.status === 'draft') continue;
      const chDate = (
        existingCh.scheduledFor ||
        existingCh.releaseDate ||
        ''
      ).slice(0, 10);
      if (chDate >= weekStartIso && chDate <= weekEndIso) {
        throw new WeeklyChapterLimitError(
          `You already published this week. Your next release day is ${nextReleaseLabel}.`,
          nextReleaseLabel,
          nextReleaseIso
        );
      }
    }

    const rows = await db
      .insert(chapters)
      .values({
        id: input.id,
        mangaId: input.mangaId,
        creatorId: input.creatorId,
        number: input.number,
        title: input.title,
        panels: JSON.stringify(input.panels),
        pagesJson: JSON.stringify(pageUrls),
        pageCount: input.panels.length,
        status: normalizedStatus,
        publishStatus: input.publishStatus,
        scheduledFor: isScheduled ? targetDate : null,
        reads: 0,
        likes: 0,
        commentsCount: 0,
        releaseDate: isScheduled ? targetDate : (input.releaseDate || todaySast),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (isLive) {
      await db
        .update(mangas)
        .set({ status: 'Live', approvalStatus: 'approved', updatedAt: now })
        .where(eq(mangas.id, input.mangaId));
    } else if (parentManga && parentManga.status !== 'Live') {
      await db
        .update(mangas)
        .set({ status: 'Coming Soon', updatedAt: now })
        .where(eq(mangas.id, input.mangaId));
    }

    return rows[0];
  });
}

export async function publishCreatorChapterRecord(
  chapterId: string,
  creatorId: string
): Promise<DbChapter | null> {
  if (!hasLiveDatabase()) {
    const store = getDevLayeredStore();
    const existing = store.chapters.get(chapterId);
    if (!existing || existing.creatorId !== creatorId) return null;
    const now = new Date();
    const updated: DbChapter = {
      ...existing,
      status: 'published',
      publishStatus: 'Live',
      scheduledFor: null,
      releaseDate: getCurrentSastDateString(now),
      updatedAt: now,
    };
    store.chapters.set(chapterId, updated);
    const parent = store.mangas.get(existing.mangaId);
    if (parent) {
      store.mangas.set(parent.id, {
        ...parent,
        status: 'Live',
        approvalStatus: 'approved',
        updatedAt: now,
      });
    }
    return updated;
  }

  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return null;
    }

    const now = new Date();
    const updated = await db
      .update(chapters)
      .set({
        status: 'published',
        publishStatus: 'Live',
        scheduledFor: null,
        releaseDate: getCurrentSastDateString(now),
        updatedAt: now,
      })
      .where(eq(chapters.id, chapterId))
      .returning();

    if (updated[0]) {
      await db
        .update(mangas)
        .set({ status: 'Live', approvalStatus: 'approved', updatedAt: now })
        .where(eq(mangas.id, updated[0].mangaId));
    }

    return updated[0] ?? null;
  });
}

export async function listCreatorPayouts(creatorId: string): Promise<DbPayout[]> {
  if (!hasLiveDatabase()) return [];
  await ensureCreatorTables();
  return withDbRetry(async () =>
    db
      .select()
      .from(payouts)
      .where(eq(payouts.creatorId, creatorId))
      .orderBy(desc(payouts.createdAt))
  );
}

export async function listAllPayoutsForAdmin(): Promise<DbPayout[]> {
  if (!hasLiveDatabase()) return [];
  await ensureCreatorTables();
  return withDbRetry(async () =>
    db.select().from(payouts).orderBy(desc(payouts.createdAt))
  );
}

export async function createCreatorPayoutRecord(input: {
  id: string;
  creatorId: string;
  creatorEmail: string;
  amountZar: number;
  method: 'Bank' | 'Capitec' | 'PayFast';
  accountReference: string;
}): Promise<DbPayout> {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const rows = await db
      .insert(payouts)
      .values({
        id: input.id,
        creatorId: input.creatorId,
        creatorEmail: input.creatorEmail.trim().toLowerCase(),
        amountZar: input.amountZar,
        method: input.method,
        accountReference: input.accountReference,
        status: 'Pending',
        paidAt: null,
        createdAt: new Date(),
      })
      .returning();

    return rows[0];
  });
}

export async function updatePayoutStatusRecord(
  payoutId: string,
  status: 'Pending' | 'Approved' | 'Paid'
): Promise<DbPayout | null> {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const updated = await db
      .update(payouts)
      .set({
        status,
        paidAt: status === 'Paid' ? new Date() : null,
      })
      .where(eq(payouts.id, payoutId))
      .returning();

    return updated[0] ?? null;
  });
}
