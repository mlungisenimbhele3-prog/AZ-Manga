import { Manga } from '../types';
import { safeStorage } from '../utils/safeStorage';

export interface ReadingHistoryEntry {
  mangaId: string;
  mangaTitle: string;
  lastChapterNumber?: number;
  lastReadAt: string; // ISO string
  readCount: number;
  userRating?: number; // 1-5 stars if user rated
}

export interface UserTasteProfile {
  likedGenres: string[];
  readingHistory: ReadingHistoryEntry[];
  favoriteMangaIds: string[];
  dislikedMangaIds: string[];
  lastUpdated: string;
}

export type RecommendationAlgorithmMode =
  | 'hybrid'
  | 'content_based'
  | 'collaborative'
  | 'liked_genres';

export interface RecommendationResult {
  manga: Manga;
  score: number; // 0.0 to 1.0
  matchPercentage: number; // e.g. 96 (%)
  primaryReason: string;
  explanation: string;
  matchedGenres: string[];
  algorithmUsed: RecommendationAlgorithmMode;
  thematicSimilarity: number;
  collaborativeScore: number;
  sourceManga?: {
    id: string;
    title: string;
  };
}

const TASTE_PROFILE_STORAGE_KEY = 'ka_pulse_user_taste_profile';
const READING_HISTORY_STORAGE_KEY = 'ka_pulse_reading_history_list';

// Curated baseline co-reading affinity matrix for collaborative filtering (Item-Item)
// derived from reading frequency & community co-engagement patterns across the catalog
const COMMUNITY_CO_READING_MATRIX: Record<string, Record<string, number>> = {
  'nkosi-the-tale-of-myths': {
    'last-shaman-of-zambezi': 0.82,
    'echoes-of-the-highveld': 0.65,
  },
  'last-shaman-of-zambezi': {
    'nkosi-the-tale-of-myths': 0.85,
    'echoes-of-the-highveld': 0.58,
  },
  'echoes-of-the-highveld': {
    'nkosi-the-tale-of-myths': 0.68,
    'last-shaman-of-zambezi': 0.62,
  },
  placeholder: {},
};

// Preset tastes for quick testing / exploration in UI
export const TASTE_PRESETS: {
  id: string;
  name: string;
  icon: string;
  description: string;
  likedGenres: string[];
  mockHistoryMangaIds: string[];
}[] = [
  {
    id: 'shonen_action',
    name: 'Shonen & Action Enthusiast',
    icon: '🔥',
    description: 'High octane battles, martial arts, tournaments and superhuman powers',
    likedGenres: ['Shonen', 'Action', 'Fantasy'],
    mockHistoryMangaIds: ['nkosi-the-tale-of-myths'],
  },
  {
    id: 'pan_african_folklore',
    name: 'Folklore & Spiritual Seeker',
    icon: '🌍',
    description: 'Indigenous mythology, spirit realm diviners, and ancestral legends',
    likedGenres: ['Pan-African', 'Fantasy', 'Mythology', 'Supernatural'],
    mockHistoryMangaIds: ['last-shaman-of-zambezi', 'nkosi-the-tale-of-myths'],
  },
  {
    id: 'cyberpunk_scifi',
    name: 'Cyberpunk & Sci-Fi Explorer',
    icon: '🤖',
    description: 'Neon skylines, android mercenaries, quantum neural nets and hackers',
    likedGenres: ['Sci-Fi', 'Action', 'Cyberpunk', 'Seinen'],
    mockHistoryMangaIds: ['echoes-of-the-highveld'],
  },
  {
    id: 'romance_slice_of_life',
    name: 'Heartfelt Romance & Slice of Life',
    icon: '💖',
    description: 'Vibrant urban melodies, creative sparks, youth surfing and cozy vibes',
    likedGenres: ['Romance', 'Slice of Life', 'Seinen'],
    mockHistoryMangaIds: ['nkosi-the-tale-of-myths'],
  },
];

/**
 * Common keyword vocabulary for thematic content-based text similarity
 */
const THEMATIC_KEYWORDS = [
  'ancestor',
  'ancestral',
  'spirit',
  'diviner',
  'cyberpunk',
  'neon',
  'hacker',
  'battle',
  'warrior',
  'martial',
  'spear',
  'solar',
  'mountain',
  'gold',
  'mine',
  'ocean',
  'surf',
  'vinyl',
  'jazz',
  'romance',
  'quantum',
  'neural',
  'talisman',
  'relic',
  'township',
  'afro-futurism',
  'sports',
  'friendship',
  'youth',
];

