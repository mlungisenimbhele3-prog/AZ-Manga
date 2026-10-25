import { Manga } from '../types';
import { safeStorage } from '../utils/safeStorage';
import {
  UserTasteProfile,
  ReadingHistoryEntry,
  RecommendationResult,
  RecommendationAlgorithmMode,
  TASTE_PRESETS,
  getUserTasteProfile,
  saveUserTasteProfile,
  toggleUserLikedGenre,
  recordReadingHistoryEvent,
  clearReadingHistory,
  applyTastePreset,
  extractUniqueGenres,
  getRecommendedManga,
  getSimilarManga,
} from './recommendationEngine';

export type {
  UserTasteProfile,
  ReadingHistoryEntry,
  RecommendationResult,
  RecommendationAlgorithmMode,
};

export {
  TASTE_PRESETS,
  getUserTasteProfile,
  saveUserTasteProfile,
  toggleUserLikedGenre,
  recordReadingHistoryEvent,
  clearReadingHistory,
  applyTastePreset,
  extractUniqueGenres,
  getRecommendedManga,
  getSimilarManga,
};

export interface TasteProfileInsights {
  favoriteGenres: string[];
  inferredHistoryGenres: string[];
  combinedActiveGenres: string[];
  totalHistoryTitles: number;
  totalReadSessions: number;
  recentReadTitles: string[];
  hasPersonalizedSignals: boolean;
}

/**
 * Hydrates and synchronizes the user's taste profile with active favorites
 * and any persisted last-read progress so recommendations reflect real activity.
 */
export function getHydratedUserTasteProfile(
  catalog: Manga[] = [],
  favoriteIds: string[] = []
): UserTasteProfile {
  const current = getUserTasteProfile();
  let changed = false;

  const validCatalogIds = new Set(
    catalog.filter((m) => m && m.id !== 'placeholder').map((m) => m.id)
  );

  // Sync valid favorite IDs into profile.favoriteMangaIds
  if (favoriteIds.length > 0) {
    const filteredFavs =
      validCatalogIds.size > 0
        ? favoriteIds.filter((id) => validCatalogIds.has(id))
        : favoriteIds;
    const prevFavKey = (current.favoriteMangaIds || []).slice().sort().join('|');
    const nextFavKey = filteredFavs.slice().sort().join('|');
    if (prevFavKey !== nextFavKey) {
      current.favoriteMangaIds = filteredFavs;
      changed = true;
    }
  }

  // Hydrate from last-read banner progress if not yet in readingHistory
  const lastRead = safeStorage.getJSON<{
    mangaId?: string;
    mangaTitle?: string;
    chapterNumber?: number;
    timestamp?: string;
  } | null>('ka_pulse_last_read', null);

  if (
    lastRead?.mangaId &&
    lastRead.mangaTitle &&
    (validCatalogIds.size === 0 || validCatalogIds.has(lastRead.mangaId)) &&
    !current.readingHistory.some((h) => h.mangaId === lastRead.mangaId)
  ) {
    current.readingHistory.unshift({
      mangaId: lastRead.mangaId,
      mangaTitle: lastRead.mangaTitle,
      lastChapterNumber: lastRead.chapterNumber || 1,
      lastReadAt: lastRead.timestamp || new Date().toISOString(),
      readCount: 1,
    });
    changed = true;
  }

  if (changed) {
    saveUserTasteProfile(current);
  }

  return {
    ...current,
    likedGenres: [...(current.likedGenres || [])],
    readingHistory: [...(current.readingHistory || [])],
    favoriteMangaIds: [...(current.favoriteMangaIds || [])],
    dislikedMangaIds: [...(current.dislikedMangaIds || [])],
  };
}

/**
 * Synchronizes the user's favorited manga list into the persisted taste profile.
 */
export function syncFavoritesWithTasteProfile(
  favoriteIds: string[],
  catalog: Manga[] = []
): UserTasteProfile {
  const profile = getUserTasteProfile();
  const validCatalogIds = new Set(
    catalog.filter((m) => m && m.id !== 'placeholder').map((m) => m.id)
  );
  profile.favoriteMangaIds =
    validCatalogIds.size > 0
      ? favoriteIds.filter((id) => validCatalogIds.has(id))
      : [...favoriteIds];
  saveUserTasteProfile(profile);
  return profile;
}

/**
 * Removes a single series from the user's reading history.
 */
export function removeReadingHistoryEntry(mangaId: string): UserTasteProfile {
  const profile = getUserTasteProfile();
  profile.readingHistory = profile.readingHistory.filter(
    (entry) => entry.mangaId !== mangaId
  );
  saveUserTasteProfile(profile);
  return profile;
}

/**
 * Resets favorite genres to starter defaults or selects a custom list.
 */
export function setFavoriteGenres(genres: string[]): UserTasteProfile {
  const profile = getUserTasteProfile();
  profile.likedGenres = Array.from(new Set(genres.map((g) => g.trim()).filter(Boolean)));
  saveUserTasteProfile(profile);
  return profile;
}

/**
 * Summarizes the user's active taste signals (favorite genres + reading history)
 * for display in the "Recommended for You" header and insights bar.
 */
export function getTasteProfileInsights(
  profile: UserTasteProfile,
  mangaList: Manga[]
): TasteProfileInsights {
  const genreFrequency = new Map<string, number>();

  for (const entry of profile.readingHistory) {
    const manga = mangaList.find((m) => m.id === entry.mangaId);
    if (!manga) continue;
    for (const genre of manga.genres || []) {
      const weight = Math.max(1, entry.readCount || 1);
      genreFrequency.set(genre, (genreFrequency.get(genre) || 0) + weight);
    }
  }

  const inferredHistoryGenres = Array.from(genreFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)
    .slice(0, 4);

  const combinedActiveGenres = Array.from(
    new Set([...(profile.likedGenres || []), ...inferredHistoryGenres])
  );

  const totalReadSessions = profile.readingHistory.reduce(
    (sum, item) => sum + (item.readCount || 1),
    0
  );

  const recentReadTitles = profile.readingHistory
    .slice(0, 3)
    .map((item) => item.mangaTitle);

  return {
    favoriteGenres: profile.likedGenres || [],
    inferredHistoryGenres,
    combinedActiveGenres,
    totalHistoryTitles: profile.readingHistory.length,
    totalReadSessions,
    recentReadTitles,
    hasPersonalizedSignals:
      (profile.likedGenres?.length || 0) > 0 || profile.readingHistory.length > 0,
  };
}

/**
 * Generates personalized "Recommended for You" results combining the user's
 * favorite genres and reading history (plus optional algorithm focus & unread filter).
 */
export function getRecommendedForYou(
  mangaList: Manga[],
  profile: UserTasteProfile,
  options: {
    mode?: RecommendationAlgorithmMode;
    excludeRead?: boolean;
    limit?: number;
  } = {}
): RecommendationResult[] {
  const { mode = 'hybrid', excludeRead = false, limit = 6 } = options;

  // Enrich effective genres with top genres inferred from reading history when in hybrid mode
  const insights = getTasteProfileInsights(profile, mangaList);
  const effectiveProfile: UserTasteProfile =
    mode === 'hybrid' && profile.likedGenres.length === 0 && insights.inferredHistoryGenres.length > 0
      ? {
          ...profile,
          likedGenres: insights.inferredHistoryGenres,
        }
      : profile;

  return getRecommendedManga(mangaList, {
    mode,
    limit,
    excludeRead,
    customTasteProfile: effectiveProfile,
  });
}
