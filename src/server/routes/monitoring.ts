import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import {
  getInvestigationTraces,
  createInvestigationLineage,
  verifyInvocation,
  exportInvestigationAudit
} from '../services/llmMonitoring';
import { auditLogRepository } from '../repositories/auditLogRepository';

const router = Router();

/**
 * GET /monitoring/llm-calls - Get all LLM calls with traces
 */
router.get('/llm-calls', authenticate, adminOnly, async (req: Request, res: Response) => {
  const { limit = 100 } = req.query;

  try {
    const calls = await auditLogRepository.findLLMCalls(parseInt(limit as string));

    res.json({
      total: calls.length,
      calls: calls.map(call => {
        const details = (call.details as any) || {};
        return {
          id: call.id,
          timestamp: call.createdAt,
          invocation_id: details.invocation_id,
          invocation_hash: details.invocation_hash,
          model: details.model,
          investigation_uuid: details.investigation_uuid,
          duration_ms: details.duration_ms,
          action: call.action,
          user: call.user
        };
      })
    });
  } catch (error: any) {
    console.error('[LLM Calls]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /monitoring/investigation/:investigationUUID/traces - Get all traces for investigation
 */
router.get('/investigation/:investigationUUID/traces', authenticate, async (req: Request, res: Response) => {
  const { investigationUUID } = req.params;

  try {
    // @ts-ignore - Express type definitions don't properly infer userId as string
    const traces = await getInvestigationTraces(investigationUUID, req.user?.userId || '');

    res.json({
      investigationUUID,
      totalTraces: traces.length,
      traces: traces.map(t => {
        const details = (t.details as any) || {};
        return {
          timestamp: t.createdAt,
          invocation_id: details.invocation_id,
          invocation_hash: details.invocation_hash,
          model: details.model,
          duration_ms: details.duration_ms,
          prompt_length: details.prompt_length,
          response_length: details.response_length
        };
      })
    });
  } catch (error: any) {
    console.error('[Investigation Traces]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /monitoring/investigation/:investigationUUID/lineage - Get investigation lineage document
 */
router.get('/investigation/:investigationUUID/lineage', authenticate, async (req: Request, res: Response) => {
  const { investigationUUID } = req.params;
  const targetParam = Array.isArray(req.query.target) ? req.query.target[0] : (req.query.target as string || 'unknown');

  try {
    // @ts-ignore - Express type definitions don't properly infer userId as string
    const lineage = await createInvestigationLineage(investigationUUID, req.user?.userId || '', targetParam);

    res.json({
      ...lineage,
      audit_trail_hash: Buffer.from(JSON.stringify(lineage)).toString('hex')
    });
  } catch (error: any) {
    console.error('[Investigation Lineage]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /monitoring/investigation/:investigationUUID/audit - Export audit trail
 */
router.get('/investigation/:investigationUUID/audit', authenticate, async (req: Request, res: Response) => {
  const { investigationUUID } = req.params;
  const formatParam = (Array.isArray(req.query.format) ? req.query.format[0] : req.query.format) || 'json';

  try {
    // @ts-ignore - Express type definitions don't properly infer userId as string
    const audit = await exportInvestigationAudit(
      investigationUUID,
      req.user?.userId || '',
      formatParam as 'json' | 'csv'
    );

    res.set('Content-Type', formatParam === 'csv' ? 'text/csv' : 'application/json');
    res.set('Content-Disposition', `attachment; filename="audit-${investigationUUID}.${formatParam === 'csv' ? 'csv' : 'json'}"`);
    res.send(audit);
  } catch (error: any) {
    console.error('[Audit Export]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /monitoring/verify-invocation - Verify invocation integrity
 */
router.post('/verify-invocation', authenticate, adminOnly, async (req: Request, res: Response) => {
  const { invocationId, expectedHash } = req.body;

  if (!invocationId || !expectedHash) {
    return res.status(400).json({ error: 'invocationId and expectedHash required' });
  }

  try {
    const isValid = await verifyInvocation(invocationId, expectedHash);

    res.json({
      invocationId,
      isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Invocation Verification]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /monitoring/stats - Get monitoring statistics
 */
router.get('/stats', authenticate, adminOnly, async (req: Request, res: Response) => {
  const { days = 7 } = req.query;

  try {
    const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const actionStats = await auditLogRepository.getActionStats(startDate, endDate);
    const llmCalls = await auditLogRepository.findLLMCalls(500);

    const geminiCallStats = {
      total: llmCalls.filter(c => c.action === 'gemini_call').length,
      failed: llmCalls.filter(c => c.action === 'gemini_call_failed').length,
      totalDuration: llmCalls.reduce((sum, c) => {
        const details = (c.details as any) || {};
        return sum + (details.duration_ms || 0);
      }, 0),
      averageDuration: Math.round(
        llmCalls.reduce((sum, c) => {
          const details = (c.details as any) || {};
          return sum + (details.duration_ms || 0);
        }, 0) / Math.max(llmCalls.length, 1)
      )
    };

    res.json({
      period: { startDate, endDate, days: parseInt(days as string) },
      actionStats,
      geminiStats: geminiCallStats,
      totalAuditLogs: actionStats.reduce((sum, s) => sum + s.count, 0)
    });
  } catch (error: any) {
    console.error('[Monitoring Stats]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
