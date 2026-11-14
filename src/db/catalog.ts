import { asc, eq, sql } from 'drizzle-orm';
import { db, pool, withDbRetry } from './index.ts';
import { ensureCreatorTables } from './creator.ts';
import { awards, chapters, creatorFollows, issues, mangas, DbAward, DbIssue } from './schema.ts';

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
    status: 'Coming Soon',
    approvalStatus: 'approved',
  },
];

let catalogInitialized = false;
let catalogInitPromise: Promise<void> | null = null;

/**
 * Ensures public catalog tables (mangas, chapters, issues, awards, creator_follows)
 * exist and seeds only real launch-state rows (Issue #01, Coming Soon Awards, 0 views/likes).
 */
export async function ensureCatalogTables(): Promise<void> {
  if (catalogInitialized) return;
  if (catalogInitPromise) return catalogInitPromise;

  catalogInitPromise = (async () => {
    try {
      await ensureCreatorTables();
      await withDbRetry(async () => {
        const check = await pool.query<{ table_name: string }>(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('issues', 'awards', 'creator_follows')`
        );
        if (check.rows.length < 3) {
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
        }

        // Seed core launch manga rows with 0 views & 0 likes if missing
        for (const m of CORE_LAUNCH_MANGAS) {
          await pool.query(
            `
              INSERT INTO mangas (
                id, creator_id, creator_email, title, synopsis, cover_url,
                genres, age_rating, language, status, approval_status, views, likes
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0)
              ON CONFLICT (id) DO NOTHING
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
              m.status,
              m.approvalStatus,
            ]
          );
        }

        // Seed ONLY 1 real launch issue if issues table is empty
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

        // Seed Coming Soon awards row with NULL winner and 0 votes if awards table is empty
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

/**
 * Resets all fake views, reads, likes, issues, and awards winners/votes in Postgres.
 */
export async function resetFakeMetricsInDatabase(): Promise<void> {
  await ensureCatalogTables();
  await withDbRetry(async () => {
    await pool.query(`UPDATE mangas SET views = 0, likes = 0`);
    await pool.query(`UPDATE chapters SET reads = 0, likes = 0`);
    await pool.query(`DELETE FROM issues WHERE id <> $1`, [LAUNCH_ISSUE_ID]);
    await pool.query(
      `
        INSERT INTO issues (id, issue_number, edition_label, headline, is_active, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW())
        ON CONFLICT (id) DO UPDATE SET
          issue_number = EXCLUDED.issue_number,
          edition_label = EXCLUDED.edition_label,
          headline = EXCLUDED.headline,
          is_active = true,
          updated_at = NOW()
      `,
      [
        LAUNCH_ISSUE_ID,
        LAUNCH_ISSUE_NUMBER,
        LAUNCH_ISSUE_EDITION_LABEL,
        LAUNCH_ISSUE_HEADLINE,
      ]
    );
    await pool.query(`DELETE FROM awards WHERE id <> $1`, [LAUNCH_AWARD_ID]);
    await pool.query(
      `
        INSERT INTO awards (id, year, title, subtitle, status, winner_manga_id, winner_citation, votes_count, updated_at)
        VALUES ($1, 2026, $2, $3, 'coming_soon', NULL, NULL, 0, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          status = 'coming_soon',
          winner_manga_id = NULL,
          winner_citation = NULL,
          votes_count = 0,
          updated_at = NOW()
      `,
      [LAUNCH_AWARD_ID, LAUNCH_AWARD_TITLE, LAUNCH_AWARD_SUBTITLE]
    );
  });
}

export async function getActiveIssue(): Promise<DbIssue> {
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

export async function getPublicCatalogMetrics(): Promise<{
  mangas: Array<{ id: string; views: number; likes: number; status: string; approvalStatus: string }>;
  chapters: Array<{ id: string; mangaId: string; reads: number; likes: number; publishStatus: string }>;
  activeIssue: DbIssue;
  awards: DbAward;
  followerCounts: Record<string, number>;
}> {
  await ensureCatalogTables();
  return withDbRetry(async () => {
    const [dbMangas, dbChapters, activeIssue, awardState, followRows] = await Promise.all([
      db
        .select({
          id: mangas.id,
          views: mangas.views,
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
          publishStatus: chapters.publishStatus,
        })
        .from(chapters),
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
      mangas: dbMangas,
      chapters: dbChapters,
      activeIssue,
      awards: awardState,
      followerCounts,
    };
  });
}

/**
 * Increments views (+1) on a Live manga and reads (+1) on a Live chapter in DB.
 * Strictly ignores Coming Soon / Preview / Draft / non-live chapters.
 */
export async function recordLiveChapterView(
  mangaId: string,
  chapterId: string
): Promise<{ counted: boolean; views?: number; reads?: number; reason?: string }> {
  if (!mangaId || !chapterId || chapterId.includes('__preview')) {
    return { counted: false, reason: 'Preview or invalid chapter' };
  }

  await ensureCatalogTables();

  return withDbRetry(async () => {
    const [mangaRow] = await db.select().from(mangas).where(eq(mangas.id, mangaId)).limit(1);
    if (!mangaRow) {
      return { counted: false, reason: 'Manga not found' };
    }

    const statusLower = (mangaRow.status || '').toLowerCase();
    if (statusLower.includes('coming') || statusLower === 'draft') {
      return { counted: false, views: mangaRow.views, reason: 'Manga is not live' };
    }

    const [chapterRow] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    if (!chapterRow || chapterRow.mangaId !== mangaId) {
      return { counted: false, views: mangaRow.views, reason: 'Chapter not found' };
    }

    const chStatusLower = (chapterRow.publishStatus || '').toLowerCase();
    let hasPanels = false;
    try {
      const parsed = JSON.parse(chapterRow.panels || '[]');
      hasPanels = Array.isArray(parsed) && parsed.length > 0;
    } catch {
      hasPanels = false;
    }

    if (chStatusLower !== 'live' || !hasPanels) {
      return { counted: false, views: mangaRow.views, reason: 'Chapter is not live with panels' };
    }

    const [updatedManga] = await db
      .update(mangas)
      .set({
        views: sql`${mangas.views} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(mangas.id, mangaId))
      .returning({ views: mangas.views });

    const [updatedChapter] = await db
      .update(chapters)
      .set({
        reads: sql`${chapters.reads} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId))
      .returning({ reads: chapters.reads });

    return {
      counted: true,
      views: updatedManga?.views ?? mangaRow.views + 1,
      reads: updatedChapter?.reads ?? chapterRow.reads + 1,
    };
  });
}

export async function toggleCreatorFollowInDb(input: {
  creatorId: string;
  creatorName: string;
  followerKey: string;
  action: 'follow' | 'unfollow';
}): Promise<{ followersCount: number }> {
  await ensureCatalogTables();
  return withDbRetry(async () => {
    const cleanCreatorId = input.creatorId.trim().slice(0, 120);
    const cleanFollowerKey = input.followerKey.trim().toLowerCase().slice(0, 140);

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
