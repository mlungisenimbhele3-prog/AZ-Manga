import { desc, eq } from 'drizzle-orm';
import { db, pool, withDbRetry } from './index.ts';
import { mangas, chapters, payouts, DbManga, DbChapter, DbPayout } from './schema.ts';

let tablesInitialized = false;
let tableInitPromise: Promise<void> | null = null;

/**
 * Idempotently creates Creator Dashboard tables (mangas, chapters, payouts) in Neon Postgres.
 */
export async function ensureCreatorTables(): Promise<void> {
  if (tablesInitialized) return;
  if (tableInitPromise) return tableInitPromise;

  tableInitPromise = (async () => {
    try {
      await withDbRetry(async () => {
        const check = await pool.query<{ table_name: string }>(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('mangas', 'chapters', 'payouts')`
        );
        if (check.rows.length >= 3) {
          return;
        }

        await pool.query(`
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
            status TEXT NOT NULL DEFAULT 'Draft',
            approval_status TEXT NOT NULL DEFAULT 'pending_review',
            views INTEGER NOT NULL DEFAULT 0,
            likes INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS chapters (
            id TEXT PRIMARY KEY,
            manga_id TEXT NOT NULL,
            creator_id TEXT NOT NULL,
            number INTEGER NOT NULL,
            title TEXT NOT NULL,
            panels TEXT NOT NULL DEFAULT '[]',
            page_count INTEGER NOT NULL DEFAULT 8 CHECK (page_count >= 8 AND page_count <= 50),
            publish_status TEXT NOT NULL DEFAULT 'Coming Soon • Panels In Production',
            scheduled_for TEXT,
            reads INTEGER NOT NULL DEFAULT 0,
            likes INTEGER NOT NULL DEFAULT 0,
            comments_count INTEGER NOT NULL DEFAULT 0,
            release_date TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

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

          CREATE INDEX IF NOT EXISTS idx_mangas_creator_email ON mangas (creator_email);
          CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters (manga_id);
          CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts (creator_id);
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

export async function listCreatorMangas(creatorId: string, creatorEmail: string): Promise<DbManga[]> {
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
  status: 'Draft' | 'Coming Soon' | 'Live';
  approvalStatus?: string;
}): Promise<DbManga> {
  await ensureCreatorTables();
  const seriesType: 'original' | 'backdrop' = input.type === 'original' ? 'original' : 'backdrop';
  return withDbRetry(async () => {
    const now = new Date();
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
        status: input.status,
        approvalStatus: input.approvalStatus || (input.status === 'Live' ? 'approved' : 'pending_review'),
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
          status: input.status,
          approvalStatus: input.approvalStatus || (input.status === 'Live' ? 'approved' : 'pending_review'),
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
    status: string;
    approvalStatus: string;
  }>
): Promise<DbManga | null> {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db.select().from(mangas).where(eq(mangas.id, id)).limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return null;
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

export async function deleteCreatorMangaRecord(id: string, creatorId: string): Promise<boolean> {
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db.select().from(mangas).where(eq(mangas.id, id)).limit(1);
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
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const now = new Date();
    const rows = await db
      .insert(chapters)
      .values({
        id: input.id,
        mangaId: input.mangaId,
        creatorId: input.creatorId,
        number: input.number,
        title: input.title,
        panels: JSON.stringify(input.panels),
        pageCount: input.panels.length,
        publishStatus: input.publishStatus,
        scheduledFor: input.scheduledFor ?? null,
        reads: 0,
        likes: 0,
        commentsCount: 0,
        releaseDate: input.releaseDate,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (input.publishStatus === 'Live') {
      await db
        .update(mangas)
        .set({ status: 'Live', approvalStatus: 'approved', updatedAt: now })
        .where(eq(mangas.id, input.mangaId));
    } else {
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
  await ensureCreatorTables();
  return withDbRetry(async () => {
    const existing = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
    if (!existing[0] || existing[0].creatorId !== creatorId) {
      return null;
    }

    const now = new Date();
    const updated = await db
      .update(chapters)
      .set({
        publishStatus: 'Live',
        scheduledFor: null,
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
  await ensureCreatorTables();
  return withDbRetry(async () =>
    db
      .select()
      .from(payouts)
      .orderBy(desc(payouts.createdAt))
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
