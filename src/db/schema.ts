import { sql } from 'drizzle-orm';
import { boolean, check, doublePrecision, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  penName: text('pen_name').notNull(),
  studioName: text('studio_name').default('Mlungiseni NM Studio'),
  bio: text('bio').default(''),
  avatarUrl: text('avatar_url'),
  backupEmail: text('backup_email'),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  totpSecret: text('totp_secret'),
  totpPendingSecret: text('totp_pending_secret'),
  totpRecoveryCodes: text('totp_recovery_codes'),
  role: text('role').notNull().default('creator'),
  followedManga: text('followed_manga').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mangas = pgTable(
  'mangas',
  {
    id: text('id').primaryKey(),
    creatorId: text('creator_id').notNull(),
    creatorEmail: text('creator_email').notNull(),
    title: text('title').notNull(),
    synopsis: text('synopsis').notNull().default(''),
    coverUrl: text('cover_url').notNull().default(''),
    genres: text('genres').notNull().default('["Action"]'),
    ageRating: text('age_rating').notNull().default('13+'),
    language: text('language').notNull().default('English'),
    type: text('type').notNull().default('backdrop'),
    releaseDay: text('release_day').notNull().default('WED'),
    status: text('status').notNull().default('Draft'),
    approvalStatus: text('approval_status').notNull().default('pending_review'),
    views: integer('views').notNull().default(0),
    totalViewsCached: integer('total_views_cached').notNull().default(0),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_mangas_type').on(table.type),
    index('idx_mangas_release_day').on(table.releaseDay),
  ]
);

export const chapters = pgTable(
  'chapters',
  {
    id: text('id').primaryKey(),
    mangaId: text('manga_id').notNull(),
    creatorId: text('creator_id').notNull(),
    number: integer('number').notNull(),
    title: text('title').notNull(),
    panels: text('panels').notNull().default('[]'),
    pagesJson: text('pages_json').notNull().default('[]'),
    pageCount: integer('page_count').notNull().default(8),
    status: text('status').notNull().default('published'),
    publishStatus: text('publish_status')
      .notNull()
      .default('Coming Soon • Panels In Production'),
    scheduledFor: text('scheduled_for'),
    reads: integer('reads').notNull().default(0),
    likes: integer('likes').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    releaseDate: text('release_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_chapters_page_count', sql`${table.pageCount} >= 8 AND ${table.pageCount} <= 50`),
    index('idx_chapters_manga_publish_date').on(table.mangaId, table.releaseDate),
    index('idx_chapters_status_scheduled').on(table.status, table.scheduledFor),
  ]
);

export const payouts = pgTable('payouts', {
  id: text('id').primaryKey(),
  creatorId: text('creator_id').notNull(),
  creatorEmail: text('creator_email').notNull(),
  amountZar: doublePrecision('amount_zar').notNull(),
  method: text('method').notNull(),
  accountReference: text('account_reference').notNull().default(''),
  status: text('status').notNull().default('Pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issues = pgTable('issues', {
  id: text('id').primaryKey(),
  issueNumber: integer('issue_number').notNull(),
  editionLabel: text('edition_label').notNull(),
  headline: text('headline').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const awards = pgTable('awards', {
  id: text('id').primaryKey(),
  year: integer('year').notNull().default(2026),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  status: text('status').notNull().default('coming_soon'),
  winnerMangaId: text('winner_manga_id'),
  winnerCitation: text('winner_citation'),
  votesCount: integer('votes_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creatorFollows = pgTable(
  'creator_follows',
  {
    id: text('id').primaryKey(),
    creatorId: text('creator_id').notNull(),
    creatorName: text('creator_name').notNull(),
    followerKey: text('follower_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_creator_follows_unique').on(table.creatorId, table.followerKey),
    index('idx_creator_follows_creator_id').on(table.creatorId),
  ]
);

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey(),
    chapterId: text('chapter_id').notNull(),
    mangaId: text('manga_id').notNull(),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    text: text('text').notNull(),
    pageNumber: integer('page_number'),
    isSpoiler: boolean('is_spoiler').notNull().default(false),
    parentId: text('parent_id'),
    rootId: text('root_id'),
    depth: integer('depth').notNull().default(0),
    replyToUserName: text('reply_to_user_name'),
    userBadge: text('user_badge'),
    status: text('status').notNull().default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_comments_chapter_created').on(table.chapterId, table.createdAt),
  ]
);

export const pageViews = pgTable(
  'page_views',
  {
    id: text('id').primaryKey(),
    chapterId: text('chapter_id').notNull(),
    mangaId: text('manga_id').notNull(),
    processed: boolean('processed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_page_views_chapter_created').on(table.chapterId, table.createdAt),
  ]
);

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
export type DbManga = typeof mangas.$inferSelect;
export type DbChapter = typeof chapters.$inferSelect;
export type DbPayout = typeof payouts.$inferSelect;
export type DbIssue = typeof issues.$inferSelect;
export type DbAward = typeof awards.$inferSelect;
export type DbCreatorFollow = typeof creatorFollows.$inferSelect;
export type DbComment = typeof comments.$inferSelect;
export type DbPageView = typeof pageViews.$inferSelect;
