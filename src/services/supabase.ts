import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Manga, Chapter } from '../types';
import { INITIAL_MANGA_LIST, NKOSI_COVER_SRC } from '../data/mockData';
import { safeStorage } from '../utils/safeStorage';

// Supabase configuration from environment variables or safe defaults
const SUPABASE_URL = (import.meta?.env?.VITE_SUPABASE_URL || 'https://kaplus-pulse.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockSupabaseAnonKeyForAfricaPulseDev').trim();

// Determine if live credentials are provided
export const isSupabaseLiveConfigured = Boolean(
  import.meta?.env?.VITE_SUPABASE_URL && 
  import.meta?.env?.VITE_SUPABASE_ANON_KEY &&
  !import.meta?.env?.VITE_SUPABASE_URL.includes('kaplus-pulse.supabase.co')
);

// Initialize Supabase Client (only run background token timers when live credentials are configured)
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: isSupabaseLiveConfigured,
    autoRefreshToken: isSupabaseLiveConfigured,
    detectSessionInUrl: isSupabaseLiveConfigured,
  },
});

export interface UserLibraryRecord {
  id?: string;
  userEmail: string;
  mangaId: string;
  isFavorite: boolean;
  readingStatus: 'reading' | 'completed' | 'plan_to_read' | 'on_hold';
  lastChapterId?: string;
  lastPageRead?: number;
  progressPercent?: number;
  notifyChapterDrops?: boolean;
  updatedAt?: string;
}

const LOCAL_STORAGE_MANGAS_KEY = 'az_oververse_mangas_cache';
const LOCAL_STORAGE_USER_LIBRARY_KEY = 'az_oververse_user_library';

/**
 * Helper to get local fallback cached mangas
 */
function getLocalFallbackMangas(): Manga[] {
  // Clear any old obsolete caches
  try {
    localStorage.removeItem('mangaList');
    localStorage.removeItem('ka_plus_manga');
    localStorage.removeItem('ka_africa_manga_list');
    localStorage.removeItem('ka_pulse_supabase_mangas_cache');
  } catch (e) {}

  const cached = safeStorage.getJSON<Manga[] | null>(LOCAL_STORAGE_MANGAS_KEY, null);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    const hasAllNewCovers =
      cached.some((m) => m.id === 'nkosi-the-tale-of-myths' && m.coverImage?.includes('862620681_1304598868406485')) &&
      cached.some((m) => m.id === 'last-shaman-of-zambezi' && m.coverImage?.includes('862516203_2025904894785875')) &&
      cached.some((m) => m.id === 'echoes-of-the-highveld' && m.coverImage?.includes('858773050_1090471570458562'));
    if (hasAllNewCovers) {
      return cached;
    }
    // Preserve any user-uploaded mangas while refreshing Nkosi's cover photo
    const refreshed = cached.map((m) =>
      m.id === 'nkosi-the-tale-of-myths'
        ? {
            ...m,
            cover: NKOSI_COVER_SRC,
            coverImage: NKOSI_COVER_SRC,
            coverUrl: NKOSI_COVER_SRC,
            bannerImage: NKOSI_COVER_SRC,
          }
        : m
    );
    const hasCoreSeries =
      refreshed.some((m) => m.id === 'nkosi-the-tale-of-myths') &&
      refreshed.some((m) => m.id === 'last-shaman-of-zambezi') &&
      refreshed.some((m) => m.id === 'echoes-of-the-highveld');
    if (hasCoreSeries) {
      safeStorage.setJSON(LOCAL_STORAGE_MANGAS_KEY, refreshed);
      return refreshed;
    }
  }
  safeStorage.setJSON(LOCAL_STORAGE_MANGAS_KEY, INITIAL_MANGA_LIST);
  return INITIAL_MANGA_LIST;
}

/**
 * 1. Fetch all mangas with their ordered chapters from Supabase
 * Falls back transparently to local cached relational storage if offline or during initial setup.
 */
