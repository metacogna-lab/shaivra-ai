import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import { searchLimiter } from '../middleware/rateLimiting';
import {
  queueSherlockSearch,
  queueTheHarvesterSearch,
  getJobStatus,
  getQueueStats,
  sherlockQueue,
  theharvesterQueue
} from '../services/cliOrchestrator';
import { checkSherlockHealth, type SherlockResult } from '../integrations/sherlock';
import { checkTheHarvesterHealth, getAvailableSources } from '../integrations/theharvester';
import { auditLogRepository } from '../repositories/auditLogRepository';

const router = Router();

/**
 * POST /cli/sherlock - Queue Sherlock username search
 */
router.post('/sherlock', authenticate, searchLimiter, async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'username required' });
  }

  try {
    const job = await queueSherlockSearch(username);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'cli_tool_sherlock',
      resource: 'username',
      details: { username, job_id: job.id },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Sherlock job queued',
      job_id: job.id,
      status_url: `/api/cli/job/${job.id}`,
      queue: 'sherlock'
    });
  } catch (error: any) {
    console.error('[Sherlock Queue]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /cli/theharvester - Queue TheHarvester domain harvest
 */
router.post('/theharvester', authenticate, searchLimiter, async (req: Request, res: Response) => {
  const { domain, source = 'google', limit = 500 } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'domain required' });
  }

  try {
    const job = await queueTheHarvesterSearch(domain, source, limit);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'cli_tool_theharvester',
      resource: 'domain',
      details: { domain, source, limit, job_id: job.id },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'TheHarvester job queued',
      job_id: job.id,
      status_url: `/api/cli/job/${job.id}`,
      queue: 'theharvester',
      available_sources: getAvailableSources()
    });
  } catch (error: any) {
    console.error('[TheHarvester Queue]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /cli/job/:jobId - Get job status
 */
router.get('/job/:jobId', authenticate, async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { queue = 'sherlock' } = req.query;

  try {
    const targetQueue = queue === 'theharvester' ? theharvesterQueue : sherlockQueue;
    const status = await getJobStatus(targetQueue, jobId);

    res.json(status);
  } catch (error: any) {
    console.error('[Job Status]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /cli/stats - Get queue statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const [sherlockStats, theharvesterStats] = await Promise.all([
      getQueueStats(sherlockQueue),
      getQueueStats(theharvesterQueue)
    ]);

    const [sherlockHealth, theharvesterHealth] = await Promise.all([
      checkSherlockHealth(),
      checkTheHarvesterHealth()
    ]);

    res.json({
      queues: {
        sherlock: sherlockStats,
        theharvester: theharvesterStats
      },
      health: {
        sherlock: sherlockHealth,
        theharvester: theharvesterHealth
      }
    });
  } catch (error: any) {
    console.error('[CLI Stats]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
