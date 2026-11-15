import { safeStorage } from '../utils/safeStorage';
import { getInMemoryAccessToken } from './oververseAuth';
import type { Chapter, Manga, ReleaseDay } from '../types';

export const SWR_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MANGA_CACHE_PREFIX = 'az_swr_manga_v1_';
const CHAPTERS_CACHE_PREFIX = 'az_swr_chapters_v1_';

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

export interface UpcomingScheduleItem {
  mangaId: string;
  title: string;
  releaseDay: ReleaseDay;
  scheduledFor: string | null;
  chapterNumber: number | null;
  type: 'original' | 'backdrop';
}

export interface PaginatedMangaResponse {
  mangas: Manga[];
  upcomingSchedules: UpcomingScheduleItem[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedChaptersResponse {
  chapters: Chapter[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

const memoryCache = new Map<string, CacheEnvelope<any>>();
const inflightRequests = new Map<string, Promise<any>>();

function readCache<T>(key: string): { value: T | null; isFresh: boolean } {
  const mem = memoryCache.get(key);
  if (mem) {
    return {
      value: mem.data as T,
      isFresh: Date.now() - mem.timestamp < SWR_CACHE_TTL_MS,
    };
  }
  const stored = safeStorage.getJSON<CacheEnvelope<T> | null>(key, null);
  if (stored && typeof stored.timestamp === 'number' && stored.data) {
    memoryCache.set(key, stored);
    return {
      value: stored.data,
      isFresh: Date.now() - stored.timestamp < SWR_CACHE_TTL_MS,
    };
  }
  return { value: null, isFresh: false };
}

function writeCache<T>(key: string, data: T): void {
  const envelope: CacheEnvelope<T> = {
    timestamp: Date.now(),
    data,
  };
  memoryCache.set(key, envelope);
  safeStorage.setJSON(key, envelope);
}

export function invalidateLayeredCaches(): void {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(MANGA_CACHE_PREFIX) || key.startsWith(CHAPTERS_CACHE_PREFIX)) {
      memoryCache.delete(key);
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith(MANGA_CACHE_PREFIX) || k.startsWith(CHAPTERS_CACHE_PREFIX))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
  }
}

async function fetchJsonWithSWR<T>(options: {
  cacheKey: string;
  url: string;
  forceRefresh?: boolean;
  onBackgroundUpdate?: (fresh: T) => void;
}): Promise<{ data: T | null; fromCache: boolean; error: string | null }> {
  const { cacheKey, url, forceRefresh = false, onBackgroundUpdate } = options;
  const cached = readCache<T>(cacheKey);

  const performNetworkFetch = async (): Promise<T> => {
    const existing = inflightRequests.get(cacheKey);
    if (existing) return existing;

    const req = (async () => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || "Couldn't load. Tap to retry.");
      }
      const json = (await res.json()) as T;
      writeCache(cacheKey, json);
      return json;
    })();

    inflightRequests.set(cacheKey, req);
    try {
      return await req;
    } finally {
      inflightRequests.delete(cacheKey);
    }
  };

  if (cached.value && !forceRefresh) {
    if (!cached.isFresh) {
      // Stale-while-revalidate: serve stale immediately, refresh silently in background
      void performNetworkFetch()
        .then((fresh) => {
          onBackgroundUpdate?.(fresh);
        })
        .catch(() => {});
    }
    return { data: cached.value, fromCache: true, error: null };
  }

  try {
    const fresh = await performNetworkFetch();
    return { data: fresh, fromCache: false, error: null };
  } catch (err: any) {
    return {
      data: cached.value,
      fromCache: Boolean(cached.value),
      error: err?.message || "Couldn't load. Tap to retry.",
    };
  }
}

export async function fetchPaginatedMangasSWR(params?: {
  limit?: number;
  offset?: number;
  type?: 'original' | 'backdrop';
  releaseDay?: ReleaseDay;
  forceRefresh?: boolean;
  onBackgroundUpdate?: (fresh: PaginatedMangaResponse) => void;
}): Promise<{ data: PaginatedMangaResponse | null; fromCache: boolean; error: string | null }> {
  const limit = Math.max(1, Math.min(50, params?.limit ?? 20));
  const offset = Math.max(0, params?.offset ?? 0);
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (params?.type) query.set('type', params.type);
  if (params?.releaseDay) query.set('release_day', params.releaseDay);

  const cacheKey = `${MANGA_CACHE_PREFIX}${limit}_${offset}_${params?.type || 'all'}_${params?.releaseDay || 'all'}`;
  return fetchJsonWithSWR<PaginatedMangaResponse>({
    cacheKey,
    url: `/api/manga?${query.toString()}`,
    forceRefresh: params?.forceRefresh,
    onBackgroundUpdate: params?.onBackgroundUpdate,
  });
}

