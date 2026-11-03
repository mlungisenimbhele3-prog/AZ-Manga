import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  auth,
  collection,
  db,
  deleteDoc,
  doc,
  handleFirestoreError,
  isPermissionError,
  limit,
  onSnapshot,
  OperationType,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from './firebase';
import { getCurrentUserProfile } from './userProfile';
import { safeStorage } from '../utils/safeStorage';
import { checkClientRateLimit, logSecurityEvent } from '../utils/securitySanitizer';

export const MAX_CHAPTER_COMMENT_LENGTH = 500;
export const MAX_THREAD_DEPTH = 4;

const LOCAL_CHAPTER_COMMENTS_KEY = 'az_oververse_chapter_comments_v1';
const LOCAL_CHAPTER_COMMENT_LIKES_KEY = 'az_oververse_chapter_comment_likes_v1';

export type CommentSortOption = 'top' | 'newest' | 'oldest';

export interface ChapterCommentRecord {
  id: string;
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  parentId: string | null;
  rootId: string | null;
  depth: 0 | 1 | 2 | 3 | 4;
  replyToUserName?: string;
  pageNumber?: number;
  isSpoiler: boolean;
  authorUid: string;
  authorName: string;
  authorBadge?: string;
  text: string;
  status: 'published' | 'deleted';
  createdAt: string;
  updatedAt: string;
  baseLikes?: number;
  isCloudSynced?: boolean;
  isLocalSeed?: boolean;
}

export interface ThreadedCommentNode extends ChapterCommentRecord {
  likesCount: number;
  isLikedByCurrentUser: boolean;
  isOwnComment: boolean;
  replies: ThreadedCommentNode[];
  descendantCount: number;
}

export interface PostChapterCommentInput {
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  text: string;
  parentComment?: Pick<
    ChapterCommentRecord,
    'id' | 'parentId' | 'rootId' | 'depth' | 'authorName' | 'isCloudSynced' | 'isLocalSeed'
  > | null;
  pageNumber?: number;
  isSpoiler?: boolean;
  authorNameOverride?: string;
  authorBadge?: string;
}

type DiscussionListener = () => void;

const listeners = new Set<DiscussionListener>();
let discussionRevision = 0;

interface ActiveChapterSubscription {
  refCount: number;
  unsubscribeComments: (() => void) | null;
  unsubscribeLikes: (() => void) | null;
}

const activeChapterSubscriptions = new Map<string, ActiveChapterSubscription>();
const cloudCommentsByChapter = new Map<string, Map<string, ChapterCommentRecord>>();
const cloudLikesByChapter = new Map<string, Map<string, Set<string>>>();

function emitDiscussionChange(): void {
  discussionRevision += 1;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('[ChapterComments] Listener error:', err);
    }
  });
}

/**
 * Sanitizes IDs to strictly match `firestore.rules` `isValidShortId` (`^[a-zA-Z0-9_\-]+$`, 1..76 chars).
 */
export function sanitizeCommentShortId(raw: string, maxLen = 72): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : 'ch_item';
}

function sanitizeLikeUid(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 48);
  return cleaned.length > 0 ? cleaned : 'guest';
}

/**
 * Neutralizes dangerous script/HTML tags while preserving natural punctuation (apostrophes, quotes)
 * since React JSX escapes text nodes safely on render.
 */
export function sanitizePlainCommentText(raw: string, maxLen = MAX_CHAPTER_COMMENT_LENGTH): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw;
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi,
  ];

  let blocked = false;
  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      blocked = true;
      text = text.replace(pattern, '');
    }
  }
  if (blocked) {
    logSecurityEvent(
      'Defense 2 (XSS)',
      'high',
      'Neutralized unsafe script/handler sequence in chapter comment.'
    );
  }

  return text.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function sanitizeAuthorDisplayName(raw: string): string {
  const cleaned = sanitizePlainCommentText(raw, 80).replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : 'Reader';
}

function getEffectiveReaderUid(): string {
  if (auth.currentUser?.uid) {
    return sanitizeLikeUid(auth.currentUser.uid);
  }
  const existingGuestId = safeStorage.getItem('az_oververse_reader_comment_uid');
  if (existingGuestId) {
    return sanitizeLikeUid(existingGuestId);
  }
  const generated = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  safeStorage.setItem('az_oververse_reader_comment_uid', generated);
  return sanitizeLikeUid(generated);
}

