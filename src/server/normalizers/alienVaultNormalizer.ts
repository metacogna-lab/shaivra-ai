/**
 * AlienVault OTX Normalizer
 */

import { AbstractNormalizer } from './base';
import type { IntelligenceEvent, EntityReference, Observation, Relationship } from '../../types/intelligence';
import type { AlienVaultIndicator } from '../integrations/alienvault';

export class AlienVaultNormalizer extends AbstractNormalizer<AlienVaultIndicator> {
  readonly toolName = 'alienvault';

  normalize(
    rawOutput: AlienVaultIndicator,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent {
    const startTime = Date.now();
    const event = this.createBaseEvent(target, traceId, investigationId);
    event.metadata.raw = rawOutput;

    // Create primary entity
    const entity = this.createIndicatorEntity(rawOutput);
    event.entities.push(entity);

    // Create threat observations
    const observations = this.createPulseObservations(entity.id, rawOutput, traceId);
    event.observations.push(...observations);

    // Create pulse entities and relationships
    if (rawOutput.pulse_info?.pulses) {
      for (const pulse of rawOutput.pulse_info.pulses) {
        const pulseEntity: EntityReference = {
          id: this.generateId(),
          type: 'event',
          name: pulse.name,
          aliases: [pulse.id],
          confidence: 0.9,
          attributes: {
            description: pulse.description,
            tlp: pulse.tlp,
            tags: pulse.tags,
            author: pulse.author_name,
            references: pulse.references
          },
          sourceIds: [],
          firstSeen: new Date(pulse.created),
          lastSeen: new Date(pulse.modified),
          metadata: {
            verified: false,
            tags: pulse.tags,
            notes: `AlienVault Pulse: ${pulse.name}`
          }
        };

        event.entities.push(pulseEntity);

        // Create relationship
        const relationship: Relationship = {
          id: this.generateId(),
          fromEntityId: entity.id,
          toEntityId: pulseEntity.id,
          type: 'mentioned_in',
          strength: 0.8,
          confidence: 0.9,
          evidence: [],
          bidirectional: false,
          metadata: {
            firstSeen: new Date(pulse.created),
            lastSeen: new Date(pulse.modified),
            count: 1,
            context: `Indicator appears in threat pulse`
          }
        };

        event.relationships.push(relationship);
      }
    }

    event.metadata.executionTime = Date.now() - startTime;
    return event;
  }

  private createIndicatorEntity(data: AlienVaultIndicator): EntityReference {
    const now = new Date();

    return {
      id: this.generateId(),
      type: this.determineEntityType(data.type),
      name: data.indicator,
      aliases: [],
      confidence: this.calculateAVConfidence(data),
      attributes: {
        threat_score: data.threat_score,
        is_active: data.is_active,
        country: data.country_name,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        whois: data.whois
      },
      sourceIds: [],
      firstSeen: new Date(data.created),
      lastSeen: new Date(data.modified),
      metadata: {
        verified: false,
        tags: [],
        notes: `AlienVault OTX indicator`
      }
    };
  }

  private determineEntityType(type: string): EntityReference['type'] {
    if (type === 'domain' || type === 'ip' || type === 'url' || type === 'hostname') {
      return 'infrastructure';
    }
    return 'unknown';
  }

  private createPulseObservations(entityId: string, data: AlienVaultIndicator, traceId: string): Observation[] {
    const observations: Observation[] = [];
    const now = new Date();

    // Threat score observation
    if (data.threat_score) {
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'attribute',
        property: 'threat_score',
        value: data.threat_score,
        confidence: 0.85,
        source: {
          tool: 'alienvault',
          timestamp: now,
          raw: { threat_score: data.threat_score, is_active: data.is_active }
        },
        context: {
          pulse_count: data.pulse_info?.count || 0
        }
      });
    }

    // Pulse count observation
    if (data.pulse_info?.count) {
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'event',
        property: 'threat_intelligence_mentions',
        value: {
          count: data.pulse_info.count,
          severity: data.pulse_info.count > 10 ? 'high' : data.pulse_info.count > 5 ? 'medium' : 'low'
        },
        confidence: 0.9,
        source: {
          tool: 'alienvault',
          timestamp: now,
          raw: data.pulse_info
        },
        context: {}
      });
    }

    return observations;
  }

  private calculateAVConfidence(data: AlienVaultIndicator): number {
    let confidence = 0.7;

    if (data.pulse_info && data.pulse_info.count > 0) confidence += 0.1;
    if (data.threat_score && data.threat_score > 50) confidence += 0.1;
    if (data.is_active) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }
}
