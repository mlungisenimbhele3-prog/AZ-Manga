import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest, requireJwtAuth } from './authRoutes.ts';
import { findUserById, toPublicUser, updateUserCreatorProfile } from '../db/users.ts';
import { signAccessToken } from './jwt.ts';
import { editMyProfileSchema } from './validation.ts';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB limit
const ALLOWED_AVATAR_MIME_REGEX = /^data:image\/(jpeg|jpg|png);base64,/i;

export const usersRouter = express.Router();

function resolveAvatarExtension(dataUrl: string, fileName?: string): '.jpg' | '.png' {
  if (/^data:image\/png;base64,/i.test(dataUrl)) return '.png';
  if (/^data:image\/(jpeg|jpg);base64,/i.test(dataUrl)) return '.jpg';
  const ext = typeof fileName === 'string' ? path.extname(fileName).toLowerCase() : '';
  return ext === '.png' ? '.png' : '.jpg';
}

async function deletePreviousLocalAvatar(avatarUrl?: string | null): Promise<void> {
  if (!avatarUrl || typeof avatarUrl !== 'string') return;
  try {
    let urlPathname = avatarUrl;
    if (/^https?:\/\//i.test(avatarUrl)) {
      urlPathname = new URL(avatarUrl).pathname;
    }
    if (!urlPathname.startsWith('/avatars/')) return;
    const fileName = path.basename(urlPathname);
    if (!fileName || fileName.includes('..')) return;
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    const targetPath = path.join(avatarsDir, fileName);
    if (targetPath.startsWith(avatarsDir) && fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  } catch {
    // Non-fatal if cleanup of previous local file fails
  }
}

/**
 * PUT /api/users/me
 * Strictly updates the authenticated logged-in user's own row (derived from JWT req.authUser.id).
 * Never edits another user's profile and never modifies email.
 */
usersRouter.put(
  '/me',
  requireJwtAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const authUserId = req.authUser?.id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const bodyInput = {
      display_name:
        typeof req.body?.display_name === 'string'
          ? req.body.display_name
          : typeof req.body?.pen_name === 'string'
          ? req.body.pen_name
          : '',
      studio_name:
        typeof req.body?.studio_name === 'string' ? req.body.studio_name : '',
      bio: typeof req.body?.bio === 'string' ? req.body.bio : '',
      avatarData:
        typeof req.body?.avatarData === 'string' ? req.body.avatarData : undefined,
      avatarFileName:
        typeof req.body?.avatarFileName === 'string' ? req.body.avatarFileName : undefined,
      removeAvatar: Boolean(req.body?.removeAvatar),
    };

    const parsed = editMyProfileSchema.safeParse(bodyInput);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid profile update input.',
      });
    }

    try {
      const existing = await findUserById(authUserId);
      if (!existing) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      let nextAvatarUrl: string | null | undefined = undefined;
      let savedNewAvatarPath: string | null = null;

      if (parsed.data.removeAvatar) {
        nextAvatarUrl = null;
      } else if (parsed.data.avatarData) {
        if (!ALLOWED_AVATAR_MIME_REGEX.test(parsed.data.avatarData)) {
          return res.status(400).json({
            error: 'Profile photo must be a JPG or PNG image.',
          });
        }

        const base64Body = parsed.data.avatarData.replace(ALLOWED_AVATAR_MIME_REGEX, '');
        const imageBuffer = Buffer.from(base64Body, 'base64');

        if (imageBuffer.length === 0 || imageBuffer.length > MAX_AVATAR_BYTES) {
          return res.status(413).json({
            error: 'Profile photo must be 2MB or smaller.',
          });
        }

        const ext = resolveAvatarExtension(
          parsed.data.avatarData,
          parsed.data.avatarFileName
        );
        const safeUserFragment = authUserId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'user';
        const fileName = `avatar_${safeUserFragment}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}${ext}`;

        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
        await fs.promises.mkdir(avatarsDir, { recursive: true });
        savedNewAvatarPath = path.join(avatarsDir, fileName);
        await fs.promises.writeFile(savedNewAvatarPath, imageBuffer);

        nextAvatarUrl = `/avatars/${fileName}`;
      }

      const updated = await updateUserCreatorProfile(authUserId, {
        penName: parsed.data.display_name,
        studioName: parsed.data.studio_name,
        bio: parsed.data.bio,
        ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
      });

      if (!updated) {
        if (savedNewAvatarPath && fs.existsSync(savedNewAvatarPath)) {
          await fs.promises.unlink(savedNewAvatarPath).catch(() => undefined);
        }
        return res.status(500).json({ error: 'Failed to save profile updates.' });
      }

      if (nextAvatarUrl !== undefined && existing.avatarUrl && existing.avatarUrl !== nextAvatarUrl) {
        await deletePreviousLocalAvatar(existing.avatarUrl);
      }

      const safeUser = toPublicUser(updated);
      const accessToken = signAccessToken({
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        pen_name: safeUser.pen_name,
      });

      return res.status(200).json({
        success: true,
        accessToken,
        user: safeUser,
      });
    } catch (error: any) {
      console.error('[Users API] PUT /api/users/me error:', error);
      return res.status(500).json({
        error: error?.message || 'Unable to save profile updates right now.',
      });
    }
  }
);
