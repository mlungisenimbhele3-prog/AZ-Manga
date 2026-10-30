import { useEffect, useState } from 'react';
import {
  Chapter,
  ComputedRatingStats,
  Manga,
  MangaVolume,
  RatingSummaryRecord,
  RatingTargetType,
  isMangaComingSoon,
} from '../types';
import {
  auth,
  collection,
  db,
  doc,
  handleFirestoreError,
  isPermissionError,
  limit,
  onAuthStateChanged,
  onSnapshot,
  OperationType,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from './firebase';
import { safeStorage } from '../utils/safeStorage';
import { getUserTasteProfile, saveUserTasteProfile } from './recommendationEngine';

const LOCAL_USER_RATINGS_STORAGE_KEY = 'az_oververse_user_ratings_v1';

interface LocalUserRatingEntry {
  summaryId: string;
  targetType: RatingTargetType;
  targetId: string;
  mangaId: string;
  volumeNumber?: number;
  chapterId?: string;
  score: 1 | 2 | 3 | 4 | 5;
  syncedUid: string | null;
  createdAt: string;
  updatedAt: string;
}

type RatingListener = () => void;

const listeners = new Set<RatingListener>();
let ratingRevision = 0;
let firestoreListenersInitialized = false;

// Cloud state hydrated from Firestore
const cloudSummaries = new Map<string, RatingSummaryRecord>();
const cloudUserRatings = new Map<string, 1 | 2 | 3 | 4 | 5>();
let activeAuthUid: string | null = null;
let activeAuthVerified = false;
let unsubscribeUserRatingsSnapshot: (() => void) | null = null;

// Local persisted ratings (supports instant guest preview + offline-first sync)
let localUserRatings: Record<string, LocalUserRatingEntry> = loadLocalUserRatings();

function loadLocalUserRatings(): Record<string, LocalUserRatingEntry> {
  const raw = safeStorage.getJSON<Record<string, LocalUserRatingEntry>>(
    LOCAL_USER_RATINGS_STORAGE_KEY,
    {}
  );
  if (!raw || typeof raw !== 'object') return {};
  const cleaned: Record<string, LocalUserRatingEntry> = {};
  for (const [key, entry] of Object.entries(raw)) {
    if (
      entry &&
      typeof entry.summaryId === 'string' &&
      isValidStarScore(entry.score) &&
      typeof entry.mangaId === 'string' &&
      typeof entry.targetId === 'string'
    ) {
      cleaned[key] = entry;
    }
  }
  return cleaned;
}

function persistLocalUserRatings(): void {
  safeStorage.setJSON(LOCAL_USER_RATINGS_STORAGE_KEY, localUserRatings);
}

function emitRatingChange(): void {
  ratingRevision += 1;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('[Ratings] Listener error:', e);
    }
  });
}

export function isValidStarScore(score: unknown): score is 1 | 2 | 3 | 4 | 5 {
  return score === 1 || score === 2 || score === 3 || score === 4 || score === 5;
}

/**
 * Normalizes IDs to strictly match Firestore security rule `^[a-zA-Z0-9_\-]+$`
 * and stay comfortably within the 90-char summaryId budget so `${summaryId}__${uid}` <= 128 chars.
 */
export function sanitizeRatingKeyPart(raw: string, maxLen = 68): string {
  const normalized = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, maxLen);
  return normalized.length > 0 ? normalized : 'item';
}

export function buildVolumeTargetId(mangaId: string, volumeNumber: number): string {
  const safeManga = sanitizeRatingKeyPart(mangaId, 58);
  const safeVol = Math.max(1, Math.min(1000, Math.floor(volumeNumber || 1)));
  return `${safeManga}_v${safeVol}`;
}

export function buildPreviewChapterId(mangaId: string, chapterNumber = 1): string {
  const safeManga = sanitizeRatingKeyPart(mangaId, 58);
  const safeCh = Math.max(1, Math.floor(chapterNumber || 1));
  return `${safeManga}-ch-${safeCh}`;
}

