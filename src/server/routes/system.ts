/**
 * System endpoints: pipeline integrity and OSINT adapter validation.
 */

import { Router, Request, Response } from 'express';
import { runPipelineIntegrity, validateOsintAdapters } from '../integrity';

const router = Router();

/**
 * GET /system/integrity - Run pipeline configuration integrity checks.
 * Returns tool registry, signal schema, Redpanda topics, and graph schema status.
 */
router.get('/integrity', async (_req: Request, res: Response) => {
  try {
    const result = await runPipelineIntegrity();
    const status = result.ok ? 200 : 503;
    res.status(status).json({
      ok: result.ok,
      toolRegistry: result.toolRegistry,
      signalSchema: result.signalSchema,
      redpanda: result.redpanda,
      graphSchema: result.graphSchema,
      errors: result.errors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[System Integrity]', error);
    res.status(500).json({ ok: false, errors: [message] });
  }
});

/**
 * GET /system/adapters - Validate all OSINT tool adapters against canonical contract.
 * Returns per-tool: reachable, entity types match, canonical signals, rate/retry.
 */
router.get('/adapters', async (_req: Request, res: Response) => {
  try {
    const result = validateOsintAdapters();
    const status = result.ok ? 200 : 503;
    res.status(status).json({
      ok: result.ok,
      checks: result.checks,
      deviations: result.deviations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Adapter Validation]', error);
    res.status(500).json({ ok: false, errors: [message] });
  }
});

export default router;
