import express, { Request, Response } from 'express';
import { AuthenticatedRequest, requireJwtAuth } from './authRoutes.ts';
import { findUserById } from '../db/users.ts';
import {
  Base64ImageRejectedError,
  ReleaseDayLockedError,
  WeeklyChapterLimitError,
  createCreatorChapterRecord,
  upsertCreatorManga,
} from '../db/creator.ts';
import {
  aggregatePageViewsBatch,
  createCommentRecord,
  insertPageViewRow,
  listPaginatedComments,
  listPaginatedMangas,
  listPaginatedPublishedChapters,
} from '../db/catalog.ts';
import {
  getCurrentSastDateString,
  getNextReleaseDateForDay,
  normalizeReleaseDay,
} from '../utils/releaseSchedule.ts';
import type { ReleaseDay } from '../types.ts';

const ADMIN_EMAILS = new Set(['mlungisenimbhele3@gmail.com']);

async function requireCreatorOrAdmin(
  req: AuthenticatedRequest,
  res: Response
): Promise<boolean> {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return false;
  }

  const emailLower = (user.email || '').trim().toLowerCase();
  let effectiveRole = (user.role || '').toLowerCase();

  try {
    const dbUser = await findUserById(user.id);
    if (dbUser?.role) {
      effectiveRole = dbUser.role.toLowerCase();
      user.role = dbUser.role;
    }
  } catch {
    // fallback to token claim
  }

  const allowed =
    ADMIN_EMAILS.has(emailLower) ||
    effectiveRole === 'creator' ||
    effectiveRole === 'admin';

  if (!allowed) {
    res.status(403).json({
      error: 'Creator account required. Please apply to become a Creator first.',
    });
    return false;
  }
  return true;
}

export const layeredRouter = express.Router();

/**
 * GET /api/manga?limit=20&offset=0&type=original|backdrop&release_day=WED
 * Strictly paginated public manga list with published chapters & cached views.
 */
layeredRouter.get('/manga', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const rawType = String(req.query.type || '').trim().toLowerCase();
    const typeFilter =
      rawType === 'original' || rawType === 'backdrop'
        ? (rawType as 'original' | 'backdrop')
        : undefined;
    const rawReleaseDay = String(req.query.release_day || '').trim().toUpperCase();
    const releaseDayFilter = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(
      rawReleaseDay
    )
      ? (rawReleaseDay as ReleaseDay)
      : undefined;

    const payload = await listPaginatedMangas({
      limit,
      offset,
      type: typeFilter,
      releaseDay: releaseDayFilter,
    });

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('[Layered API] GET /api/manga error:', error);
    return res.status(500).json({ error: 'Couldn\'t load. Tap to retry.' });
  }
});

/**
 * POST /api/manga
 * Stores series text/metadata + CDN cover URL ONLY (no binary/base64 image payloads).
 */
layeredRouter.post('/manga', requireJwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!(await requireCreatorOrAdmin(req, res))) return;
  const user = req.authUser!;
  const {
    id,
    title,
    synopsis,
    coverUrl,
    genres,
    ageRating,
    language,
    type,
    releaseDay,
    status,
    approvalStatus,
  } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Manga title is required.' });
  }

  const seriesType: 'original' | 'backdrop' =
    type === 'original' ? 'original' : 'backdrop';
  const mangaId =
    typeof id === 'string' && id.trim()
      ? id.trim()
      : `creator-${user.id}-${Date.now()}`;
  const cleanGenres =
    Array.isArray(genres) && genres.length > 0 ? genres.map(String) : ['Action'];
  const cleanStatus: 'Draft' | 'Coming Soon' | 'Live' =
    status === 'Live' || status === 'Coming Soon' || status === 'Draft'
      ? status
      : 'Coming Soon';
  const cleanReleaseDay = normalizeReleaseDay(releaseDay);

  try {
    const saved = await upsertCreatorManga({
      id: mangaId,
      creatorId: user.id,
      creatorEmail: user.email,
      title: title.trim().slice(0, 140),
      synopsis: typeof synopsis === 'string' ? synopsis.trim().slice(0, 2000) : '',
      coverUrl: typeof coverUrl === 'string' ? coverUrl.trim() : '',
      genres: cleanGenres,
      ageRating: typeof ageRating === 'string' ? ageRating : '13+',
      language: typeof language === 'string' ? language : 'English',
      type: seriesType,
      releaseDay: cleanReleaseDay,
      status: cleanStatus,
      approvalStatus: typeof approvalStatus === 'string' ? approvalStatus : undefined,
    });

    return res.status(201).json({
      success: true,
      dbPersisted: true,
      manga: saved,
    });
  } catch (error: any) {
    if (
      error instanceof Base64ImageRejectedError ||
      error instanceof ReleaseDayLockedError
    ) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('[Layered API] POST /api/manga error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to save manga.' });
  }
});

