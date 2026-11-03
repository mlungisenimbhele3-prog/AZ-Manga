import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  penName: text('pen_name').notNull(),
  studioName: text('studio_name').default('Mlungiseni NM Studio'),
  bio: text('bio').default(''),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  totpSecret: text('totp_secret'),
  totpPendingSecret: text('totp_pending_secret'),
  totpRecoveryCodes: text('totp_recovery_codes'),
  role: text('role').notNull().default('creator'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