export function buildSummaryId(targetType: RatingTargetType, targetId: string): string {
  const prefix =
    targetType === 'manga' ? 'manga' : targetType === 'volume' ? 'volume' : 'chapter';
  const safeTarget = sanitizeRatingKeyPart(targetId, 76);
  return `${prefix}_${safeTarget}`;
}

export function buildUserRatingDocId(summaryId: string, uid: string): string {
  return `${sanitizeRatingKeyPart(summaryId, 88)}__${sanitizeRatingKeyPart(uid, 36)}`;
}

function roundAverage(sum: number, count: number): number {
  if (count <= 0 || sum <= 0) return 0;
  return Math.round((sum / count) * 100) / 100;
}

/**
 * Initializes Firestore real-time listeners for public rating summaries
 * and authenticated user's own rating records.
 */
export function initRatingService(): void {
  if (firestoreListenersInitialized || typeof window === 'undefined') return;
  firestoreListenersInitialized = true;

  const summariesPath = 'rating_summaries';
  try {
    const summariesQuery = query(
      collection(db, summariesPath),
      where('targetType', 'in', ['manga', 'volume', 'chapter']),
      limit(500)
    );

    onSnapshot(
      summariesQuery,
      (snapshot) => {
        cloudSummaries.clear();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data &&
            (data.targetType === 'manga' ||
              data.targetType === 'volume' ||
              data.targetType === 'chapter') &&
            typeof data.targetId === 'string' &&
            typeof data.mangaId === 'string' &&
            typeof data.ratingCount === 'number' &&
            typeof data.ratingSum === 'number'
          ) {
            cloudSummaries.set(docSnap.id, {
              id: docSnap.id,
              targetType: data.targetType,
              targetId: data.targetId,
              mangaId: data.mangaId,
              volumeNumber:
                typeof data.volumeNumber === 'number' ? data.volumeNumber : undefined,
              chapterId: typeof data.chapterId === 'string' ? data.chapterId : undefined,
              ratingSum: Math.max(0, data.ratingSum),
              ratingCount: Math.max(0, data.ratingCount),
              averageRating:
                typeof data.averageRating === 'number'
                  ? data.averageRating
                  : roundAverage(data.ratingSum, data.ratingCount),
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            });
          }
        });
        emitRatingChange();
      },
      (error) => {
        if (isPermissionError(error)) {
          handleFirestoreError(error, OperationType.LIST, summariesPath);
        }
      }
    );
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, summariesPath);
    }
  }

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeUserRatingsSnapshot) {
      unsubscribeUserRatingsSnapshot();
      unsubscribeUserRatingsSnapshot = null;
    }
    cloudUserRatings.clear();

    activeAuthUid = user?.uid || null;
    activeAuthVerified = Boolean(user?.uid && user.emailVerified);

    if (user?.uid) {
      const ratingsPath = 'ratings';
      const userRatingsQuery = query(
        collection(db, ratingsPath),
        where('uid', '==', user.uid),
        limit(500)
      );

      unsubscribeUserRatingsSnapshot = onSnapshot(
        userRatingsQuery,
        (snapshot) => {
          cloudUserRatings.clear();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && typeof data.summaryId === 'string' && isValidStarScore(data.score)) {
              cloudUserRatings.set(data.summaryId, data.score);
              const existingLocal = localUserRatings[data.summaryId];
              if (existingLocal && existingLocal.score === data.score) {
                existingLocal.syncedUid = user.uid;
              }
            }
          });
          persistLocalUserRatings();
          emitRatingChange();

          // Sync any unsynced local ratings created before sign-in if email is verified
          if (user.emailVerified) {
            void syncPendingLocalRatingsToFirestore(user.uid);
          }
        },
        (error) => {
          if (isPermissionError(error)) {
            handleFirestoreError(error, OperationType.LIST, ratingsPath);
          }
        }
      );
    } else {
      emitRatingChange();
    }
  });
}

