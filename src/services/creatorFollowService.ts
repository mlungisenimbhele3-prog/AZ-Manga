// =========================================================================
// AZ OVERVERSE - Creator Follow & Push Notification Service
// Allows users to follow manga authors and artists, track followed creators,
// receive instant push alerts for chapter/series releases, and toggle notification settings.
// =========================================================================

import { safeStorage } from '../utils/safeStorage';
import { isUserFollowed, toggleFollowUser } from './userProfile';
import { dispatchChapterDropPush } from './fcm';
import { toggleCreatorFollowApi } from './catalogApi';
import { Manga, Chapter } from '../types';

export interface FollowedCreator {
  id: string;
  name: string;
  role: 'Author' | 'Artist' | 'Mangaka' | 'Producer' | 'Studio';
  avatarUrl?: string;
  bio?: string;
  studioName?: string;
  followersCount: number;
  seriesCount: number;
  seriesTitles: string[];
  latestRelease?: {
    mangaId: string;
    mangaTitle: string;
    chapterNumber: number;
    chapterTitle: string;
    releaseDate: string;
  };
  followedAt: string;
  notifyOnNewChapter: boolean;
  notifyOnNewSeries: boolean;
}

const STORAGE_KEY = 'az_oververse_followed_creators';
const FOLLOWS_RESET_FLAG = 'az_oververse_follows_reset_v1';

const DEFAULT_CURATED_CREATORS: FollowedCreator[] = [];

type CreatorFollowListener = (creators: FollowedCreator[]) => void;
const listeners = new Set<CreatorFollowListener>();

export function slugifyCreatorName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCreatorId(name: string): string {
  return `creator-${slugifyCreatorName(name)}`;
}

export function getFollowedCreators(): FollowedCreator[] {
  if (safeStorage.getItem(FOLLOWS_RESET_FLAG) !== 'true') {
    safeStorage.setJSON(STORAGE_KEY, DEFAULT_CURATED_CREATORS);
    safeStorage.setItem(FOLLOWS_RESET_FLAG, 'true');
    return [];
  }
  const cached = safeStorage.getJSON<FollowedCreator[] | null>(STORAGE_KEY, null);
  if (Array.isArray(cached)) {
    return cached.map((c) => ({
      ...c,
      followersCount: Number.isFinite(c.followersCount) && c.followersCount < 10000 ? c.followersCount : 0,
    }));
  }
  safeStorage.setJSON(STORAGE_KEY, DEFAULT_CURATED_CREATORS);
  return DEFAULT_CURATED_CREATORS;
}

export function syncCreatorFollowerCountsFromDb(counts: Record<string, number>): void {
  const list = getFollowedCreators();
  if (list.length === 0) return;
  let changed = false;
  const next = list.map((c) => {
    const dbCount = counts[c.id];
    if (typeof dbCount === 'number' && dbCount !== c.followersCount) {
      changed = true;
      return { ...c, followersCount: dbCount };
    }
    return c;
  });
  if (changed) {
    persistFollowedCreators(next);
  }
}

function persistFollowedCreators(creators: FollowedCreator[]): void {
  safeStorage.setJSON(STORAGE_KEY, creators);
  listeners.forEach((listener) => {
    try {
      listener(creators);
    } catch (e) {
      console.warn('[CreatorFollowService] Error in listener:', e);
    }
  });
}

export function isFollowingCreator(nameOrId: string): boolean {
  if (!nameOrId) return false;
  const list = getFollowedCreators();
  const normalized = nameOrId.toLowerCase().trim();
  const targetId = buildCreatorId(nameOrId);

  return (
    list.some(
      (c) =>
        c.id.toLowerCase() === normalized ||
        c.id === targetId ||
        c.name.toLowerCase().trim() === normalized
    ) || isUserFollowed(targetId) || isUserFollowed(normalized)
  );
}

