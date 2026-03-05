/**
 * VirusTotal Normalizer
 */

import { AbstractNormalizer } from './base';
import type { IntelligenceEvent, EntityReference, Observation } from '../../contracts';
import type { VirusTotalResponse } from '../integrations/virustotal';

export class VirusTotalNormalizer extends AbstractNormalizer<VirusTotalResponse> {
  readonly toolName = 'virustotal';

  normalize(
    rawOutput: VirusTotalResponse,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent {
    const startTime = Date.now();
    const event = this.createBaseEvent(target, traceId, investigationId);
    event.metadata.raw = rawOutput;

    const attrs = rawOutput.data.attributes;
    const type = rawOutput.data.type;

    // Create entity based on resource type
    const entity = this.createEntity(target, type as string, attrs);
    event.entities.push(entity);

    // Create threat observations
    const observations = this.createThreatObservations(entity.id, attrs, traceId);
    event.observations.push(...observations);

    event.metadata.executionTime = Date.now() - startTime;
    return event;
  }

  private createEntity(target: string, type: string, attrs: any): EntityReference {
    const now = new Date();
    const entityType = type === 'ip_address' ? 'infrastructure' : 
                      (type === 'domain' || type === 'url') ? 'infrastructure' : 'unknown';

    return {
      id: this.generateId(),
      type: entityType,
      name: target,
      aliases: [],
      confidence: this.calculateVTConfidence(attrs),
      attributes: {
        reputation: attrs.reputation,
        categories: attrs.categories || {},
        tags: attrs.tags || [],
        last_analysis_date: new Date(attrs.last_analysis_date * 1000),
        popularity_ranks: attrs.popularity_ranks || {}
      },
      sourceIds: [],
      firstSeen: now,
      lastSeen: now,
      metadata: {
        verified: false,
        tags: attrs.tags || [],
        notes: `Discovered via VirusTotal scan`
      }
    };
  }

  private createThreatObservations(entityId: string, attrs: any, traceId: string): Observation[] {
    const observations: Observation[] = [];
    const now = new Date();
    const stats = attrs.last_analysis_stats;

    // Malicious detections
    if (stats.malicious > 0) {
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'event',
        property: 'malicious_detection',
        value: {
          count: stats.malicious,
          total_engines: Object.values(stats).reduce((a: number, b: number) => a + b, 0),
          severity: stats.malicious > 5 ? 'critical' : stats.malicious > 2 ? 'high' : 'medium'
        },
        confidence: 0.95,
        source: {
          tool: 'virustotal',
          url: attrs.links?.self,
          timestamp: now,
          raw: stats
        },
        context: { reputation: attrs.reputation }
      });
    }

    // Suspicious detections
    if (stats.suspicious > 0) {
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'event',
        property: 'suspicious_activity',
        value: {
          count: stats.suspicious,
          severity: 'medium'
        },
        confidence: 0.8,
        source: {
          tool: 'virustotal',
          timestamp: now,
          raw: stats
        },
        context: {}
      });
    }

    // Reputation observation
    observations.push({
      id: this.generateId(),
      entityId,
      type: 'attribute',
      property: 'reputation_score',
      value: attrs.reputation || 0,
      confidence: 0.85,
      source: {
        tool: 'virustotal',
        timestamp: now,
        raw: { reputation: attrs.reputation, votes: attrs.total_votes }
      },
      context: {
        harmless_votes: attrs.total_votes?.harmless || 0,
        malicious_votes: attrs.total_votes?.malicious || 0
      }
    });

    return observations;
  }

  private calculateVTConfidence(attrs: any): number {
    let confidence = 0.7;
    const stats = attrs.last_analysis_stats;
    const total = Object.values(stats).reduce((a: number, b: number) => a + b, 0) as number;

    if (total > 50) confidence += 0.1; // Many engines scanned
    if (attrs.reputation && attrs.reputation > 0) confidence += 0.1;
    if (attrs.total_votes && attrs.total_votes.harmless > attrs.total_votes.malicious) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }
}
