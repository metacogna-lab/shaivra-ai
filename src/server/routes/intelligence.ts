import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from '../middleware/authenticate';
import { searchLimiter, aiLimiter } from '../middleware/rateLimiting';
import { validateBody, validateQuery } from '../middleware/validate';
import { searchSchema, reportSchema, orgProfileSchema } from '../validation/schemas';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { investigationRepository } from '../repositories/investigationRepository';
import { intelligenceOrchestrator } from '../services/intelligenceOrchestrator';
import crypto from 'crypto';

const router = Router();

/**
 * POST /intelligence/gather - Gather intelligence for a target (orchestrator + standardise & deduplicate).
 * Optional auth: use authenticate for protected deployments; CLI may call without auth on localhost.
 */
router.post('/gather', aiLimiter, async (req: Request, res: Response) => {
  const { target, entityType, mode, tools } = req.body || {};
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'target (string) required' });
  }
  try {
    const result = await intelligenceOrchestrator.gatherIntelligence({
      target: target.trim(),
      entityType,
      mode: mode || 'fast',
      tools,
    });
    res.json(result);
  } catch (error: any) {
    console.error('[Intelligence Gather]', error);
    res.status(500).json({ error: error.message || 'Gather failed' });
  }
});

/**
 * POST /intelligence/search - Web search with Gemini grounding
 */
router.post('/search', authenticate, aiLimiter, validateBody(searchSchema), async (req: Request, res: Response) => {
  const { query, traceId } = req.body;
  const invocationId = crypto.randomBytes(16).toString('hex');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: query,
      tools: [{ googleSearch: {} }]
    } as any);

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'gemini_search',
      resource: 'search',
      details: {
        query,
        invocation_id: invocationId,
        trace_id: traceId,
        sources_count: sources.length,
        response_length: text.length
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      text,
      sources,
      traceId,
      invocationId,
      raw: response
    });
  } catch (error: any) {
    console.error('[Web Search]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /intelligence/summarize - Summarize OSINT data
 */
router.post('/summarize', authenticate, aiLimiter, validateBody(reportSchema), async (req: Request, res: Response) => {
  const { data, target } = req.body;
  const invocationId = crypto.randomBytes(16).toString('hex');

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Analyze the following OSINT data for target "${target}" and provide a summary of key security insights, risks, and recommended next steps.\n\nData:\n${JSON.stringify(data, null, 2)}`
    });

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'gemini_summarize',
      resource: 'summary',
      details: {
        target,
        invocation_id: invocationId,
        data_size: JSON.stringify(data).length,
        response_length: response.text.length
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      summary: response.text,
      invocationId,
      target
    });
  } catch (error: any) {
    console.error('[Summarize]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /intelligence/report - Generate strategic intelligence report
 */
router.post('/report', authenticate, aiLimiter, validateBody(reportSchema), async (req: Request, res: Response) => {
  const { pipelineData, target } = req.body;
  const invocationId = crypto.randomBytes(16).toString('hex');

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Generate report using Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      config: {
        responseMimeType: 'application/json'
      },
      contents: `Generate a strategic intelligence report for "${target}" based on this OSINT pipeline data:\n\n${JSON.stringify(pipelineData, null, 2).substring(0, 3000)}`
    });

    const reportData = JSON.parse(response.text);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'gemini_report',
      resource: 'report',
      details: {
        target,
        invocation_id: invocationId,
        pipeline_size: JSON.stringify(pipelineData).length,
        report_length: response.text.length
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      report: reportData,
      invocationId,
      target,
      generated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Report Generation]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /intelligence/org-profile - Generate organization profile
 */
router.post('/org-profile', authenticate, aiLimiter, validateBody(orgProfileSchema), async (req: Request, res: Response) => {
  const { orgName, objective } = req.body;
  const invocationId = crypto.randomBytes(16).toString('hex');

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      config: {
        responseMimeType: 'application/json'
      },
      contents: `Create an intelligence profile for organization "${orgName}" with objective: "${objective}". Return JSON with profile data.`
    });

    const profile = JSON.parse(response.text);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'gemini_org_profile',
      resource: 'org_profile',
      details: {
        org_name: orgName,
        objective,
        invocation_id: invocationId,
        profile_fields: Object.keys(profile || {}).length
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      profile,
      invocationId,
      organization: orgName
    });
  } catch (error: any) {
    console.error('[Org Profile]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
