import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { searchLimiter } from '../middleware/rateLimiting';
import { validateQuery } from '../middleware/validate';
import { osintQuerySchema } from '../validation/schemas';
import { aggregateOSINTData, quickOSINTLookup } from '../services/osintAggregator';
import { searchShodan, getShodanHost } from '../integrations/shodan';
import { getAlienVaultGeneral } from '../integrations/alienvault';
import { getVirusTotalReport } from '../integrations/virustotal';
import { auditLogRepository } from '../repositories/auditLogRepository';

const router = Router();

/**
 * GET /osint/shodan - Shodan host search
 */
router.get('/shodan', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, type = 'search' } = req.query;

  try {
    let data;
    if (type === 'host') {
      data = await getShodanHost(query as string);
    } else {
      data = await searchShodan(query as string);
    }

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'osint_query',
      resource: 'shodan',
      details: { query, type },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Shodan]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /osint/alienvault - AlienVault OTX lookup
 */
router.get('/alienvault', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, type = 'domain' } = req.query;

  try {
    const data = await getAlienVaultGeneral(query as string, type as any);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'osint_query',
      resource: 'alienvault',
      details: { query, type },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[AlienVault]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /osint/virustotal - VirusTotal report lookup
 */
router.get('/virustotal', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, type = 'domain' } = req.query;

  try {
    const data = await getVirusTotalReport(query as string, type as any);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'osint_query',
      resource: 'virustotal',
      details: { query, type },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error: any) {
    console.error('[VirusTotal]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /osint/aggregate - Aggregate all OSINT sources
 */
router.get('/aggregate', authenticate, searchLimiter, validateQuery(osintQuerySchema), async (req: Request, res: Response) => {
  const { query, type = 'domain' } = req.query;

  try {
    const report = await aggregateOSINTData(query as string, type as any);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'osint_aggregate',
      resource: 'all',
      details: {
        query,
        type,
        sources: report.results.map(r => r.source),
        threat_level: report.summary.threat_level
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json(report);
  } catch (error: any) {
    console.error('[OSINT Aggregate]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