export async function followCreator(creatorData: {
  name: string;
  role?: 'Author' | 'Artist' | 'Mangaka' | 'Producer' | 'Studio';
  avatarUrl?: string;
  bio?: string;
  studioName?: string;
  mangaContext?: { title: string; coverImage: string; mangaId?: string };
}): Promise<boolean> {
  const list = getFollowedCreators();
  const targetId = buildCreatorId(creatorData.name);
  const exists = list.some((c) => c.id === targetId || c.name.toLowerCase().trim() === creatorData.name.toLowerCase().trim());

  if (exists) {
    return true;
  }

  const newCreator: FollowedCreator = {
    id: targetId,
    name: creatorData.name,
    role: creatorData.role || 'Author',
    avatarUrl:
      creatorData.avatarUrl ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
    bio: creatorData.bio || `Official verified ${creatorData.role || 'Author'} on AZ OVERVERSE.`,
    studioName: creatorData.studioName || 'AZ Creative Collective',
    followersCount: 0,
    seriesCount: creatorData.mangaContext ? 1 : 0,
    seriesTitles: creatorData.mangaContext ? [creatorData.mangaContext.title] : [],
    followedAt: new Date().toISOString(),
    notifyOnNewChapter: true,
    notifyOnNewSeries: true,
  };

  const updated = [newCreator, ...list];
  persistFollowedCreators(updated);

  // Persist real follow count in Postgres
  try {
    const followerKey = safeStorage.getItem('ka_africa_user_email') || 'anonymous-reader';
    const apiRes = await toggleCreatorFollowApi({
      creatorId: targetId,
      creatorName: creatorData.name,
      followerKey,
      action: 'follow',
    });
    if (apiRes.success) {
      const synced = getFollowedCreators().map((c) =>
        c.id === targetId ? { ...c, followersCount: apiRes.followersCount } : c
      );
      persistFollowedCreators(synced);
    }
  } catch {}

  // Sync with user profile service
  try {
    if (!isUserFollowed(targetId)) {
      await toggleFollowUser(targetId);
    }
  } catch (err) {
    console.warn('[CreatorFollowService] Sync with userProfile warning:', err);
  }

  return true;
}

export async function unfollowCreator(nameOrId: string): Promise<boolean> {
  const list = getFollowedCreators();
  const normalized = nameOrId.toLowerCase().trim();
  const targetId = buildCreatorId(nameOrId);

  const updated = list.filter(
    (c) =>
      c.id.toLowerCase() !== normalized &&
      c.id !== targetId &&
      c.name.toLowerCase().trim() !== normalized
  );

  persistFollowedCreators(updated);

  try {
    const followerKey = safeStorage.getItem('ka_africa_user_email') || 'anonymous-reader';
    await toggleCreatorFollowApi({
      creatorId: targetId,
      creatorName: nameOrId,
      followerKey,
      action: 'unfollow',
    });
  } catch {}

  // Sync with user profile service
  try {
    if (isUserFollowed(targetId)) {
      await toggleFollowUser(targetId);
    }
  } catch (err) {
    console.warn('[CreatorFollowService] Sync with userProfile warning:', err);
  }

  return false;
}

export async function toggleFollowCreator(creatorData: {
  name: string;
  role?: 'Author' | 'Artist' | 'Mangaka' | 'Producer' | 'Studio';
  avatarUrl?: string;
  bio?: string;
  studioName?: string;
  mangaContext?: { title: string; coverImage: string; mangaId?: string };
}): Promise<boolean> {
  const isFollowing = isFollowingCreator(creatorData.name);
  if (isFollowing) {
    await unfollowCreator(creatorData.name);
    return false;
  } else {
    await followCreator(creatorData);
    return true;
  }
}

export function updateCreatorNotificationPreferences(
  creatorId: string,
  prefs: { notifyOnNewChapter?: boolean; notifyOnNewSeries?: boolean }
): void {
  const list = getFollowedCreators();
  const updated = list.map((c) => {
    if (c.id === creatorId || c.name.toLowerCase() === creatorId.toLowerCase()) {
      return {
        ...c,
        notifyOnNewChapter: prefs.notifyOnNewChapter ?? c.notifyOnNewChapter,
        notifyOnNewSeries: prefs.notifyOnNewSeries ?? c.notifyOnNewSeries,
      };
    }
    return c;
  });
  persistFollowedCreators(updated);
}

export function subscribeToFollowedCreators(listener: CreatorFollowListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Checks if a newly published manga chapter or series is from a followed creator,
 * and if so, triggers an immediate push notification alert to the user.
 */
export async function notifyIfFollowedCreatorRelease(
  manga: Manga,
  chapter?: Chapter
): Promise<boolean> {
  const creators = getFollowedCreators();
  const authorMatch = creators.find(
    (c) =>
      c.name.toLowerCase().trim() === (manga.author || '').toLowerCase().trim() &&
      c.notifyOnNewChapter
  );
  const artistMatch = creators.find(
    (c) =>
      c.name.toLowerCase().trim() === (manga.artist || '').toLowerCase().trim() &&
      c.notifyOnNewChapter
  );

  const matched = authorMatch || artistMatch;
  if (!matched) return false;

  const targetChapter: Chapter = chapter || {
    id: `ch-${Date.now()}`,
    mangaId: manga.id,
    number: manga.chapters?.length ? manga.chapters[manga.chapters.length - 1].number : 1,
    title: manga.chapters?.length ? manga.chapters[manga.chapters.length - 1].title : 'New Release',
    releaseDate: 'Just Now',
    pageCount: 24,
    accessType: 'free',
    pages: [],
    likesCount: 0,
    commentsCount: 0,
  };

  await dispatchChapterDropPush(manga, targetChapter, {
    isFromFollowedCreator: true,
    creatorName: matched.name,
    creatorRole: matched.role,
  });

  return true;
}