export function getPreferredReaderCommentName(): string {
  const profile = getCurrentUserProfile();
  if (profile.isCreator && profile.penName?.trim()) {
    return sanitizeAuthorDisplayName(profile.penName);
  }
  const storedHandle = safeStorage.getItem('ka_reader_username');
  if (storedHandle && storedHandle.trim().length > 0 && storedHandle !== 'Reader') {
    return sanitizeAuthorDisplayName(storedHandle);
  }
  if (auth.currentUser?.displayName?.trim()) {
    return sanitizeAuthorDisplayName(auth.currentUser.displayName);
  }
  if (profile.displayName && profile.displayName !== 'Guest Reader') {
    return sanitizeAuthorDisplayName(profile.displayName);
  }
  return storedHandle?.trim() ? sanitizeAuthorDisplayName(storedHandle) : 'Reader';
}

export function setPreferredReaderCommentName(name: string): string {
  const clean = sanitizeAuthorDisplayName(name).slice(0, 32);
  safeStorage.setItem('ka_reader_username', clean);
  emitDiscussionChange();
  return clean;
}

function loadLocalCommentsMap(): Record<string, ChapterCommentRecord> {
  const raw = safeStorage.getJSON<Record<string, ChapterCommentRecord>>(
    LOCAL_CHAPTER_COMMENTS_KEY,
    {}
  );
  if (!raw || typeof raw !== 'object') return {};
  const valid: Record<string, ChapterCommentRecord> = {};
  for (const [id, item] of Object.entries(raw)) {
    if (
      item &&
      typeof item.id === 'string' &&
      typeof item.chapterId === 'string' &&
      typeof item.mangaId === 'string' &&
      typeof item.text === 'string'
    ) {
      valid[id] = item;
    }
  }
  return valid;
}

function loadLocalLikesMap(): Record<string, boolean> {
  const raw = safeStorage.getJSON<Record<string, boolean>>(LOCAL_CHAPTER_COMMENT_LIKES_KEY, {});
  if (!raw || typeof raw !== 'object') return {};
  return raw;
}

let localCommentsStore: Record<string, ChapterCommentRecord> = loadLocalCommentsMap();
let localLikesStore: Record<string, boolean> = loadLocalLikesMap();

function persistLocalComments(): void {
  safeStorage.setJSON(LOCAL_CHAPTER_COMMENTS_KEY, localCommentsStore);
}

function persistLocalLikes(): void {
  safeStorage.setJSON(LOCAL_CHAPTER_COMMENT_LIKES_KEY, localLikesStore);
}

