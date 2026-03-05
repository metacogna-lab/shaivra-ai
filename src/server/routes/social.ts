import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { searchLimiter } from '../middleware/rateLimiting';
import { validateQuery } from '../middleware/validate';
import { osintQuerySchema } from '../validation/schemas';
import { aggregateSocialMedia, monitorUser } from '../services/socialMediaAggregator';
import { searchTweets, getUserTweets } from '../integrations/twitter';
import { searchReddit, searchSubreddit } from '../integrations/reddit';
import { auditLogRepository } from '../repositories/auditLogRepository';

const router = Router();

/**
 * GET /social/twitter/search - Search recent tweets
 */
router.get('/twitter/search', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, max_results = 10 } = req.query;

  try {
    const data = await searchTweets(query as string, parseInt(max_results as string));

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'social_media_query',
      resource: 'twitter',
      details: { query, max_results },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Twitter Search]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /social/reddit/search - Search Reddit posts
 */
router.get('/reddit/search', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, limit = 25, sort = 'relevance' } = req.query;

  try {
    const data = await searchReddit(query as string, parseInt(limit as string), sort as any);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'social_media_query',
      resource: 'reddit',
      details: { query, limit, sort },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Reddit Search]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /social/aggregate - Search both Twitter and Reddit
 */
router.get('/aggregate', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, platforms = 'twitter,reddit', limit = 25 } = req.query;

  try {
    const platformList = (platforms as string)
      .split(',')
      .filter(p => p === 'twitter' || p === 'reddit') as ('twitter' | 'reddit')[];

    const data = await aggregateSocialMedia(query as string, platformList, parseInt(limit as string));

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'social_media_aggregate',
      resource: 'all',
      details: { query, platforms: platformList, limit },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Social Aggregate]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /social/monitor/:username - Monitor user across platforms
 */
router.get('/monitor/:username', authenticate, searchLimiter, async (req: Request, res: Response) => {
  const { username } = req.params;
  const { platforms = 'twitter,reddit' } = req.query;

  try {
    const platformList = (platforms as string)
      .split(',')
      .filter(p => p === 'twitter' || p === 'reddit') as ('twitter' | 'reddit')[];

    const data = await monitorUser(username, platformList);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'social_media_monitor',
      resource: 'user',
      details: { username, platforms: platformList },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Social Monitor]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