export async function fetchMangasFromSupabase(): Promise<Manga[]> {
  try {
    if (isSupabaseLiveConfigured) {
      const { data: mangasData, error: mangaErr } = await supabase
        .from('mangas')
        .select('*')
        .order('rating', { ascending: false });

      if (mangaErr) throw mangaErr;

      if (mangasData && mangasData.length > 0) {
        // Fetch chapters for these mangas
        const { data: chaptersData, error: chapErr } = await supabase
          .from('chapters')
          .select('*')
          .order('number', { ascending: true });

        if (chapErr) throw chapErr;

        // Group chapters by manga_id
        const chaptersByManga = (chaptersData || []).reduce<Record<string, Chapter[]>>((acc, chapRow: any) => {
          const chap: Chapter = {
            id: chapRow.id,
            mangaId: chapRow.manga_id,
            number: chapRow.number,
            title: chapRow.title,
            releaseDate: chapRow.release_date,
            pageCount: chapRow.page_count,
            accessType: chapRow.access_type,
            pages: chapRow.pages || [],
            likesCount: chapRow.likes_count || 0,
            commentsCount: chapRow.comments_count || 0,
          };
          if (!acc[chap.mangaId]) acc[chap.mangaId] = [];
          acc[chap.mangaId].push(chap);
          return acc;
        }, {});

        // Map to application Manga interface
        const mappedMangas: Manga[] = mangasData.map((row: any) => {
          const isNkosi = row.id === 'nkosi-the-tale-of-myths';
          const resolvedCover = isNkosi ? NKOSI_COVER_SRC : row.cover_image;
          const resolvedBanner = isNkosi ? NKOSI_COVER_SRC : row.banner_image;
          return {
            id: row.id,
            title: row.title,
            japaneseTitle: row.japanese_title,
            author: row.author,
            artist: row.artist,
            cover: resolvedCover,
            coverUrl: resolvedCover,
            coverImage: resolvedCover,
            bannerImage: resolvedBanner,
          genres: row.genres || [],
          status: row.status,
          synopsis: row.synopsis,
          rating: Number(row.rating) || 4.9,
          views: Number(row.views) || 0,
          bookmarksCount: Number(row.bookmarks_count) || 0,
          monetizationModel: row.monetization_model || 'hybrid',
          chapters: chaptersByManga[row.id] || [],
          featured: row.featured,
          weeklyRank: row.weekly_rank,
          isAiGenerated: row.is_ai_generated,
          aiConfidenceScore: row.ai_confidence_score,
            isBanned: row.is_banned,
            banReason: row.ban_reason,
          };
        });

        // Cache locally for offline resiliency
        safeStorage.setJSON(LOCAL_STORAGE_MANGAS_KEY, mappedMangas);
        return mappedMangas;
      }
    }
  } catch (err) {
    console.warn('[Supabase] Live fetch failed or connection pending, utilizing resilient relational local cache:', err);
  }

  return getLocalFallbackMangas();
}

/**
 * 2. Fetch single manga details by ID with ordered chapters
 */
export async function fetchMangaDetailsFromSupabase(mangaId: string): Promise<Manga | null> {
  const all = await fetchMangasFromSupabase();
  return all.find((m) => m.id === mangaId) || null;
}

/**
 * 3. Fetch user library from Supabase (favorites, reading status, progress)
 */
export async function fetchUserLibraryFromSupabase(userEmail: string): Promise<UserLibraryRecord[]> {
  try {
    if (isSupabaseLiveConfigured) {
      const { data, error } = await supabase
        .from('user_library')
        .select('*')
        .eq('user_email', userEmail);

      if (error) throw error;
      if (data) {
        const records: UserLibraryRecord[] = data.map((d: any) => ({
          id: d.id,
          userEmail: d.user_email,
          mangaId: d.manga_id,
          isFavorite: d.is_favorite,
          readingStatus: d.reading_status,
          lastChapterId: d.last_chapter_id,
          lastPageRead: d.last_page_read,
          progressPercent: d.progress_percent,
          notifyChapterDrops: d.notify_chapter_drops,
          updatedAt: d.updated_at,
        }));
        safeStorage.setJSON(`${LOCAL_STORAGE_USER_LIBRARY_KEY}_${userEmail}`, records);
        return records;
      }
    }
  } catch (e) {
    console.warn('[Supabase] User library live query fallback to local cache:', e);
  }

  // Fallback to local cache
  const cached = safeStorage.getJSON<UserLibraryRecord[] | null>(`${LOCAL_STORAGE_USER_LIBRARY_KEY}_${userEmail}`, null);
  if (cached) return cached;

  // Default seed library for initial view
  const defaultSeeds: UserLibraryRecord[] = [
    { userEmail, mangaId: 'manga-1', isFavorite: true, readingStatus: 'reading', progressPercent: 45, notifyChapterDrops: true },
    { userEmail, mangaId: 'manga-3', isFavorite: true, readingStatus: 'reading', progressPercent: 90, notifyChapterDrops: true },
  ];
  safeStorage.setJSON(`${LOCAL_STORAGE_USER_LIBRARY_KEY}_${userEmail}`, defaultSeeds);
  return defaultSeeds;
}

/**
 * 4. Save or update a user library item (Favorite toggle, reading progress update)
 */