async function syncPendingLocalRatingsToFirestore(uid: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const entries = Object.values(localUserRatings).filter(
    (entry) => entry.syncedUid !== uid && !cloudUserRatings.has(entry.summaryId)
  );
  for (const entry of entries) {
    try {
      await persistRatingTransactionToFirestore({
        uid,
        summaryId: entry.summaryId,
        targetType: entry.targetType,
        targetId: entry.targetId,
        mangaId: entry.mangaId,
        volumeNumber: entry.volumeNumber,
        chapterId: entry.chapterId,
        score: entry.score,
      });
      if (localUserRatings[entry.summaryId]) {
        localUserRatings[entry.summaryId].syncedUid = uid;
      }
    } catch {
      // Stop background sync if offline or transiently unavailable
      break;
    }
  }
  persistLocalUserRatings();
  emitRatingChange();
}

interface FirestoreRatingWriteInput {
  uid: string;
  summaryId: string;
  targetType: RatingTargetType;
  targetId: string;
  mangaId: string;
  volumeNumber?: number;
  chapterId?: string;
  score: 1 | 2 | 3 | 4 | 5;
}

async function persistRatingTransactionToFirestore(
  input: FirestoreRatingWriteInput
): Promise<void> {
  const safeMangaId = sanitizeRatingKeyPart(input.mangaId, 76);
  const safeTargetId = sanitizeRatingKeyPart(input.targetId, 76);
  const summaryId = buildSummaryId(input.targetType, safeTargetId);
  const ratingDocId = buildUserRatingDocId(summaryId, input.uid);

  const ratingRef = doc(db, 'ratings', ratingDocId);
  const summaryRef = doc(db, 'rating_summaries', summaryId);

  try {
    await runTransaction(db, async (tx) => {
      const [existingRatingSnap, existingSummarySnap] = await Promise.all([
        tx.get(ratingRef),
        tx.get(summaryRef),
      ]);

      const hadPreviousRating = existingRatingSnap.exists();
      const previousScore = hadPreviousRating
        ? Number(existingRatingSnap.data()?.score || 0)
        : 0;

      const prevCount = existingSummarySnap.exists()
        ? Math.max(0, Math.floor(Number(existingSummarySnap.data()?.ratingCount || 0)))
        : 0;
      const prevSum = existingSummarySnap.exists()
        ? Math.max(0, Math.floor(Number(existingSummarySnap.data()?.ratingSum || 0)))
        : 0;

      const nextCount = hadPreviousRating ? Math.max(1, prevCount) : prevCount + 1;
      const nextSum = hadPreviousRating
        ? Math.max(nextCount, prevSum - previousScore + input.score)
        : prevSum + input.score;
      const nextAverage = Math.min(5, Math.max(1, roundAverage(nextSum, nextCount)));

      const ratingPayload: Record<string, unknown> = {
        id: ratingDocId,
        summaryId,
        uid: input.uid,
        targetType: input.targetType,
        targetId: safeTargetId,
        mangaId: safeMangaId,
        score: input.score,
        createdAt: hadPreviousRating
          ? existingRatingSnap.data()?.createdAt || serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const resolvedVolumeNumber =
        input.targetType === 'volume'
          ? Math.max(1, Math.min(1000, Math.floor(input.volumeNumber || 1)))
          : undefined;
      const resolvedChapterId =
        input.targetType === 'chapter'
          ? sanitizeRatingKeyPart(input.chapterId || safeTargetId, 76)
          : undefined;

      if (resolvedVolumeNumber !== undefined) {
        ratingPayload.volumeNumber = resolvedVolumeNumber;
      }
      if (resolvedChapterId !== undefined) {
        ratingPayload.chapterId = resolvedChapterId;
      }

      const summaryPayload: Record<string, unknown> = {
        id: summaryId,
        targetType: input.targetType,
        targetId: safeTargetId,
        mangaId: safeMangaId,
        ratingSum: nextSum,
        ratingCount: nextCount,
        averageRating: nextAverage,
        createdAt: existingSummarySnap.exists()
          ? existingSummarySnap.data()?.createdAt || serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (resolvedVolumeNumber !== undefined) {
        summaryPayload.volumeNumber = resolvedVolumeNumber;
      }
      if (resolvedChapterId !== undefined) {
        summaryPayload.chapterId = resolvedChapterId;
      }

      tx.set(ratingRef, ratingPayload);
      tx.set(summaryRef, summaryPayload);
    });
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `ratings/${ratingDocId}`);
    }
    throw error;
  }
}

