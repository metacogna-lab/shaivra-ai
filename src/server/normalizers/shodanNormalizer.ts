/**
 * Shodan Normalizer
 * 
 * Transforms Shodan API responses into canonical IntelligenceEvent schema.
 * 
 * @module normalizers/shodanNormalizer
 */

import { AbstractNormalizer } from './base';
import type { IntelligenceEvent, EntityReference, Observation } from '../../types/intelligence';
import type { ShodanSearchResponse, ShodanResult } from '../integrations/shodan';

export class ShodanNormalizer extends AbstractNormalizer<ShodanSearchResponse> {
  readonly toolName = 'shodan';

  normalize(
    rawOutput: ShodanSearchResponse,
    target: string,
    traceId: string,
    investigationId?: string
  ): IntelligenceEvent {
    const startTime = Date.now();
    const event = this.createBaseEvent(target, traceId, investigationId);

    // Store raw output for debugging
    event.metadata.raw = rawOutput;

    // Process each match
    for (const match of rawOutput.matches || []) {
      // Create infrastructure entity for each IP
      const entity = this.createInfrastructureEntity(match);
      event.entities.push(entity);

      // Create observations for this entity
      const observations = this.createObservations(match, entity.id, traceId);
      event.observations.push(...observations);
    }

    event.metadata.executionTime = Date.now() - startTime;
    return event;
  }

  /**
   * Create infrastructure entity from Shodan match
   */
  private createInfrastructureEntity(match: ShodanResult): EntityReference {
    const now = new Date();

    return {
      id: this.generateId(),
      type: 'infrastructure',
      name: match.ip_str,
      aliases: match.hostnames || [],
      confidence: this.calculateShodanConfidence(match),
      attributes: {
        ip: match.ip_str,
        org: match.org,
        isp: match.isp,
        os: match.os,
        country: match.location?.country_name,
        city: match.location?.city,
        latitude: match.location?.latitude,
        longitude: match.location?.longitude,
        domains: match.domains || [],
        tags: match.tags || []
      },
      sourceIds: [],
      firstSeen: now,
      lastSeen: now,
      metadata: {
        verified: false,
        tags: match.tags || [],
        notes: `Discovered via Shodan scan`
      }
    };
  }

  /**
   * Create observations from Shodan match
   */
  private createObservations(
    match: ShodanResult,
    entityId: string,
    traceId: string
  ): Observation[] {
    const observations: Observation[] = [];
    const now = new Date();

    // Port/service observation
    observations.push({
      id: this.generateId(),
      entityId,
      type: 'attribute',
      property: 'open_port',
      value: {
        port: match.port,
        transport: match.transport,
        service: match.data
      },
      confidence: 0.95, // High confidence - Shodan actively scanned this
      source: {
        tool: 'shodan',
        url: `https://www.shodan.io/host/${match.ip_str}`,
        timestamp: now,
        raw: match
      },
      context: {
        org: match.org,
        isp: match.isp
      }
    });

    // Vulnerability observations
    if (match.vulns && match.vulns.length > 0) {
      for (const cve of match.vulns) {
        observations.push({
          id: this.generateId(),
          entityId,
          type: 'event',
          property: 'vulnerability',
          value: {
            cve,
            severity: 'high' // Default - should be enriched from CVE database
          },
          confidence: 0.9,
          source: {
            tool: 'shodan',
            timestamp: now,
            raw: { cve, context: match }
          },
          context: {
            port: match.port,
            service: match.data
          }
        });
      }
    }

    // Location observation
    if (match.location) {
      observations.push({
        id: this.generateId(),
        entityId,
        type: 'attribute',
        property: 'location',
        value: {
          country: match.location.country_name,
          city: match.location.city,
          coordinates: {
            lat: match.location.latitude,
            lon: match.location.longitude
          }
        },
        confidence: 0.8, // GeoIP is generally accurate but not perfect
        source: {
          tool: 'shodan',
          timestamp: now,
          raw: match.location
        },
        context: {}
      });
    }

    return observations;
  }

  /**
   * Calculate confidence score based on Shodan data quality
   */
  private calculateShodanConfidence(match: ShodanResult): number {
    let confidence = 0.7; // Base confidence

    // Boost for verified organization
    if (match.org && match.org !== 'Unknown') confidence += 0.1;

    // Boost for OS detection
    if (match.os) confidence += 0.05;

    // Boost for hostnames
    if (match.hostnames && match.hostnames.length > 0) confidence += 0.05;

    // Boost for location data
    if (match.location) confidence += 0.05;

    return Math.min(confidence, 1.0); // Cap at 1.0
  }
}