function buildSeededThreadsForChapter(
  safeMangaId: string,
  safeChapterId: string,
  chapterNumber: number
): ChapterCommentRecord[] {
  if (chapterNumber !== 1) return [];

  if (safeMangaId === 'nkosi-the-tale-of-myths') {
    const root1Id = `seed_${safeChapterId}_r1`;
    const reply1aId = `seed_${safeChapterId}_r1_a`;
    const reply1bId = `seed_${safeChapterId}_r1_b`;
    const root2Id = `seed_${safeChapterId}_r2`;
    const reply2aId = `seed_${safeChapterId}_r2_a`;

    return [
      {
        id: root1Id,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: null,
        rootId: null,
        depth: 0,
        pageNumber: 1,
        isSpoiler: false,
        authorUid: 'seed_reader_thabo',
        authorName: 'Thabo M.',
        authorBadge: 'VIP Reader',
        text: 'The beadwork detail and blue spear flame composition on the opening spread is unreal. Dual-colored eyes hint at two ancestral lineages.',
        status: 'published',
        createdAt: '2026-10-28T14:15:00.000Z',
        updatedAt: '2026-10-28T14:15:00.000Z',
        baseLikes: 24,
        isLocalSeed: true,
      },
      {
        id: reply1aId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: root1Id,
        rootId: root1Id,
        depth: 1,
        replyToUserName: 'Thabo M.',
        pageNumber: 1,
        isSpoiler: false,
        authorUid: 'seed_reader_zanele',
        authorName: 'Zanele K.',
        text: 'Caught that too! Notice the elder sovereign at the top carries the same spear crest while the younger heir has the heterochromia.',
        status: 'published',
        createdAt: '2026-10-28T14:42:00.000Z',
        updatedAt: '2026-10-28T14:42:00.000Z',
        baseLikes: 11,
        isLocalSeed: true,
      },
      {
        id: reply1bId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: reply1aId,
        rootId: root1Id,
        depth: 2,
        replyToUserName: 'Zanele K.',
        isSpoiler: false,
        authorUid: 'seed_reader_sipho',
        authorName: 'Sipho D.',
        authorBadge: 'Early Patron',
        text: 'If the green eye marks earth spirits and the violet eye marks royal fire, the power scaling in Volume 1 is going to be wild.',
        status: 'published',
        createdAt: '2026-10-28T15:08:00.000Z',
        updatedAt: '2026-10-28T15:08:00.000Z',
        baseLikes: 7,
        isLocalSeed: true,
      },
      {
        id: root2Id,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: null,
        rootId: null,
        depth: 0,
        pageNumber: 2,
        isSpoiler: false,
        authorUid: 'seed_reader_nandi',
        authorName: 'Nandi B.',
        text: 'Reading in AZ Vertical mode makes the fire transitions flow like an animated storyboard. Who else is hyped for the full serialization drop?',
        status: 'published',
        createdAt: '2026-10-29T09:20:00.000Z',
        updatedAt: '2026-10-29T09:20:00.000Z',
        baseLikes: 15,
        isLocalSeed: true,
      },
      {
        id: reply2aId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: root2Id,
        rootId: root2Id,
        depth: 1,
        replyToUserName: 'Nandi B.',
        isSpoiler: true,
        authorUid: 'seed_reader_kabelo',
        authorName: 'Kabelo R.',
        text: 'Lore theory: the child in leopard regalia on the right might be a flashback of Nkosi before the eclipse trial rather than a younger sibling.',
        status: 'published',
        createdAt: '2026-10-29T10:05:00.000Z',
        updatedAt: '2026-10-29T10:05:00.000Z',
        baseLikes: 9,
        isLocalSeed: true,
      },
    ];
  }

  if (safeMangaId === 'last-shaman-of-zambezi') {
    const rootId = `seed_${safeChapterId}_r1`;
    const replyId = `seed_${safeChapterId}_r1_a`;
    return [
      {
        id: rootId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: null,
        rootId: null,
        depth: 0,
        pageNumber: 1,
        isSpoiler: false,
        authorUid: 'seed_reader_tariro',
        authorName: 'Tariro N.',
        authorBadge: 'VIP Reader',
        text: 'Zambezi river folklore mixed with high-stakes spirit combat is an instant bookmark for me.',
        status: 'published',
        createdAt: '2026-10-27T17:10:00.000Z',
        updatedAt: '2026-10-27T17:10:00.000Z',
        baseLikes: 14,
        isLocalSeed: true,
      },
      {
        id: replyId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: rootId,
        rootId: rootId,
        depth: 1,
        replyToUserName: 'Tariro N.',
        isSpoiler: false,
        authorUid: 'seed_reader_chido',
        authorName: 'Chido M.',
        text: 'Same here! Hoping we see Nyami Nyami guardian designs when the full chapter panels drop.',
        status: 'published',
        createdAt: '2026-10-27T18:02:00.000Z',
        updatedAt: '2026-10-27T18:02:00.000Z',
        baseLikes: 6,
        isLocalSeed: true,
      },
    ];
  }

  if (safeMangaId === 'echoes-of-the-highveld') {
    const rootId = `seed_${safeChapterId}_r1`;
    const replyId = `seed_${safeChapterId}_r1_a`;
    return [
      {
        id: rootId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: null,
        rootId: null,
        depth: 0,
        pageNumber: 1,
        isSpoiler: false,
        authorUid: 'seed_reader_lerato',
        authorName: 'Lerato P.',
        text: 'Highveld thunderstorm lighting in manga ink work hits different. Ready for Chapter 1!',
        status: 'published',
        createdAt: '2026-10-26T12:30:00.000Z',
        updatedAt: '2026-10-26T12:30:00.000Z',
        baseLikes: 12,
        isLocalSeed: true,
      },
      {
        id: replyId,
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: 1,
        parentId: rootId,
        rootId: rootId,
        depth: 1,
        replyToUserName: 'Lerato P.',
        isSpoiler: false,
        authorUid: 'seed_reader_karabo',
        authorName: 'Karabo T.',
        text: 'Agreed, Johannesburg skyline + ancient Highveld ruins is such a clean setting.',
        status: 'published',
        createdAt: '2026-10-26T13:12:00.000Z',
        updatedAt: '2026-10-26T13:12:00.000Z',
        baseLikes: 5,
        isLocalSeed: true,
      },
    ];
  }

  return [];
}