function syncMangaRatingIntoTasteProfile(
  mangaId: string,
  mangaTitle: string | undefined,
  score: 1 | 2 | 3 | 4 | 5
): void {
  try {
    const profile = getUserTasteProfile();
    const existing = profile.readingHistory.find((entry) => entry.mangaId === mangaId);
    if (existing) {
      existing.userRating = score;
      existing.lastReadAt = new Date().toISOString();
    } else if (mangaTitle) {
      profile.readingHistory.unshift({
        mangaId,
        mangaTitle,
        lastChapterNumber: 1,
        lastReadAt: new Date().toISOString(),
        readCount: 1,
        userRating: score,
      });
    }
    if (score >= 4 && !profile.dislikedMangaIds.includes(mangaId)) {
      profile.dislikedMangaIds = profile.dislikedMangaIds.filter((id) => id !== mangaId);
    }
    saveUserTasteProfile(profile);
  } catch {
    // Non-critical recommendation sync
  }
}

export interface SubmitRatingOptions {
  targetType: RatingTargetType;
  targetId: string;
  mangaId: string;
  score: number;
  volumeNumber?: number;
  chapterId?: string;
  mangaTitle?: string;
}

/**
 * Submits or updates a 1–5 star rating for a Manga series, Volume, or Chapter.
 * Updates UI optimistically in 0ms and persists atomically to Firestore when signed in.
 */