/**
 * GET /api/chapters?mangaId=...&limit=20&offset=0
 * Paginated published chapters endpoint. Strictly hides scheduled & draft chapters.
 */
layeredRouter.get('/chapters', async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const mangaId =
      typeof req.query.mangaId === 'string' && req.query.mangaId.trim()
        ? req.query.mangaId.trim()
        : undefined;
    const chapterId =
      typeof req.query.chapterId === 'string' && req.query.chapterId.trim()
        ? req.query.chapterId.trim()
        : undefined;

    const payload = await listPaginatedPublishedChapters({
      mangaId,
      chapterId,
      limit,
      offset,
    });

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('[Layered API] GET /api/chapters error:', error);
    return res.status(500).json({ error: 'Couldn\'t load. Tap to retry.' });
  }
});

/**
 * POST /api/chapters
 * Stores chapter metadata + pages_json CDN URLs ONLY.
 * Enforces: 8-50 pages, no base64 images, max 1 chapter per release week.
 */
layeredRouter.post('/chapters', requireJwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!(await requireCreatorOrAdmin(req, res))) return;
  const user = req.authUser!;
  const {
    id,
    mangaId,
    number,
    title,
    panels,
    pagesJson,
    publishMode,
    scheduledFor,
    releaseDate,
    releaseDay,
  } = req.body || {};

  if (!mangaId || typeof mangaId !== 'string') {
    return res.status(400).json({ error: 'Target mangaId is required.' });
  }

  const chapterNum = Math.max(1, Number(number) || 1);
  const chapterTitle =
    typeof title === 'string' && title.trim()
      ? title.trim().slice(0, 140)
      : `Chapter ${chapterNum}`;

  const rawPanels = Array.isArray(panels)
    ? panels
    : Array.isArray(pagesJson)
    ? pagesJson.map((url: string, idx: number) => ({
        id: `p-${idx + 1}`,
        pageNumber: idx + 1,
        imageUrl: url,
      }))
    : [];

  const cleanPanels: Array<{ id: string; pageNumber: number; imageUrl: string }> =
    rawPanels
      .filter((p: any) => p && typeof p.imageUrl === 'string' && p.imageUrl.trim())
      .map((p: any, idx: number) => ({
        id: typeof p.id === 'string' ? p.id : `p-${idx + 1}`,
        pageNumber: idx + 1,
        imageUrl: String(p.imageUrl).trim(),
      }));

  if (cleanPanels.length < 8 || cleanPanels.length > 50) {
    return res.status(400).json({ error: 'Chapter must be 8-50 pages' });
  }

  const mode = String(publishMode || 'live').toLowerCase();
  const publishStatus: 'Coming Soon • Panels In Production' | 'Live' | 'Scheduled' =
    mode === 'schedule' || mode === 'scheduled'
      ? 'Scheduled'
      : mode === 'live' || mode === 'now'
      ? 'Live'
      : 'Coming Soon • Panels In Production';

  const todaySast = getCurrentSastDateString();
  let resolvedScheduledFor: string | null = null;
  if (publishStatus === 'Scheduled') {
    if (typeof scheduledFor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(scheduledFor.trim())) {
      resolvedScheduledFor = scheduledFor.trim().slice(0, 10);
    } else {
      const fallbackDay = normalizeReleaseDay(releaseDay);
      resolvedScheduledFor = getNextReleaseDateForDay(fallbackDay, todaySast, false).isoDate;
    }
  }

  const chapterId =
    typeof id === 'string' && id.trim()
      ? id.trim()
      : `ch-${mangaId}-${Date.now()}`;
  const cleanReleaseDate =
    publishStatus === 'Scheduled' && resolvedScheduledFor
      ? resolvedScheduledFor
      : typeof releaseDate === 'string' && releaseDate.trim()
      ? releaseDate.trim().slice(0, 10)
      : todaySast;

  try {
    const saved = await createCreatorChapterRecord({
      id: chapterId,
      mangaId,
      creatorId: user.id,
      number: chapterNum,
      title: chapterTitle,
      panels: cleanPanels,
      publishStatus,
      scheduledFor: resolvedScheduledFor,
      releaseDate: cleanReleaseDate,
    });

    return res.status(201).json({
      success: true,
      dbPersisted: true,
      chapter: {
        ...saved,
        panels: cleanPanels,
        pages: cleanPanels,
        pagesJson: cleanPanels.map((p) => p.imageUrl),
      },
    });
  } catch (error: any) {
    if (error instanceof WeeklyChapterLimitError) {
      return res.status(409).json({
        error: error.message,
        nextReleaseDayLabel: error.nextReleaseDayLabel,
        nextReleaseDateIso: error.nextReleaseDateIso,
      });
    }
    if (error instanceof Base64ImageRejectedError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('[Layered API] POST /api/chapters error:', error);
    return res.status(400).json({ error: error?.message || 'Failed to save chapter.' });
  }
});