function attachFirestoreChapterListeners(safeChapterId: string): () => void {
  if (typeof window === 'undefined' || !safeChapterId) {
    return () => {};
  }

  const existing = activeChapterSubscriptions.get(safeChapterId);
  if (existing) {
    existing.refCount += 1;
    return () => releaseFirestoreChapterListeners(safeChapterId);
  }

  const entry: ActiveChapterSubscription = {
    refCount: 1,
    unsubscribeComments: null,
    unsubscribeLikes: null,
  };
  activeChapterSubscriptions.set(safeChapterId, entry);

  const commentsPath = 'chapter_comments';
  try {
    const commentsQuery = query(
      collection(db, commentsPath),
      where('chapterId', '==', safeChapterId),
      where('status', '==', 'published'),
      limit(200)
    );

    entry.unsubscribeComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const chapterMap = new Map<string, ChapterCommentRecord>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data &&
            data.status === 'published' &&
            typeof data.mangaId === 'string' &&
            typeof data.chapterId === 'string' &&
            typeof data.text === 'string' &&
            typeof data.authorName === 'string'
          ) {
            const rawDepth = Number(data.depth || 0);
            const depth = (
              rawDepth >= 0 && rawDepth <= 4 ? Math.floor(rawDepth) : 0
            ) as 0 | 1 | 2 | 3 | 4;

            const record: ChapterCommentRecord = {
              id: docSnap.id,
              mangaId: data.mangaId,
              chapterId: data.chapterId,
              chapterNumber:
                typeof data.chapterNumber === 'number' ? Math.max(1, data.chapterNumber) : 1,
              parentId: depth >= 1 && typeof data.parentId === 'string' ? data.parentId : null,
              rootId: depth >= 1 && typeof data.rootId === 'string' ? data.rootId : null,
              depth,
              replyToUserName:
                typeof data.replyToUserName === 'string' ? data.replyToUserName : undefined,
              pageNumber:
                typeof data.pageNumber === 'number' && data.pageNumber >= 1
                  ? Math.floor(data.pageNumber)
                  : undefined,
              isSpoiler: Boolean(data.isSpoiler),
              authorUid: typeof data.authorUid === 'string' ? data.authorUid : 'reader',
              authorName: data.authorName,
              authorBadge:
                typeof data.authorBadge === 'string' && data.authorBadge.trim()
                  ? data.authorBadge
                  : undefined,
              text: data.text,
              status: 'published',
              createdAt:
                data.createdAt?.toDate?.()?.toISOString?.() ||
                localCommentsStore[docSnap.id]?.createdAt ||
                new Date().toISOString(),
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString?.() ||
                localCommentsStore[docSnap.id]?.updatedAt ||
                new Date().toISOString(),
              isCloudSynced: true,
            };
            chapterMap.set(docSnap.id, record);

            if (localCommentsStore[docSnap.id]) {
              localCommentsStore[docSnap.id] = {
                ...localCommentsStore[docSnap.id],
                ...record,
                isCloudSynced: true,
              };
            }
          }
        });

        cloudCommentsByChapter.set(safeChapterId, chapterMap);
        persistLocalComments();
        emitDiscussionChange();
      },
      (error) => {
        if (isPermissionError(error)) {
          handleFirestoreError(error, OperationType.LIST, commentsPath);
        }
      }
    );
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, commentsPath);
    }
  }

  const likesPath = 'chapter_comment_likes';
  try {
    const likesQuery = query(
      collection(db, likesPath),
      where('chapterId', '==', safeChapterId),
      limit(500)
    );

    entry.unsubscribeLikes = onSnapshot(
      likesQuery,
      (snapshot) => {
        const likesMap = new Map<string, Set<string>>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.commentId === 'string' && typeof data.uid === 'string') {
            const setForComment = likesMap.get(data.commentId) || new Set<string>();
            setForComment.add(data.uid);
            likesMap.set(data.commentId, setForComment);
          }
        });
        cloudLikesByChapter.set(safeChapterId, likesMap);
        emitDiscussionChange();
      },
      (error) => {
        if (isPermissionError(error)) {
          handleFirestoreError(error, OperationType.LIST, likesPath);
        }
      }
    );
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, likesPath);
    }
  }

  return () => releaseFirestoreChapterListeners(safeChapterId);
}

function releaseFirestoreChapterListeners(safeChapterId: string): void {
  const existing = activeChapterSubscriptions.get(safeChapterId);
  if (!existing) return;
  existing.refCount -= 1;
  if (existing.refCount <= 0) {
    existing.unsubscribeComments?.();
    existing.unsubscribeLikes?.();
    activeChapterSubscriptions.delete(safeChapterId);
  }
}

