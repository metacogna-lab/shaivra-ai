/**
 * Intelligence Orchestrator
 *
 * High-level service that combines ToolSelector and osintAggregator
 * to intelligently gather and normalize OSINT data.
 */

import { toolSelector, type ToolSelectionRequest } from './toolSelector';
import { quickOSINTLookup, aggregateOSINTData, type OSINTResult } from './osintAggregator';
import type { IntelligenceEvent } from '../../types/intelligence';

export interface IntelligenceGatheringRequest {
  /** Target identifier */
  target: string;

  /** Entity type (auto-detected if not provided) */
  entityType?: 'person' | 'organization' | 'infrastructure' | 'event' | 'unknown';

  /** Gather mode: 'fast' (top 2 tools), 'comprehensive' (all tools), 'custom' */
  mode?: 'fast' | 'comprehensive' | 'custom';

  /** Custom tool selection (only used if mode='custom') */
  tools?: string[];

  /** Rank tools by signal quality */
  ranked?: boolean;

  /** Optimize for cost */
  costAware?: boolean;
}

export interface IntelligenceGatheringResult {
  target: string;
  entityType: string;
  toolsUsed: string[];
  events: IntelligenceEvent[];
  errors: Array<{
    tool: string;
    error: string;
  }>;
  metadata: {
    executionTime: number;
    successfulTools: number;
    failedTools: number;
    totalEntities: number;
    totalObservations: number;
    totalRelationships: number;
  };
}

/**
 * Intelligence Orchestrator
 *
 * Intelligently selects and executes OSINT tools, normalizing all output
 * to canonical IntelligenceEvent schema.
 */
export class IntelligenceOrchestrator {
  /**
   * Gather intelligence using smart tool selection
   */
  async gatherIntelligence(request: IntelligenceGatheringRequest): Promise<IntelligenceGatheringResult> {
    const startTime = Date.now();

    // Step 1: Select appropriate tools
    const tools = this.selectTools(request);

    console.log(`[IntelligenceOrchestrator] Selected ${tools.length} tools for ${request.target}: ${tools.join(', ')}`);

    // Step 2: Execute tools in parallel
    const results = await this.executeTools(request.target, tools);

    // Step 3: Extract IntelligenceEvents and track errors
    const events: IntelligenceEvent[] = [];
    const errors: Array<{ tool: string; error: string }> = [];
    let successfulTools = 0;
    let failedTools = 0;

    for (const result of results) {
      if (result.success && result.event) {
        events.push(result.event);
        successfulTools++;
      } else {
        errors.push({
          tool: result.source,
          error: result.error || 'Unknown error'
        });
        failedTools++;
      }
    }

    // Step 4: Calculate aggregate statistics
    const totalEntities = events.reduce((sum, e) => sum + e.entities.length, 0);
    const totalObservations = events.reduce((sum, e) => sum + e.observations.length, 0);
    const totalRelationships = events.reduce((sum, e) => sum + e.relationships.length, 0);

    const executionTime = Date.now() - startTime;

    console.log(`[IntelligenceOrchestrator] Gathered ${totalEntities} entities, ${totalObservations} observations from ${successfulTools}/${tools.length} tools in ${executionTime}ms`);

    return {
      target: request.target,
      entityType: request.entityType || 'unknown',
      toolsUsed: tools,
      events,
      errors,
      metadata: {
        executionTime,
        successfulTools,
        failedTools,
        totalEntities,
        totalObservations,
        totalRelationships
      }
    };
  }

  /**
   * Select tools based on request criteria
   */
  private selectTools(request: IntelligenceGatheringRequest): string[] {
    if (request.mode === 'custom' && request.tools) {
      return request.tools;
    }

    const selectionRequest: ToolSelectionRequest = {
      target: request.target,
      entityType: request.entityType,
      ranked: request.ranked !== false, // Default to true
      costAware: request.costAware
    };

    if (request.mode === 'fast') {
      selectionRequest.maxTools = 2; // Top 2 highest-signal tools
    }

    return toolSelector.selectTools(selectionRequest);
  }

  /**
   * Execute selected tools in parallel
   */
  private async executeTools(target: string, tools: string[]): Promise<OSINTResult[]> {
    const promises = tools.map(async (tool) => {
      try {
        // Determine resource type for tool
        const type = this.inferResourceType(target);
        return await quickOSINTLookup(target, tool as any, type);
      } catch (error: any) {
        return {
          source: tool as any,
          success: false,
          error: error.message,
          cached: false,
          timestamp: new Date().toISOString()
        };
      }
    });

    return await Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled'
          ? result.value
          : {
              source: 'unknown' as any,
              success: false,
              error: result.reason?.message || 'Promise rejected',
              cached: false,
              timestamp: new Date().toISOString()
            }
      )
    );
  }

  /**
   * Infer resource type from target string
   */
  private inferResourceType(target: string): 'domain' | 'ip' | 'url' | 'hostname' {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(target)) return 'ip';

    if (target.startsWith('http://') || target.startsWith('https://')) return 'url';

    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (domainPattern.test(target)) return 'domain';

    return 'hostname';
  }
}

// Export singleton instance
export const intelligenceOrchestrator = new IntelligenceOrchestrator();
