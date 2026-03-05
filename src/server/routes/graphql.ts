import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { GoogleGenAI } from '@google/genai';
import { validateQuery } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

/**
 * Schema for dossier generation request
 */
const dossierSchema = z.object({
  prompt: z.string().min(10).max(5000),
  nodeLabel: z.string().min(1).max(200),
  nodeType: z.string().min(1).max(100),
});

/**
 * POST /api/graphql/dossier - Generate intelligence dossier via Gemini
 *
 * This endpoint safely proxies Gemini API calls from the client.
 * The API key is kept server-side and never exposed to the browser.
 */
router.post('/dossier', authenticate, async (req: Request, res: Response) => {
  const { prompt, nodeLabel, nodeType } = req.body;

  // Validate request body
  try {
    dossierSchema.parse({ prompt, nodeLabel, nodeType });
  } catch (error: any) {
    return res.status(400).json({
      error: 'Invalid request',
      details: error.errors?.[0]?.message || 'Validation failed'
    });
  }

  // Check API key is configured
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'API key not configured',
      message: 'GEMINI_API_KEY environment variable is missing'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'text/plain'
      }
    });

    const generatedText = response.text || 'Analysis complete. No actionable intelligence found.';

    // Log for audit trail
    console.log(`[Dossier Generation] User: ${req.user?.userId}, Entity: ${nodeLabel} (${nodeType})`);

    res.json({
      success: true,
      content: generatedText,
      metadata: {
        entity: nodeLabel,
        type: nodeType,
        timestamp: new Date().toISOString(),
        model: 'gemini-2.0-flash-exp'
      }
    });
  } catch (error: any) {
    console.error('[Dossier Generation Error]', error);

    // Provide user-friendly error message
    const errorMessage = error.message?.includes('API')
      ? 'Failed to connect to intelligence synthesis engine'
      : 'Error: Intelligence Synthesis Failed. Connection to Neural Core interrupted.';

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