export async function submitUserRating(options: SubmitRatingOptions): Promise<ComputedRatingStats> {
  initRatingService();

  const clampedScore = Math.max(1, Math.min(5, Math.round(options.score))) as 1 | 2 | 3 | 4 | 5;
  const safeMangaId = sanitizeRatingKeyPart(options.mangaId, 76);
  const safeTargetId = sanitizeRatingKeyPart(options.targetId, 76);
  const summaryId = buildSummaryId(options.targetType, safeTargetId);
  const nowIso = new Date().toISOString();

  const existingLocal = localUserRatings[summaryId];
  localUserRatings[summaryId] = {
    summaryId,
    targetType: options.targetType,
    targetId: safeTargetId,
    mangaId: safeMangaId,
    volumeNumber: options.volumeNumber,
    chapterId: options.chapterId ? sanitizeRatingKeyPart(options.chapterId, 76) : undefined,
    score: clampedScore,
    // Reset syncedUid until the latest score commits to Firestore
    syncedUid: null,
    createdAt: existingLocal?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  persistLocalUserRatings();
  syncMangaRatingIntoTasteProfile(options.mangaId, options.mangaTitle, clampedScore);
  emitRatingChange();

  const currentUser = auth.currentUser;
  if (
    currentUser?.uid &&
    currentUser.emailVerified &&
    (typeof navigator === 'undefined' || navigator.onLine !== false)
  ) {
    try {
      await persistRatingTransactionToFirestore({
        uid: currentUser.uid,
        summaryId,
        targetType: options.targetType,
        targetId: safeTargetId,
        mangaId: safeMangaId,
        volumeNumber: options.volumeNumber,
        chapterId: options.chapterId,
        score: clampedScore,
      });
      if (localUserRatings[summaryId]) {
        localUserRatings[summaryId].syncedUid = currentUser.uid;
        persistLocalUserRatings();
        emitRatingChange();
      }
    } catch (error) {
      if (isPermissionError(error)) {
        throw error;
      }
      // Keep local rating cached for next online session
    }
  }

  return getTargetRatingStats(options.targetType, options.targetId);
}

/**
 * Computes reconciled rating stats for a single target (merging Firestore aggregate
 * with optimistic/guest local user rating without double-counting).
 */
export function getTargetRatingStats(
  targetType: RatingTargetType,
  targetId: string
): ComputedRatingStats {
  const safeTargetId = sanitizeRatingKeyPart(targetId, 76);
  const summaryId = buildSummaryId(targetType, safeTargetId);

  const cloud = cloudSummaries.get(summaryId);
  const cloudUserScore = cloudUserRatings.get(summaryId) ?? null;
  const localEntry = localUserRatings[summaryId] ?? null;

  let ratingCount = cloud ? cloud.ratingCount : 0;
  let ratingSum = cloud ? cloud.ratingSum : 0;
  const userScore: number | null = localEntry?.score ?? cloudUserScore ?? null;

  if (localEntry) {
    if (cloudUserScore !== null) {
      // Cloud summary already includes cloudUserScore; apply delta if local was just updated
      if (localEntry.score !== cloudUserScore && ratingCount > 0) {
        ratingSum = Math.max(ratingCount, ratingSum - cloudUserScore + localEntry.score);
      } else if (ratingCount === 0) {
        ratingCount = 1;
        ratingSum = localEntry.score;
      }
    } else if (activeAuthUid && localEntry.syncedUid === activeAuthUid && ratingCount > 0) {
      // Already committed to cloud summary in this session
    } else {
      // Guest rating or pending offline rating not yet included in cloud aggregate
      ratingCount += 1;
      ratingSum += localEntry.score;
    }
  }

  return {
    summaryId,
    averageRating: roundAverage(ratingSum, ratingCount),
    ratingCount,
    ratingSum,
    userScore,
  };
}

export function getChapterRatingStats(chapterId: string): ComputedRatingStats {
  return getTargetRatingStats('chapter', chapterId);
}

/**
 * Computes rating stats for a Manga Volume:
 * - `userScore` is the user's direct 1–5 star rating on this specific volume.
 * - `averageRating` & `ratingCount` combine direct volume ratings + ratings on chapters inside the volume.
 */
export function getVolumeRatingStats(
  mangaId: string,
  volumeNumber: number,
  chapterIds: string[] = []
): ComputedRatingStats {
  const volTargetId = buildVolumeTargetId(mangaId, volumeNumber);
  const directVolStats = getTargetRatingStats('volume', volTargetId);

  let totalSum = directVolStats.ratingSum;
  let totalCount = directVolStats.ratingCount;

  const seenSummaryIds = new Set<string>([directVolStats.summaryId]);
  for (const chId of chapterIds) {
    const chStats = getChapterRatingStats(chId);
    if (!seenSummaryIds.has(chStats.summaryId) && chStats.ratingCount > 0) {
      seenSummaryIds.add(chStats.summaryId);
      totalSum += chStats.ratingSum;
      totalCount += chStats.ratingCount;
    }
  }

  return {
    summaryId: directVolStats.summaryId,
    averageRating: roundAverage(totalSum, totalCount),
    ratingCount: totalCount,
    ratingSum: totalSum,
    userScore: directVolStats.userScore,
  };
}

/**
 * Derives structured Tankōbon Volumes for any Manga series (5 chapters per volume by default,
 * or Volume 1 Preview when chapters are in production) with live average ratings.
 */
export function getVolumesForManga(manga: Manga): MangaVolume[] {
  const cover =
    (manga as any).coverUrl || (manga as any).cover || manga.coverImage || manga.bannerImage;

  if (!manga.chapters || manga.chapters.length === 0) {
    const previewChapterId = buildPreviewChapterId(manga.id, 1);
    const volStats = getVolumeRatingStats(manga.id, 1, [previewChapterId]);
    return [
      {
        id: buildVolumeTargetId(manga.id, 1),
        mangaId: manga.id,
        number: 1,
        title: 'Volume 1 · Tankōbon Edition',
        coverImage: cover,
        chapterIds: [previewChapterId],
        chapterRangeLabel: isMangaComingSoon(manga)
          ? 'Chapters 1–5 · Serialization Preview'
          : 'Chapters 1–5',
        releaseStatus: isMangaComingSoon(manga) ? 'PREVIEW' : 'SERIALIZING',
        rating: volStats.averageRating,
        ratingCount: volStats.ratingCount,
      },
    ];
  }

  const grouped = new Map<number, Chapter[]>();
  const sortedChapters = [...manga.chapters].sort((a, b) => (a.number || 0) - (b.number || 0));

  for (const ch of sortedChapters) {
    const volNum =
      typeof ch.volumeNumber === 'number' && ch.volumeNumber >= 1
        ? Math.floor(ch.volumeNumber)
        : Math.max(1, Math.ceil((ch.number || 1) / 5));
    const bucket = grouped.get(volNum) || [];
    bucket.push(ch);
    grouped.set(volNum, bucket);
  }

  const volumeNumbers = Array.from(grouped.keys()).sort((a, b) => a - b);
  return volumeNumbers.map((volNum) => {
    const chs = grouped.get(volNum) || [];
    const firstNum = chs[0]?.number ?? (volNum - 1) * 5 + 1;
    const lastNum = chs[chs.length - 1]?.number ?? firstNum;
    const rangeLabel =
      chs.length === 1
        ? `Chapter ${firstNum}`
        : `Chapters ${firstNum}–${lastNum} (${chs.length} Chs)`;
    const chIds = chs.map((c) => c.id);
    const volStats = getVolumeRatingStats(manga.id, volNum, chIds);
    const volCover = chs[0]?.pages?.[0]?.imageUrl || cover;

    return {
      id: buildVolumeTargetId(manga.id, volNum),
      mangaId: manga.id,
      number: volNum,
      title: `Volume ${volNum}`,
      coverImage: volCover,
      chapterIds: chIds,
      chapterRangeLabel: rangeLabel,
      releaseStatus: chs.length >= 5 || manga.status === 'COMPLETED' ? 'RELEASED' : 'SERIALIZING',
      rating: volStats.averageRating,
      ratingCount: volStats.ratingCount,
    };
  });
}

/**
 * Computes the overall average rating for a Manga across direct manga ratings,
 * volume ratings, and chapter ratings belonging to that manga.
 */
export function getMangaOverallRatingStats(manga: Manga): ComputedRatingStats {
  const safeMangaId = sanitizeRatingKeyPart(manga.id, 76);
  const directSeriesStats = getTargetRatingStats('manga', manga.id);

  let totalSum = 0;
  let totalCount = 0;
  const processedSummaryIds = new Set<string>();

  const includeSummary = (summaryId: string, tType: RatingTargetType, tId: string) => {
    if (processedSummaryIds.has(summaryId)) return;
    processedSummaryIds.add(summaryId);
    const stats = getTargetRatingStats(tType, tId);
    totalSum += stats.ratingSum;
    totalCount += stats.ratingCount;
  };

  // 1. Direct manga rating
  includeSummary(directSeriesStats.summaryId, 'manga', manga.id);

  // 2. Derived/explicit volumes & chapters on the manga object
  const volumes = getVolumesForManga(manga);
  for (const vol of volumes) {
    const volTargetId = buildVolumeTargetId(manga.id, vol.number);
    includeSummary(buildSummaryId('volume', volTargetId), 'volume', volTargetId);
    for (const chId of vol.chapterIds) {
      includeSummary(buildSummaryId('chapter', chId), 'chapter', chId);
    }
  }
  for (const ch of manga.chapters || []) {
    includeSummary(buildSummaryId('chapter', ch.id), 'chapter', ch.id);
  }

  // 3. Any additional cloud or local summaries tagged with this mangaId
  cloudSummaries.forEach((record, summaryId) => {
    if (record.mangaId === safeMangaId && !processedSummaryIds.has(summaryId)) {
      includeSummary(summaryId, record.targetType, record.targetId);
    }
  });
  Object.values(localUserRatings).forEach((entry) => {
    if (entry.mangaId === safeMangaId && !processedSummaryIds.has(entry.summaryId)) {
      includeSummary(entry.summaryId, entry.targetType, entry.targetId);
    }
  });

  const averageRating =
    totalCount > 0 ? roundAverage(totalSum, totalCount) : Number(manga.rating || 0);

  return {
    summaryId: directSeriesStats.summaryId,
    averageRating,
    ratingCount: totalCount,
    ratingSum: totalSum,
    userScore: directSeriesStats.userScore,
  };
}

/**
 * Enriches a Manga catalog list with live average ratings and counts for every
 * Manga, Volume, and Chapter while preserving object references when unchanged.
 */
export function enrichMangaListWithRatings(mangaList: Manga[]): Manga[] {
  return mangaList.map((manga) => {
    if (!manga || manga.id === 'placeholder') return manga;

    const overall = getMangaOverallRatingStats(manga);
    const nextVolumes = getVolumesForManga(manga);

    let chaptersChanged = false;
    const nextChapters = (manga.chapters || []).map((ch) => {
      const chStats = getChapterRatingStats(ch.id);
      const nextRating = chStats.ratingCount > 0 ? chStats.averageRating : ch.rating || 0;
      const nextCount = chStats.ratingCount;
      if (ch.rating !== nextRating || ch.ratingCount !== nextCount) {
        chaptersChanged = true;
        return {
          ...ch,
          rating: nextRating,
          ratingCount: nextCount,
        };
      }
      return ch;
    });

    const prevVolumes = manga.volumes || [];
    const volumesChanged =
      prevVolumes.length !== nextVolumes.length ||
      nextVolumes.some(
        (v, idx) =>
          prevVolumes[idx]?.id !== v.id ||
          prevVolumes[idx]?.rating !== v.rating ||
          prevVolumes[idx]?.ratingCount !== v.ratingCount ||
          prevVolumes[idx]?.chapterIds.length !== v.chapterIds.length
      );

    if (
      manga.rating === overall.averageRating &&
      (manga.ratingCount || 0) === overall.ratingCount &&
      !chaptersChanged &&
      !volumesChanged
    ) {
      return manga;
    }

    return {
      ...manga,
      rating: overall.averageRating,
      ratingCount: overall.ratingCount,
      chapters: chaptersChanged ? nextChapters : manga.chapters,
      volumes: nextVolumes,
    };
  });
}

export function subscribeToRatings(listener: RatingListener): () => void {
  initRatingService();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRatingRevision(): number {
  return ratingRevision;
}

/**
 * React hook that re-renders consumer components whenever any rating changes
 * locally or via Firestore real-time snapshot.
 */
export function useRatingRevision(): number {
  const [rev, setRev] = useState<number>(() => getRatingRevision());

  useEffect(() => {
    initRatingService();
    setRev(getRatingRevision());
    return subscribeToRatings(() => {
      setRev(getRatingRevision());
    });
  }, []);

  return rev;
}

export function getStarRatingLabel(score: number): string {
  switch (score) {
    case 1:
      return '1/5 · Needs Work';
    case 2:
      return '2/5 · Fair';
    case 3:
      return '3/5 · Good';
    case 4:
      return '4/5 · Great';
    case 5:
      return '5/5 · Masterpiece';
    default:
      return 'Tap a star to rate';
  }
}
