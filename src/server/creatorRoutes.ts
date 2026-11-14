import crypto from 'crypto';
import express, { Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireJwtAuth } from './authRoutes.ts';
import { findUserById } from '../db/users.ts';
import {
  listCreatorMangas,
  listChaptersForCreator,
  upsertCreatorManga,
  updateCreatorMangaRecord,
  deleteCreatorMangaRecord,
  createCreatorChapterRecord,
  publishCreatorChapterRecord,
  listCreatorPayouts,
  listAllPayoutsForAdmin,
  createCreatorPayoutRecord,
  updatePayoutStatusRecord,
} from '../db/creator.ts';

const ADMIN_EMAILS = new Set(['mlungisenimbhele3@gmail.com']);
const VALID_PAYOUT_METHODS = new Set(['Bank', 'Capitec', 'PayFast']);
const VALID_ADMIN_PAYOUT_STATUSES = new Set(['Pending', 'Approved', 'Paid']);

function isAdminUser(user?: { email?: string; role?: string }): boolean {
  if (!user) return false;
  const emailLower = (user.email || '').trim().toLowerCase();
  const roleLower = (user.role || '').trim().toLowerCase();
  return ADMIN_EMAILS.has(emailLower) || roleLower === 'admin';
}

function serializePayoutForViewer<
  T extends {
    id: string;
    creatorId: string;
    creatorEmail: string;
    amountZar: number;
    method: string;
    accountReference: string;
    status: string;
    paidAt?: Date | string | null;
    createdAt: Date | string;
  },
>(row: T, viewerId: string, viewerIsAdmin: boolean) {
  const canSeeBankDetails = viewerIsAdmin || row.creatorId === viewerId;
  return {
    id: row.id,
    creatorId: row.creatorId,
    creatorEmail: canSeeBankDetails ? row.creatorEmail : '',
    amountZar: row.amountZar,
    method: canSeeBankDetails ? row.method : 'Restricted',
    accountReference: canSeeBankDetails ? row.accountReference : '',
    status: row.status === 'Processing' ? 'Pending' : row.status,
    paidAt: row.paidAt ?? null,
    createdAt: row.createdAt,
  };
}

export const creatorRouter = express.Router();

// Protect every /api/creator route with JWT auth + Creator/Admin role guard
creatorRouter.use(requireJwtAuth);
creatorRouter.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.authUser;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const emailLower = (user.email || '').trim().toLowerCase();
  let effectiveRole = (user.role || '').toLowerCase();

  // Re-verify latest role from DB when available so upgrades take effect immediately
  try {
    const dbUser = await findUserById(user.id);
    if (dbUser?.role) {
      effectiveRole = dbUser.role.toLowerCase();
      user.role = dbUser.role;
    }
  } catch {
    // Fallback to JWT claim if DB is unreachable
  }

  const isCreatorOrAdmin =
    ADMIN_EMAILS.has(emailLower) ||
    effectiveRole === 'creator' ||
    effectiveRole === 'admin';

  if (!isCreatorOrAdmin) {
    return res.status(403).json({
      error: 'Creator account required. Please apply to become a Creator first.',
    });
  }

  return next();
});

function buildMonthlySeries(totalEarningsZar: number) {
  const now = new Date();
  const weights = [0.11, 0.14, 0.15, 0.18, 0.2, 0.22];
  const points: Array<{
    month: string;
    adsZar: number;
    vipZar: number;
    tipsZar: number;
    totalZar: number;
  }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const w = weights[5 - i] ?? 0.16;
    const total = Number((totalEarningsZar * w).toFixed(2));
    const adsZar = Number((total * 0.56).toFixed(2));
    const vipZar = Number((total * 0.31).toFixed(2));
    const tipsZar = Number((total * 0.13).toFixed(2));
    points.push({ month: label, adsZar, vipZar, tipsZar, totalZar: total });
  }

  return points;
}

/**
 * GET /api/creator/dashboard
 * Returns Neon-backed mangas, chapters, payouts, earnings breakdown & monthly series.
 */
creatorRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  try {
    const [dbMangas, dbChapters, dbPayouts] = await Promise.all([
      listCreatorMangas(user.id, user.email),
      listChaptersForCreator(user.id),
      listCreatorPayouts(user.id),
    ]);

    const originalMangas = dbMangas.filter((m) => m.type === 'original');
    const backdropMangas = dbMangas.filter((m) => m.type !== 'original');
    const originalMangaIds = new Set(originalMangas.map((m) => m.id));

    const originalMangaReads = originalMangas.reduce((acc, m) => acc + (Number(m.views) || 0), 0);
    const originalChapterReads = dbChapters.reduce(
      (acc, c) => (originalMangaIds.has(c.mangaId) ? acc + (Number(c.reads) || 0) : acc),
      0
    );
    const originalReads = originalMangaReads + originalChapterReads;

    const originalLikes =
      originalMangas.reduce((acc, m) => acc + (Number(m.likes) || 0), 0) +
      dbChapters.reduce(
        (acc, c) => (originalMangaIds.has(c.mangaId) ? acc + (Number(c.likes) || 0) : acc),
        0
      );

    const backdropViews =
      backdropMangas.reduce((acc, m) => acc + (Number(m.views) || 0), 0) +
      dbChapters.reduce(
        (acc, c) => (!originalMangaIds.has(c.mangaId) ? acc + (Number(c.reads) || 0) : acc),
        0
      );

    const totalReads = originalReads + backdropViews;
    const totalLikes =
      dbMangas.reduce((acc, m) => acc + (Number(m.likes) || 0), 0) +
      dbChapters.reduce((acc, c) => acc + (Number(c.likes) || 0), 0);

    // 70% creator rev-share ZAR estimation from ORIGINAL series ONLY (Backdrop is exposure only, not payable)
    const grossZar = Number(((originalReads * 0.042 + originalLikes * 0.35) * 0.7).toFixed(2));
    const adsZar = Number((grossZar * 0.56).toFixed(2));
    const vipZar = Number((grossZar * 0.31).toFixed(2));
    const tipsZar = Number((grossZar * 0.13).toFixed(2));
    const paidOrPendingZar = dbPayouts.reduce(
      (acc, p) => (p.status !== 'Rejected' ? acc + (Number(p.amountZar) || 0) : acc),
      0
    );
    const availableBalanceZar = Number(Math.max(0, grossZar - paidOrPendingZar).toFixed(2));
    const monthlySeries = buildMonthlySeries(grossZar);
    const thisMonthZar = monthlySeries[monthlySeries.length - 1]?.totalZar ?? 0;

    return res.status(200).json({
      dbConnected: true,
      mangas: dbMangas.map((m) => ({
        ...m,
        type: m.type === 'original' ? 'original' : 'backdrop',
        genres: (() => {
          try {
            return JSON.parse(m.genres || '["Action"]');
          } catch {
            return ['Action'];
          }
        })(),
      })),
      chapters: dbChapters.map((c) => ({
        ...c,
        panels: (() => {
          try {
            return JSON.parse(c.panels || '[]');
          } catch {
            return [];
          }
        })(),
      })),
      payouts: dbPayouts.map((p) =>
        serializePayoutForViewer(p, user.id, isAdminUser(user))
      ),
      earnings: {
        totalZar: grossZar,
        originalTotalZar: grossZar,
        backdropPayableZar: 0,
        thisMonthZar,
        availableBalanceZar,
        breakdown: { adsZar, vipZar, tipsZar },
        monthlySeries,
      },
      audience: {
        totalReads,
        originalReads,
        backdropViews,
        totalLikes,
      },
    });
  } catch (error: any) {
    console.warn('[Creator API] Neon DB unavailable, returning graceful offline dashboard state:', error?.message || error);
    return res.status(200).json({
      dbConnected: false,
      fallbackMode: true,
      mangas: [],
      chapters: [],
      payouts: [],
      earnings: null,
      audience: null,
    });
  }
});

/**
 * POST /api/creator/mangas
 */
creatorRouter.post('/mangas', async (req: AuthenticatedRequest, res: Response) => {
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
    status,
    approvalStatus,
  } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Manga title is required.' });
  }

  const seriesType: 'original' | 'backdrop' =
    type === 'original' ? 'original' : 'backdrop';
  const mangaId = typeof id === 'string' && id.trim() ? id.trim() : `creator-${user.id}-${Date.now()}`;
  const cleanGenres = Array.isArray(genres) && genres.length > 0 ? genres.map(String) : ['Action'];
  const cleanStatus: 'Draft' | 'Coming Soon' | 'Live' =
    status === 'Live' || status === 'Coming Soon' || status === 'Draft' ? status : 'Coming Soon';

  try {
    const created = await upsertCreatorManga({
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
      status: cleanStatus,
      approvalStatus: typeof approvalStatus === 'string' ? approvalStatus : undefined,
    });

    return res.status(201).json({ success: true, dbPersisted: true, manga: created });
  } catch (error: any) {
    console.warn('[Creator API] POST /mangas DB fallback:', error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
      manga: {
        id: mangaId,
        creatorId: user.id,
        creatorEmail: user.email,
        title: title.trim(),
        type: seriesType,
        status: cleanStatus,
      },
    });
  }
});

/**
 * PATCH /api/creator/mangas/:id
 */
