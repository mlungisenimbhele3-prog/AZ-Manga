import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users, DbUser, NewDbUser } from './schema.ts';

export interface PublicUser {
  id: string;
  email: string;
  backup_email: string | null;
  pen_name: string;
  studio_name: string;
  bio: string;
  avatar_url: string | null;
  email_verified: boolean;
  totp_enabled: boolean;
  totp_recovery_codes_remaining: number;
  role: 'reader' | 'creator' | 'admin';
  created_at: string;
}

function parseRemainingRecoveryCodesCount(rawJson: string | null | undefined): number {
  if (!rawJson) return 0;
  try {
    const parsed = JSON.parse(rawJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Strips password_hash, verification_token, reset_token, totp_secret, totp_pending_secret,
 * and totp_recovery_codes hashes before any response leaves the server.
 */
export function toPublicUser(row: DbUser): PublicUser {
  const normalizedRole =
    row.role === 'admin' || row.role === 'reader' || row.role === 'creator'
      ? row.role
      : 'creator';
  const totpActive = Boolean(row.totpEnabled && row.totpSecret);

  return {
    id: row.id,
    email: row.email,
    backup_email: row.backupEmail ?? null,
    pen_name: row.penName,
    studio_name: row.studioName || `${row.penName} Studio`,
    bio: row.bio || '',
    avatar_url: row.avatarUrl ?? null,
    email_verified: Boolean(row.emailVerified),
    totp_enabled: totpActive,
    totp_recovery_codes_remaining: totpActive
      ? parseRemainingRecoveryCodesCount(row.totpRecoveryCodes)
      : 0,
    role: normalizedRole,
    created_at:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
  };
}

export async function findUserByEmail(rawEmail: string): Promise<DbUser | null> {
  const email = rawEmail.trim().toLowerCase();
  try {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('[DB] findUserByEmail failed:', error);
    throw new Error('Authentication database is temporarily unavailable.', { cause: error });
  }
}

export async function findUserById(id: string): Promise<DbUser | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('[DB] findUserById failed:', error);
    throw new Error('Authentication database is temporarily unavailable.', { cause: error });
  }
}

export async function createUserRecord(input: NewDbUser): Promise<DbUser> {
  try {
    const inserted = await db
      .insert(users)
      .values({
        ...input,
        email: input.email.trim().toLowerCase(),
      })
      .returning();

    if (!inserted[0]) {
      throw new Error('Failed to create user record.');
    }
    return inserted[0];
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new Error('EMAIL_ALREADY_EXISTS', { cause: error });
    }
    console.error('[DB] createUserRecord failed:', error);
    throw new Error('Could not register account right now. Please try again.', { cause: error });
  }
}

export async function updateUserVerificationToken(
  id: string,
  verificationToken: string | null,
  passwordHash?: string,
  penName?: string,
  studioName?: string
): Promise<DbUser | null> {
  try {
    const updatePayload: Partial<NewDbUser> = {
      verificationToken,
      updatedAt: new Date(),
    };
    if (passwordHash) updatePayload.passwordHash = passwordHash;
    if (penName) updatePayload.penName = penName;
    if (studioName) updatePayload.studioName = studioName;

    const updated = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] updateUserVerificationToken failed:', error);
    throw new Error('Failed to update verification token.', { cause: error });
  }
}

export async function markUserEmailVerified(id: string): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] markUserEmailVerified failed:', error);
    throw new Error('Failed to verify email address.', { cause: error });
  }
}

export async function setUserPasswordResetToken(
  id: string,
  resetToken: string | null
): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        resetToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] setUserPasswordResetToken failed:', error);
    throw new Error('Failed to save password reset token.', { cause: error });
  }
}

export async function updateUserPasswordHash(
  id: string,
  passwordHash: string
): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] updateUserPasswordHash failed:', error);
    throw new Error('Failed to update account password.', { cause: error });
  }
}

export async function updateUserCreatorProfile(
  id: string,
  updates: {
    penName?: string;
    studioName?: string;
    bio?: string;
    avatarUrl?: string | null;
    role?: 'reader' | 'creator' | 'admin';
    backupEmail?: string | null;
  }
): Promise<DbUser | null> {
  try {
    const patch: Partial<NewDbUser> = {
      updatedAt: new Date(),
    };
    if (typeof updates.penName === 'string' && updates.penName.trim().length >= 2) {
      patch.penName = updates.penName.trim();
    }
    if (typeof updates.studioName === 'string') {
      patch.studioName = updates.studioName.trim();
    }
    if (typeof updates.bio === 'string') {
      patch.bio = updates.bio.trim();
    }
    if (updates.avatarUrl !== undefined) {
      patch.avatarUrl = updates.avatarUrl;
    }
    if (updates.role) {
      patch.role = updates.role;
    }
    if (updates.backupEmail !== undefined) {
      patch.backupEmail = updates.backupEmail ? updates.backupEmail.trim().toLowerCase() : null;
    }

    const updated = await db.update(users).set(patch).where(eq(users.id, id)).returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] updateUserCreatorProfile failed:', error);
    throw new Error('Failed to update creator profile.', { cause: error });
  }
}

export async function savePendingTotpSecret(
  id: string,
  encryptedPendingSecret: string
): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        totpPendingSecret: encryptedPendingSecret,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] savePendingTotpSecret failed:', error);
    throw new Error('Failed to initialize two-factor setup.', { cause: error });
  }
}

export async function activateUserTotp(
  id: string,
  encryptedSecret: string,
  recoveryCodesHashesJson: string
): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpPendingSecret: null,
        totpRecoveryCodes: recoveryCodesHashesJson,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] activateUserTotp failed:', error);
    throw new Error('Failed to enable two-factor authentication.', { cause: error });
  }
}

export async function updateUserRecoveryCodes(
  id: string,
  recoveryCodesHashesJson: string
): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        totpRecoveryCodes: recoveryCodesHashesJson,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] updateUserRecoveryCodes failed:', error);
    throw new Error('Failed to update recovery codes.', { cause: error });
  }
}

export async function disableUserTotp(id: string): Promise<DbUser | null> {
  try {
    const updated = await db
      .update(users)
      .set({
        totpEnabled: false,
        totpSecret: null,
        totpPendingSecret: null,
        totpRecoveryCodes: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('[DB] disableUserTotp failed:', error);
    throw new Error('Failed to disable two-factor authentication.', { cause: error });
  }
}
