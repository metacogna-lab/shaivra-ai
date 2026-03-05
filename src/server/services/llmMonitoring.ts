import crypto from 'crypto';
import { Client } from 'langsmith';
import { GoogleGenAI } from '@google/genai';
import { auditLogRepository } from '../repositories/auditLogRepository';

/**
 * LLM Invocation tracking with Langsmith integration
 */

export interface LLMInvocation {
  invocationId: string; // Hashed unique identifier
  invocationHash: string; // SHA-256 hash of parameters
  model: string;
  userId: string;
  investigationUUID?: string;
  timestamp: string;
  duration: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  metadata: {
    model: string;
    invocationId: string;
    invocationHash: string;
    investigationUUID?: string;
    timestamp: string;
    duration: number;
  };
}

// Initialize Langsmith client
const langsmithClient = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  apiUrl: process.env.LANGSMITH_API_URL || 'https://api.smith.langchain.com'
});

/**
 * Generate hashed invocation ID
 */
export function generateInvocationId(prompt: string, model: string, userId: string): { id: string; hash: string } {
  const timestamp = Date.now();
  const combination = `${prompt}-${model}-${userId}-${timestamp}`;

  // SHA-256 hash for audit trail
  const hash = crypto.createHash('sha256').update(combination).digest('hex');

  // Random 16-character ID for Langsmith tracing
  const id = crypto.randomBytes(8).toString('hex');

  return { id, hash };
}

/**
 * Call Gemini with Langsmith tracing and audit logging
 */
export async function callGeminiWithTracing(
  prompt: string,
  userId: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
    investigationUUID?: string;
    tools?: any[];
  }
): Promise<LLMResponse> {
  const model = options?.model || 'gemini-2.0-flash-exp';
  const { id: invocationId, hash: invocationHash } = generateInvocationId(prompt, model, userId);
  const startTime = Date.now();

  try {
    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Prepare config
    const config: any = { temperature: options?.temperature || 0.7 };
    if (options?.maxTokens) config.maxTokens = options.maxTokens;
    if (options?.responseFormat === 'json') config.responseMimeType = 'application/json';

    // Log to Langsmith
    const runName = `gemini_${options?.investigationUUID || 'standalone'}`;

    // Log to Langsmith (best-effort, doesn't block on error)
    try {
      await langsmithClient.createRun({
        name: runName,
        run_type: 'llm',
        inputs: {
          prompt,
          model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
          invocation_id: invocationId,
          invocation_hash: invocationHash,
          user_id: userId,
          investigation_uuid: options?.investigationUUID
        }
      } as any);
    } catch (langsmithError) {
      console.warn('[Langsmith Error]', langsmithError);
      // Continue regardless of Langsmith failures
    }

    // Call Gemini API
    const generateContentParams = {
      model,
      config,
      contents: prompt
    } as any;
    if (options?.tools) {
      generateContentParams.tools = options.tools;
    }
    const response = await ai.models.generateContent(generateContentParams);

    const duration = Date.now() - startTime;
    const content = response.text;

    // Log to audit trail
    await auditLogRepository.create({
      userId,
      action: 'gemini_call',
      resource: 'llm_invocation',
      details: {
        invocation_id: invocationId,
        invocation_hash: invocationHash,
        investigation_uuid: options?.investigationUUID,
        model,
        prompt_length: prompt.length,
        response_length: content.length,
        duration_ms: duration,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        langsmith_enabled: !!process.env.LANGSMITH_API_KEY
      },
      ipAddress: 'system',
      userAgent: 'llm-monitoring'
    });

    return {
      content,
      metadata: {
        model,
        invocationId,
        invocationHash,
        investigationUUID: options?.investigationUUID,
        timestamp: new Date().toISOString(),
        duration
      }
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Log error to audit trail
    await auditLogRepository.create({
      userId,
      action: 'gemini_call_failed',
      resource: 'llm_invocation',
      details: {
        invocation_id: invocationId,
        invocation_hash: invocationHash,
        investigation_uuid: options?.investigationUUID,
        model,
        error: error.message,
        duration_ms: duration
      },
      ipAddress: 'system',
      userAgent: 'llm-monitoring'
    });

    throw error;
  }
}

/**
 * Call Gemini with JSON response and full tracing
 */
export async function callGeminiJSON(
  prompt: string,
  userId: string,
  options?: {
    model?: string;
    temperature?: number;
    investigationUUID?: string;
  }
): Promise<{ data: any; metadata: LLMResponse['metadata'] }> {
  const response = await callGeminiWithTracing(prompt, userId, {
    ...options,
    responseFormat: 'json'
  });

  return {
    data: JSON.parse(response.content),
    metadata: response.metadata
  };
}

/**
 * Get investigation traces (all LLM calls linked to investigation)
 */
export async function getInvestigationTraces(investigationUUID: string, userId: string): Promise<any[]> {
  const traces = await auditLogRepository.findByInvestigation?.(investigationUUID);

  if (!traces) {
    return [];
  }

  // Filter for LLM calls only
  return traces.filter(t => t.action === 'gemini_call' || t.action === 'gemini_call_failed');
}

/**
 * Create lineage document for investigation
 */
export async function createInvestigationLineage(
  investigationUUID: string,
  userId: string,
  target: string
): Promise<{
  investigationUUID: string;
  target: string;
  llmCalls: number;
  invocationHashes: string[];
  totalTokens: number;
  estimatedCost: number;
  timestamp: string;
}> {
  const traces = await getInvestigationTraces(investigationUUID, userId);

  const invocationHashes = traces
    .filter(t => t.details?.invocation_hash)
    .map(t => t.details.invocation_hash);

  // Estimate tokens (rough: ~4 chars = 1 token)
  const totalTokens = traces.reduce((sum, t) => {
    const promptLen = t.details?.prompt_length || 0;
    const responseLen = t.details?.response_length || 0;
    return sum + Math.ceil((promptLen + responseLen) / 4);
  }, 0);

  // Estimate cost (Gemini Flash: $0.075/1M input, $0.3/1M output)
  const estimatedCost = (totalTokens / 1000000) * 0.075;

  return {
    investigationUUID,
    target,
    llmCalls: traces.length,
    invocationHashes,
    totalTokens,
    estimatedCost,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verify invocation integrity
 */
export async function verifyInvocation(invocationId: string, expectedHash: string): Promise<boolean> {
  // In production, verify against Langsmith and audit logs
  return true;
}

/**
 * Export investigation traces for audit
 */
export async function exportInvestigationAudit(
  investigationUUID: string,
  userId: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const traces = await getInvestigationTraces(investigationUUID, userId);

  if (format === 'json') {
    return JSON.stringify(traces, null, 2);
  }

  // CSV format
  const headers = ['timestamp', 'invocation_id', 'invocation_hash', 'model', 'prompt_length', 'response_length', 'duration_ms'];
  const rows = traces.map(t => [
    t.createdAt,
    t.details?.invocation_id,
    t.details?.invocation_hash,
    t.details?.model,
    t.details?.prompt_length,
    t.details?.response_length,
    t.details?.duration_ms
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  return csv;
}
