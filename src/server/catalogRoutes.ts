import express, { Request, Response } from 'express';
import {
  LAUNCH_AWARD_ID,
  LAUNCH_AWARD_SUBTITLE,
  LAUNCH_AWARD_TITLE,
  LAUNCH_ISSUE_EDITION_LABEL,
  LAUNCH_ISSUE_HEADLINE,
  LAUNCH_ISSUE_ID,
  LAUNCH_ISSUE_NUMBER,
  getPublicCatalogMetrics,
  recordLiveChapterView,
  toggleCreatorFollowInDb,
} from '../db/catalog.ts';

export const catalogRouter = express.Router();

/**
 * GET /api/catalog
 * Returns real Neon/Postgres views, likes, chapter reads, active launch issue, awards state, and follower counts.
 */
catalogRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getPublicCatalogMetrics();
    return res.status(200).json({
      dbConnected: true,
      ...data,
    });
  } catch (error: any) {
    console.warn('[Catalog API] DB unavailable, returning zeroed launch defaults:', error?.message || error);
    return res.status(200).json({
      dbConnected: false,
      mangas: [],
      chapters: [],
      activeIssue: {
        id: LAUNCH_ISSUE_ID,
        issueNumber: LAUNCH_ISSUE_NUMBER,
        editionLabel: LAUNCH_ISSUE_EDITION_LABEL,
        headline: LAUNCH_ISSUE_HEADLINE,
        isActive: true,
      },
      awards: {
        id: LAUNCH_AWARD_ID,
        year: 2026,
        title: LAUNCH_AWARD_TITLE,
        subtitle: LAUNCH_AWARD_SUBTITLE,
        status: 'coming_soon',
        winnerMangaId: null,
        winnerCitation: null,
        votesCount: 0,
      },
      followerCounts: {},
    });
  }
});

/**
 * POST /api/catalog/chapter-view
 * Increments views (+1) on Live manga & reads (+1) on Live chapter ONLY when a real user opens a real chapter.
 */
catalogRouter.post('/chapter-view', async (req: Request, res: Response) => {
  const mangaId = typeof req.body?.mangaId === 'string' ? req.body.mangaId.trim() : '';
  const chapterId = typeof req.body?.chapterId === 'string' ? req.body.chapterId.trim() : '';

  if (!mangaId || !chapterId) {
    return res.status(400).json({ error: 'mangaId and chapterId are required.' });
  }

  try {
    const result = await recordLiveChapterView(mangaId, chapterId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.warn('[Catalog API] chapter-view error:', error?.message || error);
    return res.status(200).json({ counted: false, error: 'Database unavailable' });
  }
});

/**
 * POST /api/catalog/creator-follow
 * Persists real follow/unfollow events and returns the real DB follower count for that creator.
 */
catalogRouter.post('/creator-follow', async (req: Request, res: Response) => {
  const creatorId = typeof req.body?.creatorId === 'string' ? req.body.creatorId.trim() : '';
  const creatorName = typeof req.body?.creatorName === 'string' ? req.body.creatorName.trim() : '';
  const followerKey = typeof req.body?.followerKey === 'string' ? req.body.followerKey.trim() : '';
  const action = req.body?.action === 'unfollow' ? 'unfollow' : 'follow';

  if (!creatorId || !creatorName || !followerKey) {
    return res.status(400).json({ error: 'creatorId, creatorName, and followerKey are required.' });
  }

  try {
    const result = await toggleCreatorFollowInDb({
      creatorId,
      creatorName,
      followerKey,
      action,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.warn('[Catalog API] creator-follow error:', error?.message || error);
    return res.status(200).json({ success: false, followersCount: 0 });
  }
});
