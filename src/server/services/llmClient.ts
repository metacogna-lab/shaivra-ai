import { GoogleGenAI } from "@google/genai";
import crypto from 'node:crypto';
import { Client as LangSmithClient } from 'langsmith';
import { v4 as uuidv4 } from 'uuid';

let DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || undefined;
const LANGSMITH_ENABLED = process.env.LANGSMITH_TRACING === 'true' && !!process.env.LANGSMITH_API_KEY;
const LANGSMITH_ENDPOINT = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || 'shaivra-intel';

const langsmithClient = LANGSMITH_ENABLED
  ? new LangSmithClient({
      apiUrl: LANGSMITH_ENDPOINT,
      apiKey: process.env.LANGSMITH_API_KEY,
    })
  : null;

export interface LineageInfo {
  traceId: string;
  transactionId: string;
  lineageHash: string;
}

export const ensureTransactionId = (candidate?: string): string => {
  if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate;
  }
  return uuidv4();
};

interface GenerateContentPayload {
  model: string;
  contents: any;
  config?: Record<string, unknown>;
}

export async function callTrackedGemini(
  operationName: string,
  payload: GenerateContentPayload,
  transactionId?: string,
  metadata: Record<string, unknown> = {},
  apiKeyOverride?: string
): Promise<{ response: any; lineage: LineageInfo }> {
  const apiKey = apiKeyOverride || DEFAULT_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const txnId = ensureTransactionId(transactionId);
  const traceId = `trace-${txnId}`;
  const lineageHash = crypto
    .createHash('sha256')
    .update(`${txnId}:${operationName}:${JSON.stringify(payload.contents).slice(0, 512)}`)
    .digest('hex');

  const ai = new GoogleGenAI({ apiKey });
  const start = new Date();

  try {
    const response = await ai.models.generateContent(payload);

    if (langsmithClient) {
      await langsmithClient.createRun({
        name: operationName,
        run_type: 'llm',
        project_name: LANGSMITH_PROJECT,
        start_time: start.toISOString(),
        end_time: new Date().toISOString(),
        inputs: { ...payload, transactionId: txnId, lineageHash, metadata },
        outputs: { text: response?.text },
        tags: [operationName, traceId],
        metadata: { transactionId: txnId, lineageHash, ...metadata },
      } as any);
    }

    return { response, lineage: { traceId, transactionId: txnId, lineageHash } };
  } catch (error: any) {
    if (langsmithClient) {
      await langsmithClient.createRun({
        name: operationName,
        run_type: 'llm',
        project_name: LANGSMITH_PROJECT,
        start_time: start.toISOString(),
        end_time: new Date().toISOString(),
        inputs: { ...payload, transactionId: txnId, lineageHash, metadata },
        error: error?.message || String(error),
        tags: [operationName, traceId, 'error'],
        metadata: { transactionId: txnId, lineageHash, ...metadata },
      } as any);
    }
    throw error;
  }
}