export function subscribeToDiscussionUpdates(listener: DiscussionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Posts a top-level chapter comment (`depth = 0`) or a direct reply to any comment (`depth = 1..4`).
 * - Replies to depth-4 comments flatten cleanly at `depth = 4` under the same parent while keeping `@replyToUserName`.
 * - Updates UI optimistically in 0ms and persists to Firestore when authenticated with a verified Google account.
 */
export async function postChapterComment(
  input: PostChapterCommentInput
): Promise<{ success: boolean; comment?: ChapterCommentRecord; error?: string }> {
  const rateCheck = checkClientRateLimit('chapter-comment-post', 8, 0.5);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: 'Posting too fast. Please wait a few seconds before sending another reply.',
    };
  }

  const cleanText = sanitizePlainCommentText(input.text, MAX_CHAPTER_COMMENT_LENGTH);
  if (!cleanText) {
    return {
      success: false,
      error: 'Comment cannot be empty.',
    };
  }

  const safeMangaId = sanitizeCommentShortId(input.mangaId, 72);
  const safeChapterId = sanitizeCommentShortId(input.chapterId, 72);
  const safeChapterNumber = Math.max(1, Math.min(10000, Math.floor(input.chapterNumber || 1)));

  const currentUid = auth.currentUser?.uid || getEffectiveReaderUid();
  const profile = getCurrentUserProfile();
  const resolvedAuthorName = sanitizeAuthorDisplayName(
    input.authorNameOverride || getPreferredReaderCommentName()
  );

  const resolvedBadgeRaw =
    input.authorBadge ||
    (profile.role === 'admin'
      ? 'Producer'
      : profile.isCreator
      ? 'Creator'
      : undefined);
  const resolvedBadge = resolvedBadgeRaw
    ? sanitizePlainCommentText(resolvedBadgeRaw, 40)
    : undefined;

  let depth: 0 | 1 | 2 | 3 | 4 = 0;
  let parentId: string | null = null;
  let rootId: string | null = null;
  let replyToUserName: string | undefined = undefined;
  let parentExistsInCloud = false;

  if (input.parentComment) {
    const parent = input.parentComment;
    const rawParentDepth = Math.max(0, Math.min(4, Math.floor(parent.depth || 0)));
    replyToUserName = sanitizeAuthorDisplayName(parent.authorName);

    if (rawParentDepth >= MAX_THREAD_DEPTH && parent.parentId) {
      // Cap nesting at MAX_THREAD_DEPTH (4) so deep threads remain readable on mobile screens
      // and satisfy `incoming().depth == parent.depth + 1` in `firestore.rules`
      depth = 4;
      parentId = sanitizeCommentShortId(parent.parentId, 72);
      rootId = sanitizeCommentShortId(parent.rootId || parent.parentId, 72);
    } else if (rawParentDepth === 0) {
      depth = 1;
      parentId = sanitizeCommentShortId(parent.id, 72);
      rootId = parentId;
    } else {
      depth = Math.min(4, rawParentDepth + 1) as 1 | 2 | 3 | 4;
      parentId = sanitizeCommentShortId(parent.id, 72);
      rootId = sanitizeCommentShortId(parent.rootId || parent.id, 72);
    }

    const chapterCloudMap = cloudCommentsByChapter.get(safeChapterId);
    parentExistsInCloud = Boolean(parentId && chapterCloudMap?.has(parentId));
  }

  const commentId = sanitizeCommentShortId(
    `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    72
  );
  const nowIso = new Date().toISOString();
  const validPageNumber =
    typeof input.pageNumber === 'number' &&
    Number.isFinite(input.pageNumber) &&
    input.pageNumber >= 1 &&
    input.pageNumber <= 5000
      ? Math.floor(input.pageNumber)
      : undefined;

  const canWriteToFirestore = Boolean(
    auth.currentUser?.uid &&
      auth.currentUser.emailVerified &&
      (depth === 0 || parentExistsInCloud) &&
      (typeof navigator === 'undefined' || navigator.onLine !== false)
  );

  const newRecord: ChapterCommentRecord = {
    id: commentId,
    mangaId: safeMangaId,
    chapterId: safeChapterId,
    chapterNumber: safeChapterNumber,
    parentId,
    rootId,
    depth,
    replyToUserName,
    pageNumber: validPageNumber,
    isSpoiler: Boolean(input.isSpoiler),
    authorUid: currentUid,
    authorName: resolvedAuthorName,
    authorBadge: resolvedBadge,
    text: cleanText,
    status: 'published',
    createdAt: nowIso,
    updatedAt: nowIso,
    isCloudSynced: false,
  };

  localCommentsStore[commentId] = newRecord;
  persistLocalComments();
  emitDiscussionChange();

  if (canWriteToFirestore && auth.currentUser) {
    const docPath = `chapter_comments/${commentId}`;
    const firestorePayload: Record<string, unknown> = {
      id: commentId,
      mangaId: safeMangaId,
      chapterId: safeChapterId,
      chapterNumber: safeChapterNumber,
      depth,
      isSpoiler: Boolean(input.isSpoiler),
      authorUid: auth.currentUser.uid,
      authorName: resolvedAuthorName,
      text: cleanText,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (depth >= 1 && parentId && rootId) {
      firestorePayload.parentId = parentId;
      firestorePayload.rootId = rootId;
      if (replyToUserName) {
        firestorePayload.replyToUserName = replyToUserName;
      }
    }

    if (validPageNumber !== undefined) {
      firestorePayload.pageNumber = validPageNumber;
    }

    if (resolvedBadge && resolvedBadge.length >= 1) {
      firestorePayload.authorBadge = resolvedBadge;
    }

    try {
      await setDoc(doc(db, 'chapter_comments', commentId), firestorePayload);
      if (localCommentsStore[commentId]) {
        localCommentsStore[commentId].isCloudSynced = true;
        persistLocalComments();
        emitDiscussionChange();
      }
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      }
      // Keep optimistic local record when offline
    }
  }

  return {
    success: true,
    comment: newRecord,
  };
}

/**
 * Edits the text or spoiler flag of a user's own published chapter comment or reply.
 */
export async function editChapterComment(options: {
  commentId: string;
  chapterId: string;
  text: string;
  isSpoiler: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const safeCommentId = sanitizeCommentShortId(options.commentId, 72);
  const safeChapterId = sanitizeCommentShortId(options.chapterId, 72);
  const cleanText = sanitizePlainCommentText(options.text, MAX_CHAPTER_COMMENT_LENGTH);

  if (!cleanText) {
    return { success: false, error: 'Comment text cannot be empty.' };
  }

  const nowIso = new Date().toISOString();
  const existingLocal = localCommentsStore[safeCommentId];
  if (existingLocal) {
    localCommentsStore[safeCommentId] = {
      ...existingLocal,
      text: cleanText,
      isSpoiler: Boolean(options.isSpoiler),
      updatedAt: nowIso,
    };
    persistLocalComments();
    emitDiscussionChange();
  }

  const cloudRecord = cloudCommentsByChapter.get(safeChapterId)?.get(safeCommentId);
  if (
    cloudRecord &&
    auth.currentUser?.uid &&
    auth.currentUser.emailVerified &&
    cloudRecord.authorUid === auth.currentUser.uid
  ) {
    const docPath = `chapter_comments/${safeCommentId}`;
    try {
      await updateDoc(doc(db, 'chapter_comments', safeCommentId), {
        text: cleanText,
        isSpoiler: Boolean(options.isSpoiler),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    }
  }

  return { success: true };
}

/**
 * Soft-deletes a user's own chapter comment or reply (`status: 'deleted'`).
 */
export async function deleteChapterComment(options: {
  commentId: string;
  chapterId: string;
}): Promise<void> {
  const safeCommentId = sanitizeCommentShortId(options.commentId, 72);
  const safeChapterId = sanitizeCommentShortId(options.chapterId, 72);

  if (localCommentsStore[safeCommentId]) {
    localCommentsStore[safeCommentId] = {
      ...localCommentsStore[safeCommentId],
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    };
    persistLocalComments();
    emitDiscussionChange();
  }

  const cloudRecord = cloudCommentsByChapter.get(safeChapterId)?.get(safeCommentId);
  if (
    cloudRecord &&
    auth.currentUser?.uid &&
    auth.currentUser.emailVerified &&
    cloudRecord.authorUid === auth.currentUser.uid
  ) {
    const docPath = `chapter_comments/${safeCommentId}`;
    try {
      await updateDoc(doc(db, 'chapter_comments', safeCommentId), {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    }
  }
}

/**
 * Toggles a 1-per-user like on any root comment or nested reply.
 */
export async function toggleChapterCommentLike(options: {
  commentId: string;
  chapterId: string;
  mangaId: string;
}): Promise<void> {
  const safeCommentId = sanitizeCommentShortId(options.commentId, 72);
  const safeChapterId = sanitizeCommentShortId(options.chapterId, 72);
  const safeMangaId = sanitizeCommentShortId(options.mangaId, 72);
  const currentUid = getEffectiveReaderUid();
  const likeId = `${safeCommentId}__${currentUid}`;

  const currentlyLikedLocal = localLikesStore[likeId];
  const cloudLikesForComment = cloudLikesByChapter.get(safeChapterId)?.get(safeCommentId);
  const currentlyLikedCloud = Boolean(
    auth.currentUser?.uid && cloudLikesForComment?.has(auth.currentUser.uid)
  );
  const isCurrentlyLiked =
    typeof currentlyLikedLocal === 'boolean' ? currentlyLikedLocal : currentlyLikedCloud;

  const nextLiked = !isCurrentlyLiked;
  localLikesStore[likeId] = nextLiked;
  persistLocalLikes();
  emitDiscussionChange();

  const isCloudComment = Boolean(cloudCommentsByChapter.get(safeChapterId)?.has(safeCommentId));
  if (
    isCloudComment &&
    auth.currentUser?.uid &&
    auth.currentUser.emailVerified &&
    auth.currentUser.uid.length <= 48 &&
    (typeof navigator === 'undefined' || navigator.onLine !== false)
  ) {
    const cloudLikeId = `${safeCommentId}__${auth.currentUser.uid}`;
    const docPath = `chapter_comment_likes/${cloudLikeId}`;
    const likeRef = doc(db, 'chapter_comment_likes', cloudLikeId);

    try {
      if (nextLiked) {
        await setDoc(likeRef, {
          id: cloudLikeId,
          commentId: safeCommentId,
          chapterId: safeChapterId,
          mangaId: safeMangaId,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(likeRef);
      }
    } catch (error) {
      if (isPermissionError(error)) {
        handleFirestoreError(
          error,
          nextLiked ? OperationType.CREATE : OperationType.DELETE,
          docPath
        );
      }
    }
  }
}

/**
 * Reconciles cloud + local + seeded chapter comments into a sorted multi-level reply tree.
 */
export function getThreadedCommentsForChapter(options: {
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  sortBy?: CommentSortOption;
}): {
  threads: ThreadedCommentNode[];
  totalCount: number;
  rootCount: number;
} {
  const safeMangaId = sanitizeCommentShortId(options.mangaId, 72);
  const safeChapterId = sanitizeCommentShortId(options.chapterId, 72);
  const sortBy = options.sortBy || 'top';
  const currentUid = getEffectiveReaderUid();
  const authUid = auth.currentUser?.uid || null;

  const mergedRecords = new Map<string, ChapterCommentRecord>();

  // 1. Seeded starter discussions for flagship preview chapters
  const seeds = buildSeededThreadsForChapter(safeMangaId, safeChapterId, options.chapterNumber);
  for (const seed of seeds) {
    mergedRecords.set(seed.id, seed);
  }

  // 2. Local optimistic/offline records for this chapter
  for (const record of Object.values(localCommentsStore)) {
    if (record.chapterId === safeChapterId) {
      if (record.status === 'deleted') {
        mergedRecords.delete(record.id);
      } else {
        mergedRecords.set(record.id, record);
      }
    }
  }

  // 3. Authoritative live Firestore snapshot records
  const cloudMap = cloudCommentsByChapter.get(safeChapterId);
  if (cloudMap) {
    cloudMap.forEach((cloudRec, id) => {
      const localOverride = localCommentsStore[id];
      if (localOverride?.status === 'deleted') {
        mergedRecords.delete(id);
      } else {
        mergedRecords.set(id, {
          ...cloudRec,
          text: localOverride?.text || cloudRec.text,
          isSpoiler:
            typeof localOverride?.isSpoiler === 'boolean'
              ? localOverride.isSpoiler
              : cloudRec.isSpoiler,
        });
      }
    });
  }

  const chapterCloudLikes = cloudLikesByChapter.get(safeChapterId);
  const nodeMap = new Map<string, ThreadedCommentNode>();

  mergedRecords.forEach((rec) => {
    if (rec.status !== 'published') return;

    const cloudUidSet = chapterCloudLikes?.get(rec.id);
    let likesCount = (rec.baseLikes || 0) + (cloudUidSet ? cloudUidSet.size : 0);

    const localLikeKey = `${rec.id}__${currentUid}`;
    const localLikeOverride = localLikesStore[localLikeKey];
    const cloudHasCurrentAuth = Boolean(authUid && cloudUidSet?.has(authUid));

    let isLikedByCurrentUser = cloudHasCurrentAuth;
    if (typeof localLikeOverride === 'boolean') {
      isLikedByCurrentUser = localLikeOverride;
      if (localLikeOverride && !cloudHasCurrentAuth) {
        likesCount += 1;
      } else if (!localLikeOverride && cloudHasCurrentAuth) {
        likesCount = Math.max(0, likesCount - 1);
      }
    }

    const isOwnComment = Boolean(
      rec.authorUid === currentUid || (authUid && rec.authorUid === authUid)
    );

    nodeMap.set(rec.id, {
      ...rec,
      likesCount,
      isLikedByCurrentUser,
      isOwnComment,
      replies: [],
      descendantCount: 0,
    });
  });

  const roots: ThreadedCommentNode[] = [];

  // Link child replies to their parent comment (or fallback cleanly to rootId / top-level if parent was deleted)
  nodeMap.forEach((node) => {
    if (node.depth > 0 && node.parentId) {
      const directParent = nodeMap.get(node.parentId);
      if (directParent && directParent.id !== node.id) {
        directParent.replies.push(node);
        return;
      }
      if (node.rootId) {
        const rootFallback = nodeMap.get(node.rootId);
        if (rootFallback && rootFallback.id !== node.id) {
          rootFallback.replies.push(node);
          return;
        }
      }
    }
    roots.push(node);
  });

  // Sort replies chronologically (oldest-first inside threads so conversations read naturally top-to-bottom)
  // and compute recursive descendant counts
  const sortRepliesAndCount = (node: ThreadedCommentNode): number => {
    node.replies.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let totalDescendants = 0;
    for (const child of node.replies) {
      totalDescendants += 1 + sortRepliesAndCount(child);
    }
    node.descendantCount = totalDescendants;
    return totalDescendants;
  };

  for (const root of roots) {
    sortRepliesAndCount(root);
  }

  roots.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // 'top': rank by likes + reply engagement, tie-break by newest
    const scoreA = a.likesCount * 2 + a.descendantCount;
    const scoreB = b.likesCount * 2 + b.descendantCount;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    threads: roots,
    totalCount: nodeMap.size,
    rootCount: roots.length,
  };
}

/**
 * React hook for live threaded chapter comments & replies inside `ReaderView` or `MangaDetailModal`.
 */
export function useChapterComments(options: {
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  initialSort?: CommentSortOption;
  userBadge?: string;
}) {
  const safeChapterId = useMemo(
    () => sanitizeCommentShortId(options.chapterId, 72),
    [options.chapterId]
  );
  const safeMangaId = useMemo(
    () => sanitizeCommentShortId(options.mangaId, 72),
    [options.mangaId]
  );

  const [sortBy, setSortBy] = useState<CommentSortOption>(options.initialSort || 'top');
  const [revision, setRevision] = useState<number>(() => discussionRevision);

  useEffect(() => {
    if (!safeChapterId) return;
    const detachFirestore = attachFirestoreChapterListeners(safeChapterId);
    const detachLocal = subscribeToDiscussionUpdates(() => {
      setRevision(discussionRevision);
    });
    setRevision(discussionRevision);
    return () => {
      detachLocal();
      detachFirestore();
    };
  }, [safeChapterId]);

  const { threads, totalCount, rootCount } = useMemo(
    () =>
      getThreadedCommentsForChapter({
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: options.chapterNumber,
        sortBy,
      }),
    [safeMangaId, safeChapterId, options.chapterNumber, sortBy, revision]
  );

  const addCommentOrReply = useCallback(
    async (params: {
      text: string;
      parentComment?: ThreadedCommentNode | null;
      pageNumber?: number;
      isSpoiler?: boolean;
      authorNameOverride?: string;
    }) => {
      return postChapterComment({
        mangaId: safeMangaId,
        chapterId: safeChapterId,
        chapterNumber: options.chapterNumber,
        text: params.text,
        parentComment: params.parentComment || null,
        pageNumber: params.pageNumber,
        isSpoiler: params.isSpoiler,
        authorNameOverride: params.authorNameOverride,
        authorBadge: options.userBadge,
      });
    },
    [safeMangaId, safeChapterId, options.chapterNumber, options.userBadge]
  );

  const toggleLike = useCallback(
    async (commentId: string) => {
      await toggleChapterCommentLike({
        commentId,
        chapterId: safeChapterId,
        mangaId: safeMangaId,
      });
    },
    [safeChapterId, safeMangaId]
  );

  const editComment = useCallback(
    async (commentId: string, text: string, isSpoiler: boolean) => {
      return editChapterComment({
        commentId,
        chapterId: safeChapterId,
        text,
        isSpoiler,
      });
    },
    [safeChapterId]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      await deleteChapterComment({
        commentId,
        chapterId: safeChapterId,
      });
    },
    [safeChapterId]
  );

  return {
    threads,
    totalCount,
    rootCount,
    sortBy,
    setSortBy,
    addCommentOrReply,
    toggleLike,
    editComment,
    removeComment,
  };
}