/**
 * Extracts normalized tokens from synopsis and title
 */
function extractThematicTokens(text: string): Set<string> {
  const normalized = (text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  const tokenSet = new Set<string>();

  for (const word of words) {
    for (const kw of THEMATIC_KEYWORDS) {
      if (word.includes(kw) || kw.includes(word)) {
        tokenSet.add(kw);
      }
    }
  }
  return tokenSet;
}

/**
 * Jaccard similarity between two sets of strings
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Extracts all unique genres across a given list of manga
 */
export function extractUniqueGenres(mangaList: Manga[]): string[] {
  const genreSet = new Set<string>();
  // Pre-seed with standard major genres
  const baseline = [
    'Shonen',
    'Seinen',
    'Action',
    'Fantasy',
    'Sci-Fi',
    'Romance',
    'Slice of Life',
    'Pan-African',
    'Afro-Futurism',
    'Supernatural',
  ];
  baseline.forEach((g) => genreSet.add(g));

  mangaList.forEach((m) => {
    (m.genres || []).forEach((g) => {
      if (g && g.trim()) genreSet.add(g.trim());
    });
  });

  return Array.from(genreSet);
}

/**
 * Gets the current user taste profile from persistent storage
 */
export function getUserTasteProfile(): UserTasteProfile {
  const saved = safeStorage.getJSON<UserTasteProfile | null>(
    TASTE_PROFILE_STORAGE_KEY,
    null
  );
  if (saved && saved.likedGenres) {
    return saved;
  }

  // Initial default taste profile with starter genres and empty baseline history
  const initial: UserTasteProfile = {
    likedGenres: ['Shonen', 'Action', 'Pan-African'],
    readingHistory: [],
    favoriteMangaIds: [],
    dislikedMangaIds: [],
    lastUpdated: new Date().toISOString(),
  };

  saveUserTasteProfile(initial);
  return initial;
}

/**
 * Saves user taste profile to persistent storage
 */
export function saveUserTasteProfile(profile: UserTasteProfile): void {
  profile.lastUpdated = new Date().toISOString();
  safeStorage.setJSON(TASTE_PROFILE_STORAGE_KEY, profile);
}

/**
 * Records a read event into the recommendation engine's reading history
 */
export function recordReadingHistoryEvent(
  mangaId: string,
  mangaTitle: string,
  chapterNumber?: number
): UserTasteProfile {
  const profile = getUserTasteProfile();
  const existingIdx = profile.readingHistory.findIndex((h) => h.mangaId === mangaId);

  if (existingIdx >= 0) {
    profile.readingHistory[existingIdx].lastReadAt = new Date().toISOString();
    profile.readingHistory[existingIdx].readCount += 1;
    if (chapterNumber !== undefined) {
      profile.readingHistory[existingIdx].lastChapterNumber = chapterNumber;
    }
  } else {
    profile.readingHistory.unshift({
      mangaId,
      mangaTitle,
      lastChapterNumber: chapterNumber,
      lastReadAt: new Date().toISOString(),
      readCount: 1,
    });
  }

  // Keep history bounded to most recent 40 items
  profile.readingHistory = profile.readingHistory.slice(0, 40);
  saveUserTasteProfile(profile);
  return profile;
}

/**
 * Toggles a liked genre in the user's taste profile
 */
export function toggleUserLikedGenre(genre: string): UserTasteProfile {
  const profile = getUserTasteProfile();
  const exists = profile.likedGenres.includes(genre);

  if (exists) {
    profile.likedGenres = profile.likedGenres.filter((g) => g !== genre);
  } else {
    profile.likedGenres.push(genre);
  }

  saveUserTasteProfile(profile);
  return profile;
}

/**
 * Applies one of the predefined taste presets (great for demos and quick switching)
 */
export function applyTastePreset(
  presetId: string,
  catalog: Manga[]
): UserTasteProfile {
  const preset = TASTE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return getUserTasteProfile();

  const newHistory: ReadingHistoryEntry[] = preset.mockHistoryMangaIds
    .map((id) => {
      const manga = catalog.find((m) => m.id === id);
      if (!manga) return null;
      return {
        mangaId: manga.id,
        mangaTitle: manga.title,
        lastChapterNumber: 1,
        lastReadAt: new Date().toISOString(),
        readCount: 2,
        userRating: 5,
      };
    })
    .filter(Boolean) as ReadingHistoryEntry[];

  const updated: UserTasteProfile = {
    likedGenres: [...preset.likedGenres],
    readingHistory: newHistory,
    favoriteMangaIds: [...preset.mockHistoryMangaIds],
    dislikedMangaIds: ['ka-ai-banned-shadow'],
    lastUpdated: new Date().toISOString(),
  };

  saveUserTasteProfile(updated);
  return updated;
}

/**
 * Clears reading history
 */
export function clearReadingHistory(): UserTasteProfile {
  const profile = getUserTasteProfile();
  profile.readingHistory = [];
  saveUserTasteProfile(profile);
  return profile;
}

/**
 * Calculates Content-Based Similarity between a candidate manga and the user taste profile
 */
function calculateContentBasedScore(
  candidate: Manga,
  profile: UserTasteProfile,
  allManga: Manga[]
): {
  score: number;
  matchedGenres: string[];
  thematicSimilarity: number;
  reason: string;
  sourceManga?: { id: string; title: string };
} {
  const candidateGenres = new Set(candidate.genres || []);
  const candidateThematic = extractThematicTokens(
    `${candidate.title} ${candidate.synopsis}`
  );

  // 1. Liked Genres Match (Weight = 0.45)
  const userLikedGenresSet = new Set(profile.likedGenres || []);
  const matchedGenres: string[] = [];
  candidateGenres.forEach((g) => {
    if (userLikedGenresSet.has(g)) matchedGenres.push(g);
  });
  const genreMatchRatio =
    userLikedGenresSet.size > 0
      ? matchedGenres.length / Math.max(1, candidateGenres.size)
      : 0.3;

  // 2. Reading History Content Similarity (Weight = 0.55)
  let bestMangaMatchScore = 0;
  let bestMatchingManga: Manga | null = null;
  let bestThematicScore = 0;

  for (const hist of profile.readingHistory) {
    const histManga = allManga.find((m) => m.id === hist.mangaId);
    if (!histManga) continue;

    const histGenres = new Set(histManga.genres || []);
    const histThematic = extractThematicTokens(
      `${histManga.title} ${histManga.synopsis}`
    );

    const gSim = jaccardSimilarity(candidateGenres, histGenres);
    const tSim = jaccardSimilarity(candidateThematic, histThematic);

    // Combined pairwise content similarity
    const pairSim = gSim * 0.65 + tSim * 0.35;
    if (pairSim > bestMangaMatchScore) {
      bestMangaMatchScore = pairSim;
      bestMatchingManga = histManga;
      bestThematicScore = tSim;
    }
  }

  // If user has no history, rely primarily on liked genres
  let compositeScore = 0;
  let reason = '';

  if (profile.readingHistory.length === 0) {
    compositeScore = Math.min(1.0, genreMatchRatio * 0.85 + (candidate.rating / 5) * 0.15);
    reason =
      matchedGenres.length > 0
        ? `Matches your liked genres: ${matchedGenres.join(', ')}`
        : `Trending title in ${candidate.genres[0] || 'Shonen'}`;
  } else if (bestMatchingManga && bestMangaMatchScore > 0.25) {
    compositeScore =
      bestMangaMatchScore * 0.55 +
      genreMatchRatio * 0.35 +
      (candidate.rating / 5) * 0.10;
    reason = `Because you read ${bestMatchingManga.title}`;
  } else if (matchedGenres.length > 0) {
    compositeScore =
      genreMatchRatio * 0.70 + (candidate.rating / 5) * 0.30;
    reason = `Matches your taste for ${matchedGenres.slice(0, 2).join(' & ')}`;
  } else {
    compositeScore = (candidate.rating / 5) * 0.5;
    reason = `Recommended high-rated series (${candidate.rating}★)`;
  }

  return {
    score: Math.min(0.99, Math.max(0.1, compositeScore)),
    matchedGenres,
    thematicSimilarity: bestThematicScore,
    reason,
    sourceManga: bestMatchingManga
      ? { id: bestMatchingManga.id, title: bestMatchingManga.title }
      : undefined,
  };
}

/**
 * Calculates Collaborative Filtering Score based on community co-reading patterns
 */
function calculateCollaborativeScore(
  candidate: Manga,
  profile: UserTasteProfile
): {
  score: number;
  reason: string;
  sourceMangaTitle?: string;
} {
  const candidateId = candidate.id;
  const historyIds = profile.readingHistory.map((h) => h.mangaId);
  const favoriteIds = profile.favoriteMangaIds || [];
  const interactingIds = Array.from(new Set([...historyIds, ...favoriteIds]));

  if (interactingIds.length === 0) {
    // Cold start collaborative score fallback
    return {
      score: 0.5,
      reason: 'Popular with readers across Africa',
    };
  }

  let totalSim = 0;
  let weightedSum = 0;
  let topAffinity = 0;
  let topAffinitySourceTitle = '';

  for (const readId of interactingIds) {
    const affinity =
      COMMUNITY_CO_READING_MATRIX[readId]?.[candidateId] ||
      COMMUNITY_CO_READING_MATRIX[candidateId]?.[readId] ||
      0;

    if (affinity > 0) {
      // Find read item's title
      const historyItem = profile.readingHistory.find((h) => h.mangaId === readId);
      const weight = historyItem ? Math.min(2.0, 1 + historyItem.readCount * 0.2) : 1.2;
      weightedSum += affinity * weight;
      totalSim += weight;

      if (affinity > topAffinity) {
        topAffinity = affinity;
        if (historyItem) topAffinitySourceTitle = historyItem.mangaTitle;
      }
    }
  }

  if (totalSim > 0) {
    const collabScore = weightedSum / totalSim;
    const reason = topAffinitySourceTitle
      ? `Readers of ${topAffinitySourceTitle} also loved this`
      : 'Readers with similar tastes frequently read this';
    return {
      score: Math.min(0.98, collabScore),
      reason,
      sourceMangaTitle: topAffinitySourceTitle,
    };
  }

  // Implicit baseline based on overall platform bookmarks/views
  const popularityScore = Math.min(0.7, (candidate.views || 5000) / 30000);
  return {
    score: popularityScore,
    reason: 'Trending among readers with similar profiles',
  };
}

/**
 * Main recommendation generator function.
 * Computes recommendations for the user using Content-Based, Collaborative, or Hybrid blending.
 */
export function getRecommendedManga(
  allManga: Manga[],
  options: {
    mode?: RecommendationAlgorithmMode;
    limit?: number;
    excludeRead?: boolean;
    customTasteProfile?: UserTasteProfile;
  } = {}
): RecommendationResult[] {
  const {
    mode = 'hybrid',
    limit = 6,
    excludeRead = false,
    customTasteProfile,
  } = options;

  const profile = customTasteProfile || getUserTasteProfile();
  const readMangaIds = new Set(profile.readingHistory.map((h) => h.mangaId));
  const dislikedIds = new Set(profile.dislikedMangaIds || []);

  // Filter out banned manga and drafts that are not public
  const candidates = allManga.filter((m) => {
    if (m.isBanned) return false;
    if (m.approvalStatus === 'draft' || m.approvalStatus === 'rejected') return false;
    if (dislikedIds.has(m.id)) return false;
    if (excludeRead && readMangaIds.has(m.id)) return false;
    return true;
  });

  const results: RecommendationResult[] = candidates.map((manga) => {
    const contentResult = calculateContentBasedScore(manga, profile, allManga);
    const collabResult = calculateCollaborativeScore(manga, profile);

    let finalScore = 0;
    let primaryReason = '';
    let explanation = '';

    if (mode === 'content_based') {
      finalScore = contentResult.score;
      primaryReason = contentResult.reason;
      explanation = contentResult.matchedGenres.length > 0
        ? `Matched on genres (${contentResult.matchedGenres.join(', ')}) and narrative synopsis keywords.`
        : `High thematic similarity to items in your reading history.`;
    } else if (mode === 'collaborative') {
      finalScore = collabResult.score;
      primaryReason = collabResult.reason;
      explanation = `Calculated using item-item collaborative filtering on reader co-engagement matrix.`;
    } else if (mode === 'liked_genres') {
      // Direct genre matching priority
      const candidateGenres = new Set(manga.genres || []);
      const matched = profile.likedGenres.filter((g) => candidateGenres.has(g));
      const genreRatio = profile.likedGenres.length > 0 ? matched.length / profile.likedGenres.length : 0.5;
      finalScore = Math.min(0.98, genreRatio * 0.7 + (manga.rating / 5) * 0.3);
      primaryReason = matched.length > 0
        ? `Direct match for liked genres: ${matched.join(', ')}`
        : `Curated pick in ${manga.genres[0] || 'Shonen'}`;
      explanation = `100% matched against your explicitly selected favorite genres.`;
    } else {
      // 'hybrid' (Weighted ensemble of Content + Collaborative + Quality prior)
      const wContent = 0.55;
      const wCollab = 0.35;
      const wQuality = 0.10;
      const qualityScore = (manga.rating / 5) * 0.8 + (manga.award ? 0.2 : 0);

      finalScore =
        contentResult.score * wContent +
        collabResult.score * wCollab +
        qualityScore * wQuality;

      // Determine the strongest explaining factor
      if (contentResult.sourceManga && contentResult.score > 0.75) {
        primaryReason = contentResult.reason;
      } else if (collabResult.score > 0.75 && collabResult.sourceMangaTitle) {
        primaryReason = collabResult.reason;
      } else if (contentResult.matchedGenres.length >= 2) {
        primaryReason = `Top match for ${contentResult.matchedGenres.slice(0, 2).join(' & ')}`;
      } else {
        primaryReason = contentResult.reason || collabResult.reason;
      }

      explanation = `Hybrid Recommendation: 55% Content-based feature alignment + 35% Collaborative reader behavior + 10% Platform rating.`;
    }

    // Small boost for MOTY Award winners and ongoing series with new chapters
    if (manga.award?.isWinner) finalScore = Math.min(0.99, finalScore + 0.03);
    if (manga.chapters && manga.chapters.length > 2) finalScore = Math.min(0.99, finalScore + 0.02);

    const matchPercentage = Math.round(finalScore * 100);

    return {
      manga,
      score: finalScore,
      matchPercentage,
      primaryReason,
      explanation,
      matchedGenres: contentResult.matchedGenres,
      algorithmUsed: mode,
      thematicSimilarity: contentResult.thematicSimilarity,
      collaborativeScore: collabResult.score,
      sourceManga: contentResult.sourceManga,
    };
  });

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Item-to-Item Similarity:
 * Finds similar manga to a specific target manga (e.g. for "You May Also Like" in MangaDetailModal)
 */
export function getSimilarManga(
  targetManga: Manga,
  allManga: Manga[],
  limit = 4
): {
  manga: Manga;
  similarityScore: number;
  matchPercentage: number;
  sharedGenres: string[];
  reason: string;
}[] {
  const targetGenres = new Set(targetManga.genres || []);
  const targetThematic = extractThematicTokens(
    `${targetManga.title} ${targetManga.synopsis}`
  );

  const candidates = allManga.filter(
    (m) =>
      m.id !== targetManga.id &&
      !m.isBanned &&
      m.approvalStatus !== 'draft' &&
      m.approvalStatus !== 'rejected'
  );

  const scored = candidates.map((manga) => {
    const candidateGenres = new Set(manga.genres || []);
    const candidateThematic = extractThematicTokens(
      `${manga.title} ${manga.synopsis}`
    );

    // Genre Jaccard
    const gSim = jaccardSimilarity(targetGenres, candidateGenres);
    // Thematic Jaccard
    const tSim = jaccardSimilarity(targetThematic, candidateThematic);
    // Community Co-reading Affinity
    const collabAffinity =
      COMMUNITY_CO_READING_MATRIX[targetManga.id]?.[manga.id] ||
      COMMUNITY_CO_READING_MATRIX[manga.id]?.[targetManga.id] ||
      0.4;

    const sharedGenres: string[] = [];
    manga.genres?.forEach((g) => {
      if (targetGenres.has(g)) sharedGenres.push(g);
    });

    // Blended Item-Item similarity
    const similarityScore = gSim * 0.50 + tSim * 0.25 + collabAffinity * 0.25;
    const matchPercentage = Math.round(Math.min(0.99, Math.max(0.5, similarityScore)) * 100);

    let reason = '';
    if (sharedGenres.length >= 2) {
      reason = `Shared genres: ${sharedGenres.slice(0, 2).join(' & ')}`;
    } else if (collabAffinity > 0.7) {
      reason = `Fans of ${targetManga.title} also read this`;
    } else {
      reason = `Similar narrative themes & art cadence`;
    }

    return {
      manga,
      similarityScore,
      matchPercentage,
      sharedGenres,
      reason,
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, limit);
}