/**
 * GET /api/comments?chapterId=...&limit=20&offset=0
 */
layeredRouter.get('/comments', async (req: Request, res: Response) => {
  const chapterId =
    typeof req.query.chapterId === 'string' ? req.query.chapterId.trim() : '';
  if (!chapterId) {
    return res.status(400).json({ error: 'chapterId is required.' });
  }

  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const payload = await listPaginatedComments({ chapterId, limit, offset });
    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('[Layered API] GET /api/comments error:', error);
    return res.status(500).json({ error: 'Couldn\'t load comments.' });
  }
});

/**
 * POST /api/comments
 */
layeredRouter.post('/comments', async (req: AuthenticatedRequest, res: Response) => {
  const {
    chapterId,
    mangaId,
    userId,
    userName,
    text,
    pageNumber,
    isSpoiler,
    parentId,
    rootId,
    depth,
    replyToUserName,
    userBadge,
  } = req.body || {};

  if (!chapterId || typeof chapterId !== 'string') {
    return res.status(400).json({ error: 'chapterId is required.' });
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  try {
    const created = await createCommentRecord({
      chapterId: chapterId.trim(),
      mangaId: typeof mangaId === 'string' && mangaId.trim() ? mangaId.trim() : 'unknown',
      userId:
        req.authUser?.id ||
        (typeof userId === 'string' && userId.trim() ? userId.trim() : 'guest'),
      userName:
        (typeof userName === 'string' && userName.trim()) ||
        req.authUser?.pen_name ||
        'Reader',
      text: text.trim(),
      pageNumber: typeof pageNumber === 'number' ? pageNumber : undefined,
      isSpoiler: Boolean(isSpoiler),
      parentId: typeof parentId === 'string' ? parentId : null,
      rootId: typeof rootId === 'string' ? rootId : null,
      depth: Number(depth) || 0,
      replyToUserName:
        typeof replyToUserName === 'string' ? replyToUserName : undefined,
      userBadge: typeof userBadge === 'string' ? userBadge : undefined,
    });

    return res.status(201).json({ success: true, comment: created });
  } catch (error: any) {
    console.error('[Layered API] POST /api/comments error:', error);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
});

/**
 * POST /api/views
 * Strictly inserts a lightweight event into `page_views` — NEVER executes UPDATE on `mangas`.
 * Background 5-minute cron sums rows into `mangas.total_views_cached`.
 */
layeredRouter.post('/views', async (req: Request, res: Response) => {
  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const mangaId = typeof body?.mangaId === 'string' ? body.mangaId.trim() : '';
  const chapterId = typeof body?.chapterId === 'string' ? body.chapterId.trim() : '';

  if (!mangaId || !chapterId) {
    return res.status(400).json({ error: 'mangaId and chapterId are required.' });
  }

  try {
    const result = await insertPageViewRow({ mangaId, chapterId });
    return res.status(202).json(result);
  } catch (error: any) {
    console.warn('[Layered API] POST /api/views warning:', error?.message || error);
    return res.status(202).json({ queued: false });
  }
});

/**
 * POST /api/views/flush
 * Runs the view batch aggregation immediately (used by internal admin/cron tests).
 */
layeredRouter.post('/views/flush', async (_req: Request, res: Response) => {
  try {
    const stats = await aggregatePageViewsBatch();
    return res.status(200).json({ success: true, ...stats });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Batch flush failed.' });
  }
});