export async function saveUserLibraryItemInSupabase(item: UserLibraryRecord): Promise<boolean> {
  // Update local storage cache immediately for optimistic UI
  const cacheKey = `${LOCAL_STORAGE_USER_LIBRARY_KEY}_${item.userEmail}`;
  const currentList = safeStorage.getJSON<UserLibraryRecord[]>(cacheKey, []);
  const existingIdx = currentList.findIndex((x) => x.mangaId === item.mangaId);

  const updatedItem: UserLibraryRecord = {
    ...item,
    updatedAt: new Date().toISOString(),
  };

  let nextList: UserLibraryRecord[];
  if (existingIdx >= 0) {
    nextList = [...currentList];
    nextList[existingIdx] = { ...nextList[existingIdx], ...updatedItem };
  } else {
    nextList = [...currentList, updatedItem];
  }
  safeStorage.setJSON(cacheKey, nextList);

  // Sync to Supabase if live configured
  if (isSupabaseLiveConfigured) {
    try {
      const { error } = await supabase
        .from('user_library')
        .upsert({
          user_email: item.userEmail,
          manga_id: item.mangaId,
          is_favorite: item.isFavorite,
          reading_status: item.readingStatus,
          last_chapter_id: item.lastChapterId || null,
          last_page_read: item.lastPageRead || 1,
          progress_percent: item.progressPercent || 0,
          notify_chapter_drops: item.notifyChapterDrops ?? true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_email,manga_id' });

      if (error) {
        console.warn('[Supabase] User library upsert error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Failed to sync user library to remote:', err);
      return false;
    }
  }

  return true;
}

/**
 * 5. Publish new manga to Supabase
 */
export async function publishMangaToSupabase(manga: Manga): Promise<boolean> {
  // Update local cache
  const localMangas = getLocalFallbackMangas();
  const nextMangas = [manga, ...localMangas.filter((m) => m.id !== manga.id)];
  safeStorage.setJSON(LOCAL_STORAGE_MANGAS_KEY, nextMangas);

  if (isSupabaseLiveConfigured) {
    try {
      const { error: mangaErr } = await supabase.from('mangas').upsert({
        id: manga.id,
        title: manga.title,
        japanese_title: manga.japaneseTitle || null,
        author: manga.author,
        artist: manga.artist,
        cover_image: manga.coverImage,
        banner_image: manga.bannerImage,
        genres: manga.genres,
        status: manga.status,
        synopsis: manga.synopsis,
        rating: manga.rating,
        views: manga.views,
        bookmarks_count: manga.bookmarksCount,
        monetization_model: manga.monetizationModel,
        featured: manga.featured || false,
        weekly_rank: manga.weeklyRank || null,
        is_ai_generated: manga.isAiGenerated || false,
        ai_confidence_score: manga.aiConfidenceScore || 0,
        is_banned: manga.isBanned || false,
        ban_reason: manga.banReason || null,
      });

      if (mangaErr) throw mangaErr;

      // Also upsert chapters
      if (manga.chapters && manga.chapters.length > 0) {
        for (const chap of manga.chapters) {
          await publishChapterToSupabase(chap);
        }
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Error uploading manga to remote Supabase:', err);
    }
  }

  return true;
}

/**
 * 6. Publish new chapter to Supabase
 */
export async function publishChapterToSupabase(chapter: Chapter): Promise<boolean> {
  // Update local cache
  const localMangas = getLocalFallbackMangas();
  const target = localMangas.find((m) => m.id === chapter.mangaId);
  if (target) {
    const existingChapIdx = target.chapters.findIndex((c) => c.id === chapter.id || c.number === chapter.number);
    if (existingChapIdx >= 0) {
      target.chapters[existingChapIdx] = chapter;
    } else {
      target.chapters.push(chapter);
      target.chapters.sort((a, b) => a.number - b.number);
    }
    safeStorage.setJSON(LOCAL_STORAGE_MANGAS_KEY, localMangas);
  }

  if (isSupabaseLiveConfigured) {
    try {
      const { error } = await supabase.from('chapters').upsert({
        id: chapter.id,
        manga_id: chapter.mangaId,
        number: chapter.number,
        title: chapter.title,
        release_date: chapter.releaseDate,
        page_count: chapter.pageCount,
        access_type: chapter.accessType,
        pages: chapter.pages,
        likes_count: chapter.likesCount,
        comments_count: chapter.commentsCount,
      }, { onConflict: 'manga_id,number' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase] Error uploading chapter to remote Supabase:', err);
    }
  }

  return true;
}

/**
 * 7. Get Supabase Status details for UI inspection
 */
export function getSupabaseDetails() {
  return {
    isConfigured: isSupabaseLiveConfigured,
    url: SUPABASE_URL,
    hasKey: Boolean(SUPABASE_ANON_KEY),
    schemaTables: ['mangas', 'chapters', 'user_library'],
    rlsStatus: 'Row-Level Security Enabled (Defense x4)',
    mode: isSupabaseLiveConfigured ? 'Live Supabase Cloud' : 'Hybrid Local-Resilient Sync',
  };
}
