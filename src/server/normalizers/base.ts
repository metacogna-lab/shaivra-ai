/**
 * Base Normalizer Interface
 * 
 * All OSINT tool normalizers must implement this interface to transform
 * tool-specific output into the canonical IntelligenceEvent schema.
 * 
 * @module normalizers/base
 */

import type { IntelligenceEvent } from '../../contracts';

/**
 * Base Normalizer Interface
 * 
 * @template TRawOutput - The tool-specific raw output type
 */
export interface BaseNormalizer<TRawOutput = any> {
  /**
   * Tool name (must match OSINT integration name)
   */
  readonly toolName: string;

  /**
   * Normalize tool output to canonical IntelligenceEvent
   * 
   * @param rawOutput - Raw tool output
   * @param target - Investigation target (IP, domain, username, etc.)
   * @param traceId - Trace ID linking to investigation or query
   * @param investigationId - Optional investigation foreign key
   * @returns Normalized IntelligenceEvent
   */
  normalize(
    rawOutput: TRawOutput,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent;

  /**
   * Validate raw output structure (optional)
   * 
   * @param rawOutput - Raw tool output
   * @returns True if valid, false otherwise
   */
  validate?(rawOutput: TRawOutput): boolean;
}

/**
 * Abstract base class with common normalization utilities
 */
export abstract class AbstractNormalizer<TRawOutput = any> implements BaseNormalizer<TRawOutput> {
  abstract readonly toolName: string;

  abstract normalize(
    rawOutput: TRawOutput,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent;

  /**
   * Calculate confidence score based on data quality indicators
   * Override this in subclasses for tool-specific logic
   */
  protected calculateConfidence(data: any): number {
    // Default: 0.7 (moderate confidence for any data returned)
    return 0.7;
  }

  /**
   * Generate unique UUID v4
   */
  protected generateId(): string {
    // Use crypto.randomUUID() if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create base IntelligenceEvent structure
   */
  protected createBaseEvent(
    target: string,
    traceId: string,
    investigationId?: string,
    executionTime: number = 0
  ): IntelligenceEvent {
    return {
      id: this.generateId(),
      traceId,
      investigationId,
      tool: this.toolName,
      target,
      timestamp: new Date(),
      status: 'success',
      entities: [],
      observations: [],
      relationships: [],
      metadata: {
        executionTime,
        errors: []
      }
    };
  }
}