export async function fetchPaginatedChaptersSWR(params: {
  mangaId: string;
  limit?: number;
  offset?: number;
  forceRefresh?: boolean;
  onBackgroundUpdate?: (fresh: PaginatedChaptersResponse) => void;
}): Promise<{ data: PaginatedChaptersResponse | null; fromCache: boolean; error: string | null }> {
  const limit = Math.max(1, Math.min(50, params.limit ?? 20));
  const offset = Math.max(0, params.offset ?? 0);
  const query = new URLSearchParams({
    mangaId: params.mangaId,
    limit: String(limit),
    offset: String(offset),
  });

  const cacheKey = `${CHAPTERS_CACHE_PREFIX}${params.mangaId}_${limit}_${offset}`;
  return fetchJsonWithSWR<PaginatedChaptersResponse>({
    cacheKey,
    url: `/api/chapters?${query.toString()}`,
    forceRefresh: params.forceRefresh,
    onBackgroundUpdate: params.onBackgroundUpdate,
  });
}

/**
 * Queues a lightweight view event in `page_views` (POST /api/views).
 */
export function trackViewViaBeacon(mangaId: string, chapterId: string): void {
  if (!mangaId || !chapterId || chapterId.includes('__preview')) return;
  const payload = JSON.stringify({ mangaId, chapterId });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/views', blob)) {
        return;
      }
    } catch {
      // fall back to keepalive fetch
    }
  }

  void fetch('/api/views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export async function createMangaViaApi(input: {
  id?: string;
  title: string;
  synopsis: string;
  coverUrl: string;
  genres: string[];
  ageRating?: string;
  language?: string;
  type: 'original' | 'backdrop';
  releaseDay: ReleaseDay;
  status: 'Draft' | 'Coming Soon' | 'Live';
  approvalStatus?: string;
}): Promise<{ success: boolean; manga?: any; error?: string }> {
  const accessToken = getInMemoryAccessToken();
  const res = await fetch('/api/manga', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || 'Failed to save series.' };
  }
  invalidateLayeredCaches();
  return { success: true, manga: data.manga };
}

export async function createChapterViaApi(input: {
  id?: string;
  mangaId: string;
  number: number;
  title: string;
  panels: Array<{ id: string; pageNumber: number; imageUrl: string }>;
  publishMode: 'live' | 'schedule' | 'draft';
  scheduledFor?: string | null;
  releaseDate?: string;
  releaseDay?: ReleaseDay;
}): Promise<{ success: boolean; status?: number; chapter?: any; error?: string }> {
  const accessToken = getInMemoryAccessToken();
  const res = await fetch('/api/chapters', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      error: data?.error || 'Failed to publish chapter.',
    };
  }
  invalidateLayeredCaches();
  return { success: true, status: res.status, chapter: data.chapter };
}

export async function fetchCommentsViaApi(params: {
  chapterId: string;
  limit?: number;
  offset?: number;
}): Promise<{ comments: any[]; total: number; hasMore: boolean }> {
  const limit = Math.max(1, Math.min(50, params.limit ?? 20));
  const offset = Math.max(0, params.offset ?? 0);
  const query = new URLSearchParams({
    chapterId: params.chapterId,
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/comments?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error("Couldn't load comments.");
  }
  return await res.json();
}

export async function postCommentViaApi(input: {
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
}): Promise<{ success: boolean; comment?: any; error?: string }> {
  const accessToken = getInMemoryAccessToken();
  const res = await fetch('/api/comments', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || 'Failed to post comment.' };
  }
  return { success: true, comment: data.comment };
}

export async function fetchFollowedMangaViaApi(): Promise<string[]> {
  const accessToken = getInMemoryAccessToken();
  if (!accessToken) return [];
  try {
    const res = await fetch('/api/users/follow-manga', {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.followedManga) ? data.followedManga : [];
  } catch {
    return [];
  }
}

export async function toggleFollowMangaViaApi(
  mangaId: string,
  action: 'follow' | 'unfollow' | 'toggle' = 'toggle'
): Promise<{ followedManga: string[]; isFollowing: boolean } | null> {
  const accessToken = getInMemoryAccessToken();
  if (!accessToken) return null;
  try {
    const res = await fetch('/api/users/follow-manga', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ mangaId, action }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