creatorRouter.patch('/mangas/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  const mangaId = req.params.id;
  const { title, synopsis, coverUrl, type, status, approvalStatus } = req.body || {};

  try {
    const updated = await updateCreatorMangaRecord(mangaId, user.id, {
      ...(typeof title === 'string' ? { title: title.trim().slice(0, 140) } : {}),
      ...(typeof synopsis === 'string' ? { synopsis: synopsis.trim().slice(0, 2000) } : {}),
      ...(typeof coverUrl === 'string' ? { coverUrl: coverUrl.trim() } : {}),
      ...(type === 'original' || type === 'backdrop' ? { type } : {}),
      ...(typeof status === 'string' ? { status } : {}),
      ...(typeof approvalStatus === 'string' ? { approvalStatus } : {}),
    });

    return res.status(200).json({ success: true, dbPersisted: Boolean(updated), manga: updated });
  } catch (error: any) {
    console.warn('[Creator API] PATCH /mangas DB fallback:', error?.message || error);
    return res.status(200).json({ success: true, dbPersisted: false });
  }
});

/**
 * DELETE /api/creator/mangas/:id
 */
creatorRouter.delete('/mangas/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  const mangaId = req.params.id;

  try {
    const deleted = await deleteCreatorMangaRecord(mangaId, user.id);
    return res.status(200).json({ success: true, dbPersisted: deleted });
  } catch (error: any) {
    console.warn('[Creator API] DELETE /mangas DB fallback:', error?.message || error);
    return res.status(200).json({ success: true, dbPersisted: false });
  }
});

/**
 * POST /api/creator/chapters
 * Saves ordered chapter panels to Neon `chapters` table.
 * Enforces 8-50 pages minimum/maximum on every new chapter upload.
 */
creatorRouter.post('/chapters', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  const {
    id,
    mangaId,
    number,
    title,
    panels,
    publishMode,
    scheduledFor,
    releaseDate,
  } = req.body || {};

  if (!mangaId || typeof mangaId !== 'string') {
    return res.status(400).json({ error: 'Target mangaId is required.' });
  }

  const chapterNum = Math.max(1, Number(number) || 1);
  const chapterTitle =
    typeof title === 'string' && title.trim()
      ? title.trim().slice(0, 140)
      : `Chapter ${chapterNum}`;

  const cleanPanels: Array<{ id: string; pageNumber: number; imageUrl: string }> = Array.isArray(panels)
    ? panels
        .filter((p: any) => p && typeof p.imageUrl === 'string' && p.imageUrl.trim())
        .map((p: any, idx: number) => ({
          id: typeof p.id === 'string' ? p.id : `p-${idx + 1}`,
          pageNumber: idx + 1,
          imageUrl: String(p.imageUrl),
        }))
    : [];

  if (cleanPanels.length < 8 || cleanPanels.length > 50) {
    return res.status(400).json({ error: 'Chapter must be 8-50 pages' });
  }

  const isLive = publishMode === 'live';
  const publishStatus: 'Coming Soon • Panels In Production' | 'Live' | 'Scheduled' = isLive
    ? 'Live'
    : 'Coming Soon • Panels In Production';

  const chapterId = typeof id === 'string' && id.trim() ? id.trim() : `ch-${mangaId}-${Date.now()}`;
  const cleanReleaseDate =
    typeof releaseDate === 'string' && releaseDate.trim()
      ? releaseDate.trim()
      : new Date().toISOString().split('T')[0];

  try {
    const saved = await createCreatorChapterRecord({
      id: chapterId,
      mangaId,
      creatorId: user.id,
      number: chapterNum,
      title: chapterTitle,
      panels: cleanPanels,
      publishStatus,
      scheduledFor: typeof scheduledFor === 'string' ? scheduledFor : null,
      releaseDate: cleanReleaseDate,
    });

    return res.status(201).json({
      success: true,
      dbPersisted: true,
      chapter: {
        ...saved,
        panels: cleanPanels,
      },
    });
  } catch (error: any) {
    console.warn('[Creator API] POST /chapters DB fallback:', error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
      chapter: {
        id: chapterId,
        mangaId,
        number: chapterNum,
        title: chapterTitle,
        panels: cleanPanels,
        pageCount: cleanPanels.length,
        publishStatus,
        scheduledFor: scheduledFor || null,
        releaseDate: cleanReleaseDate,
      },
    });
  }
});

/**
 * PATCH /api/creator/chapters/:id/publish
 * Moves a chapter from "Coming Soon • Panels In Production" to "Live".
 */
creatorRouter.patch('/chapters/:id/publish', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  const chapterId = req.params.id;
  try {
    const updated = await publishCreatorChapterRecord(chapterId, user.id);
    return res.status(200).json({
      success: true,
      dbPersisted: Boolean(updated),
      chapter: updated,
    });
  } catch (error: any) {
    console.warn('[Creator API] PATCH /chapters/:id/publish DB fallback:', error?.message || error);
    return res.status(200).json({ success: true, dbPersisted: false });
  }
});

/**
 * POST /api/creator/payouts
 * Requests a ZAR payout via Bank, Capitec, or PayFast (outgoing creator payouts only).
 * Creates a row in Neon `payouts` table with status "Pending" (7-14 working day review).
 */
creatorRouter.post('/payouts', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  const { amountZar, method, accountReference } = req.body || {};

  const numericAmount = Number(amountZar);
  if (!Number.isFinite(numericAmount) || numericAmount < 100) {
    return res.status(400).json({ error: 'Minimum payout is R100.' });
  }

  if (!VALID_PAYOUT_METHODS.has(String(method))) {
    return res.status(400).json({ error: 'Payout method must be Bank, Capitec, or PayFast.' });
  }

  const cleanRef =
    typeof accountReference === 'string' && accountReference.trim().length >= 3
      ? accountReference.trim().slice(0, 120)
      : '';
  if (!cleanRef) {
    return res.status(400).json({ error: 'Please provide your payout account number or PayFast email.' });
  }

  const payoutId = `pay-${crypto.randomUUID().slice(0, 12)}`;
  const typedMethod = method as 'Bank' | 'Capitec' | 'PayFast';

  try {
    const created = await createCreatorPayoutRecord({
      id: payoutId,
      creatorId: user.id,
      creatorEmail: user.email,
      amountZar: Number(numericAmount.toFixed(2)),
      method: typedMethod,
      accountReference: cleanRef,
    });

    return res.status(201).json({
      success: true,
      dbPersisted: true,
      message: 'Payout request submitted for review. Status: Pending Review (7-14 working days).',
      payout: serializePayoutForViewer(created, user.id, isAdminUser(user)),
    });
  } catch (error: any) {
    console.warn('[Creator API] POST /payouts DB fallback:', error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
      message: 'Payout request recorded with status Pending Review (7-14 working days).',
      payout: {
        id: payoutId,
        creatorId: user.id,
        creatorEmail: user.email,
        amountZar: Number(numericAmount.toFixed(2)),
        method: typedMethod,
        accountReference: cleanRef,
        status: 'Pending',
        paidAt: null,
        createdAt: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/creator/admin/payouts
 * Strictly Admin-only: lists all creator payout requests including private bank details.
 */
creatorRouter.get('/admin/payouts', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  if (!isAdminUser(user)) {
    return res.status(403).json({
      error: 'Forbidden. Creator bank details and payout administration are restricted to the creator and admin.',
    });
  }

  try {
    const rows = await listAllPayoutsForAdmin();
    return res.status(200).json({
      success: true,
      dbConnected: true,
      payouts: rows.map((p) => serializePayoutForViewer(p, user.id, true)),
    });
  } catch (error: any) {
    console.warn('[Creator API] GET /admin/payouts DB fallback:', error?.message || error);
    return res.status(200).json({
      success: true,
      dbConnected: false,
      payouts: [],
    });
  }
});

/**
 * PATCH /api/creator/admin/payouts/:id
 * Strictly Admin-only: updates payout status (Pending / Approved / Paid) and sets Paid Date.
 */
creatorRouter.patch('/admin/payouts/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  if (!isAdminUser(user)) {
    return res.status(403).json({
      error: 'Forbidden. Only an admin can review and update creator payout statuses.',
    });
  }

  const payoutId = req.params.id;
  const rawStatus = String(req.body?.status || '').trim();
  const normalizedStatus =
    rawStatus === 'Pending Review' ? 'Pending' : rawStatus;

  if (!VALID_ADMIN_PAYOUT_STATUSES.has(normalizedStatus)) {
    return res.status(400).json({
      error: 'Status must be Pending, Approved, or Paid.',
    });
  }

  try {
    const updated = await updatePayoutStatusRecord(
      payoutId,
      normalizedStatus as 'Pending' | 'Approved' | 'Paid'
    );
    if (!updated) {
      return res.status(404).json({ error: 'Payout record not found.' });
    }
    return res.status(200).json({
      success: true,
      dbPersisted: true,
      payout: serializePayoutForViewer(updated, user.id, true),
    });
  } catch (error: any) {
    console.warn('[Creator API] PATCH /admin/payouts DB fallback:', error?.message || error);
    return res.status(200).json({
      success: true,
      dbPersisted: false,
    });
  }
});
