import { describe, it, expect } from 'vitest';
import { v4 as uuid } from 'uuid';
import type {
  EntityReference,
  Observation,
  Relationship,
  IntelligenceEvent
} from '@/contracts';

describe('Canonical Intelligence Schema', () => {
  describe('EntityReference', () => {
    it('creates valid entity reference with required fields', () => {
      const entity: EntityReference = {
        id: uuid(),
        type: 'person',
        name: 'John Doe',
        aliases: ['J. Doe', 'Johnny'],
        confidence: 0.85,
        attributes: {
          email: 'john@example.com',
          location: 'New York'
        },
        sourceIds: ['obs-123', 'obs-456'],
        firstSeen: new Date('2024-01-01'),
        lastSeen: new Date('2024-12-31'),
        metadata: {
          verified: false,
          tags: ['suspect', 'target'],
          notes: 'High priority target'
        }
      };

      expect(entity.id).toBeDefined();
      expect(entity.type).toBe('person');
      expect(entity.name).toBe('John Doe');
      expect(entity.aliases).toHaveLength(2);
      expect(entity.confidence).toBeGreaterThanOrEqual(0);
      expect(entity.confidence).toBeLessThanOrEqual(1);
      expect(entity.attributes.email).toBe('john@example.com');
      expect(entity.sourceIds).toHaveLength(2);
      expect(entity.metadata.verified).toBe(false);
      expect(entity.metadata.tags).toContain('suspect');
    });

    it('supports all entity types', () => {
      const types: Array<'person' | 'organization' | 'infrastructure' | 'event' | 'unknown'> = [
        'person',
        'organization',
        'infrastructure',
        'event',
        'unknown'
      ];

      types.forEach(type => {
        const entity: EntityReference = {
          id: uuid(),
          type,
          name: `Test ${type}`,
          aliases: [],
          confidence: 0.9,
          attributes: {},
          sourceIds: [],
          firstSeen: new Date(),
          lastSeen: new Date(),
          metadata: {
            verified: true,
            tags: []
          }
        };

        expect(entity.type).toBe(type);
      });
    });

    it('validates confidence score range 0.0-1.0', () => {
      const validConfidences = [0.0, 0.5, 0.85, 1.0];

      validConfidences.forEach(confidence => {
        const entity: EntityReference = {
          id: uuid(),
          type: 'person',
          name: 'Test',
          aliases: [],
          confidence,
          attributes: {},
          sourceIds: [],
          firstSeen: new Date(),
          lastSeen: new Date(),
          metadata: {
            verified: true,
            tags: []
          }
        };

        expect(entity.confidence).toBeGreaterThanOrEqual(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('supports empty aliases array', () => {
      const entity: EntityReference = {
        id: uuid(),
        type: 'organization',
        name: 'ACME Corp',
        aliases: [],
        confidence: 1.0,
        attributes: {},
        sourceIds: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        metadata: {
          verified: true,
          tags: ['company']
        }
      };

      expect(entity.aliases).toEqual([]);
    });

    it('supports flexible attributes object', () => {
      const entity: EntityReference = {
        id: uuid(),
        type: 'infrastructure',
        name: '192.168.1.1',
        aliases: [],
        confidence: 0.95,
        attributes: {
          port: 80,
          service: 'http',
          banner: 'nginx',
          ssl: true,
          customField: { nested: 'value' }
        },
        sourceIds: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        metadata: {
          verified: true,
          tags: ['web-server']
        }
      };

      const attrs = entity.attributes as Record<string, any>;
      expect(attrs.port).toBe(80);
      expect(attrs.ssl).toBe(true);
      expect((attrs.customField as Record<string, any>).nested).toBe('value');
    });

    it('supports optional notes in metadata', () => {
      const withNotes: EntityReference = {
        id: uuid(),
        type: 'person',
        name: 'Alice',
        aliases: [],
        confidence: 0.8,
        attributes: {},
        sourceIds: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        metadata: {
          verified: false,
          tags: [],
          notes: 'Important context'
        }
      };

      const withoutNotes: EntityReference = {
        id: uuid(),
        type: 'person',
        name: 'Bob',
        aliases: [],
        confidence: 0.8,
        attributes: {},
        sourceIds: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        metadata: {
          verified: false,
          tags: []
        }
      };

      expect(withNotes.metadata.notes).toBe('Important context');
      expect(withoutNotes.metadata.notes).toBeUndefined();
    });
  });

  describe('Observation', () => {
    it('creates valid observation with source tracking', () => {
      const observation: Observation = {
        id: uuid(),
        entityId: 'entity-123',
        type: 'attribute',
        property: 'email',
        value: 'test@example.com',
        confidence: 0.9,
        source: {
          tool: 'theHarvester',
          url: 'https://example.com',
          timestamp: new Date('2024-06-15'),
          raw: { emails: ['test@example.com'] }
        },
        context: {
          foundIn: 'webpage',
          pageTitle: 'Contact Us'
        }
      };

      expect(observation.id).toBeDefined();
      expect(observation.entityId).toBe('entity-123');
      expect(observation.type).toBe('attribute');
      expect(observation.property).toBe('email');
      expect(observation.value).toBe('test@example.com');
      expect(observation.confidence).toBe(0.9);
      expect(observation.source.tool).toBe('theHarvester');
      expect(observation.source.url).toBe('https://example.com');
      expect(observation.context.foundIn).toBe('webpage');
    });

    it('supports all observation types', () => {
      const types: Array<'attribute' | 'behavior' | 'event' | 'relationship'> = [
        'attribute',
        'behavior',
        'event',
        'relationship'
      ];

      types.forEach(type => {
        const observation: Observation = {
          id: uuid(),
          entityId: 'entity-123',
          type,
          property: 'test-property',
          value: 'test-value',
          confidence: 0.8,
          source: {
            tool: 'test-tool',
            timestamp: new Date(),
            raw: {}
          },
          context: {}
        };

        expect(observation.type).toBe(type);
      });
    });

    it('supports optional expiration timestamp', () => {
      const withExpiry: Observation = {
        id: uuid(),
        entityId: 'entity-123',
        type: 'attribute',
        property: 'session_token',
        value: 'abc123',
        confidence: 1.0,
        source: {
          tool: 'session-tracker',
          timestamp: new Date(),
          raw: {}
        },
        context: {},
        expiresAt: new Date('2025-01-01')
      };

      const withoutExpiry: Observation = {
        id: uuid(),
        entityId: 'entity-123',
        type: 'attribute',
        property: 'name',
        value: 'John',
        confidence: 1.0,
        source: {
          tool: 'profile-scraper',
          timestamp: new Date(),
          raw: {}
        },
        context: {}
      };

      expect(withExpiry.expiresAt).toBeDefined();
      expect(withExpiry.expiresAt).toBeInstanceOf(Date);
      expect(withoutExpiry.expiresAt).toBeUndefined();
    });

    it('supports optional source URL', () => {
      const withUrl: Observation = {
        id: uuid(),
        entityId: 'entity-123',
        type: 'attribute',
        property: 'post',
        value: 'Hello world',
        confidence: 1.0,
        source: {
          tool: 'twitter-scraper',
          url: 'https://twitter.com/user/status/123',
          timestamp: new Date(),
          raw: {}
        },
        context: {}
      };

      const withoutUrl: Observation = {
        id: uuid(),
        entityId: 'entity-123',
        type: 'behavior',
        property: 'login_attempt',
        value: { success: true },
        confidence: 1.0,
        source: {
          tool: 'auth-monitor',
          timestamp: new Date(),
          raw: {}
        },
        context: {}
      };

      expect(withUrl.source.url).toBe('https://twitter.com/user/status/123');
      expect(withoutUrl.source.url).toBeUndefined();
    });

    it('supports complex value types', () => {
      const observation: Observation = {
        id: uuid(),
        entityId: 'entity-123',
        type: 'event',
        property: 'transaction',
        value: {
          amount: 1500.50,
          currency: 'USD',
          timestamp: '2024-06-15T10:30:00Z',
          parties: ['Alice', 'Bob']
        },
        confidence: 0.95,
        source: {
          tool: 'blockchain-scanner',
          timestamp: new Date(),
          raw: {}
        },
        context: {}
      };

      const value = observation.value as {
        amount: number;
        parties: string[];
      };
      expect(value.amount).toBe(1500.50);
      expect(value.parties).toHaveLength(2);
    });
  });

  describe('Relationship', () => {
    it('creates valid relationship between entities', () => {
      const relationship: Relationship = {
        id: uuid(),
        fromEntityId: 'entity-1',
        toEntityId: 'entity-2',
        type: 'employs',
        strength: 0.7,
        confidence: 0.8,
        evidence: ['obs-1', 'obs-2', 'obs-3'],
        bidirectional: false,
        metadata: {
          firstSeen: new Date('2024-01-01'),
          lastSeen: new Date('2024-12-31'),
          count: 5,
          context: 'Employed since January 2024'
        }
      };

      expect(relationship.id).toBeDefined();
      expect(relationship.fromEntityId).toBe('entity-1');
      expect(relationship.toEntityId).toBe('entity-2');
      expect(relationship.type).toBe('employs');
      expect(relationship.strength).toBe(0.7);
      expect(relationship.confidence).toBe(0.8);
      expect(relationship.evidence).toHaveLength(3);
      expect(relationship.bidirectional).toBe(false);
      expect(relationship.metadata.count).toBe(5);
    });

    it('validates strength score range 0.0-1.0', () => {
      const validStrengths = [0.0, 0.3, 0.75, 1.0];

      validStrengths.forEach(strength => {
        const relationship: Relationship = {
          id: uuid(),
          fromEntityId: 'entity-1',
          toEntityId: 'entity-2',
          type: 'knows',
          strength,
          confidence: 0.8,
          evidence: [],
          bidirectional: true,
          metadata: {
            firstSeen: new Date(),
            lastSeen: new Date(),
            count: 1
          }
        };

        expect(relationship.strength).toBeGreaterThanOrEqual(0);
        expect(relationship.strength).toBeLessThanOrEqual(1);
      });
    });

    it('validates confidence score range 0.0-1.0', () => {
      const validConfidences = [0.0, 0.5, 0.9, 1.0];

      validConfidences.forEach(confidence => {
        const relationship: Relationship = {
          id: uuid(),
          fromEntityId: 'entity-1',
          toEntityId: 'entity-2',
          type: 'mentions',
          strength: 0.5,
          confidence,
          evidence: [],
          bidirectional: false,
          metadata: {
            firstSeen: new Date(),
            lastSeen: new Date(),
            count: 1
          }
        };

        expect(relationship.confidence).toBeGreaterThanOrEqual(0);
        expect(relationship.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('supports bidirectional relationships', () => {
      const bidirectional: Relationship = {
        id: uuid(),
        fromEntityId: 'person-1',
        toEntityId: 'person-2',
        type: 'friend',
        strength: 0.9,
        confidence: 0.95,
        evidence: ['obs-friendship'],
        bidirectional: true,
        metadata: {
          firstSeen: new Date(),
          lastSeen: new Date(),
          count: 1
        }
      };

      expect(bidirectional.bidirectional).toBe(true);
    });

    it('supports optional context in metadata', () => {
      const withContext: Relationship = {
        id: uuid(),
        fromEntityId: 'entity-1',
        toEntityId: 'entity-2',
        type: 'located_in',
        strength: 1.0,
        confidence: 1.0,
        evidence: [],
        bidirectional: false,
        metadata: {
          firstSeen: new Date(),
          lastSeen: new Date(),
          count: 1,
          context: 'Headquarters location'
        }
      };

      const withoutContext: Relationship = {
        id: uuid(),
        fromEntityId: 'entity-1',
        toEntityId: 'entity-2',
        type: 'mentions',
        strength: 0.5,
        confidence: 0.7,
        evidence: [],
        bidirectional: false,
        metadata: {
          firstSeen: new Date(),
          lastSeen: new Date(),
          count: 3
        }
      };

      expect(withContext.metadata.context).toBe('Headquarters location');
      expect(withoutContext.metadata.context).toBeUndefined();
    });

    it('tracks evidence references', () => {
      const relationship: Relationship = {
        id: uuid(),
        fromEntityId: 'company-1',
        toEntityId: 'person-1',
        type: 'employs',
        strength: 0.85,
        confidence: 0.9,
        evidence: [
          'obs-linkedin-profile',
          'obs-company-website',
          'obs-news-article'
        ],
        bidirectional: false,
        metadata: {
          firstSeen: new Date(),
          lastSeen: new Date(),
          count: 3
        }
      };

      expect(relationship.evidence).toHaveLength(3);
      expect(relationship.evidence).toContain('obs-linkedin-profile');
      expect(relationship.metadata.count).toBe(3);
    });
  });

  describe('IntelligenceEvent', () => {
    it('creates complete intelligence event', () => {
      const event: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-abc-123',
        investigationId: 'inv-456',
        tool: 'shodan',
        target: '192.168.1.1',
        timestamp: new Date('2024-06-15T10:30:00Z'),
        status: 'success',
        entities: [
          {
            id: uuid(),
            type: 'infrastructure',
            name: '192.168.1.1',
            aliases: [],
            confidence: 0.95,
            attributes: { port: 80 },
            sourceIds: [],
            firstSeen: new Date(),
            lastSeen: new Date(),
            metadata: {
              verified: true,
              tags: ['shodan']
            }
          }
        ],
        observations: [
          {
            id: uuid(),
            entityId: 'entity-123',
            type: 'attribute',
            property: 'service',
            value: 'http',
            confidence: 0.9,
            source: {
              tool: 'shodan',
              timestamp: new Date(),
              raw: {}
            },
            context: {}
          }
        ],
        relationships: [],
        metadata: {
          executionTime: 1500,
          cost: 0.05,
          errors: [],
          raw: { total: 1, matches: [] }
        }
      };

      expect(event.id).toBeDefined();
      expect(event.traceId).toBe('trace-abc-123');
      expect(event.investigationId).toBe('inv-456');
      expect(event.tool).toBe('shodan');
      expect(event.target).toBe('192.168.1.1');
      expect(event.status).toBe('success');
      expect(event.entities).toHaveLength(1);
      expect(event.observations).toHaveLength(1);
      expect(event.metadata.executionTime).toBe(1500);
      expect(event.metadata.cost).toBe(0.05);
    });

    it('supports all status types', () => {
      const statuses: Array<'success' | 'partial' | 'failed'> = [
        'success',
        'partial',
        'failed'
      ];

      statuses.forEach(status => {
        const event: IntelligenceEvent = {
          id: uuid(),
          traceId: 'trace-123',
          tool: 'test-tool',
          target: 'test-target',
          timestamp: new Date(),
          status,
          entities: [],
          observations: [],
          relationships: [],
          metadata: {
            executionTime: 100
          }
        };

        expect(event.status).toBe(status);
      });
    });

    it('supports optional investigation ID', () => {
      const withInvestigation: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-123',
        investigationId: 'inv-456',
        tool: 'dns_lookup',
        target: 'example.com',
        timestamp: new Date(),
        status: 'success',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {
          executionTime: 50
        }
      };

      const withoutInvestigation: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-789',
        tool: 'web_search',
        target: 'general query',
        timestamp: new Date(),
        status: 'success',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {
          executionTime: 200
        }
      };

      expect(withInvestigation.investigationId).toBe('inv-456');
      expect(withoutInvestigation.investigationId).toBeUndefined();
    });

    it('tracks execution metadata', () => {
      const event: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-123',
        tool: 'virustotal_lookup',
        target: '192.0.2.1',
        timestamp: new Date(),
        status: 'success',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {
          executionTime: 2500,
          cost: 0.10,
          errors: [],
          raw: { data: { attributes: {} } }
        }
      };

      expect(event.metadata.executionTime).toBe(2500);
      expect(event.metadata.cost).toBe(0.10);
      expect(event.metadata.errors).toEqual([]);
      expect(event.metadata.raw).toBeDefined();
    });

    it('supports partial failures with errors', () => {
      const event: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-123',
        tool: 'the_harvester',
        target: 'example.com',
        timestamp: new Date(),
        status: 'partial',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {
          executionTime: 5000,
          errors: [
            'Timeout fetching from source A',
            'Source B returned 404'
          ]
        }
      };

      expect(event.status).toBe('partial');
      expect(event.metadata.errors).toHaveLength(2);
      expect(event.metadata.errors![0]).toContain('Timeout');
    });

    it('supports complete failure events', () => {
      const event: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-123',
        tool: 'api_scanner',
        target: 'offline-service.com',
        timestamp: new Date(),
        status: 'failed',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {
          executionTime: 100,
          errors: ['Service unavailable']
        }
      };

      expect(event.status).toBe('failed');
      expect(event.entities).toHaveLength(0);
      expect(event.metadata.errors).toContain('Service unavailable');
    });

    it('optionally includes raw tool output for debugging', () => {
      const rawOutput = {
        api_version: '2.0',
        results: [],
        debug_info: 'verbose logs'
      };

      const event: IntelligenceEvent = {
        id: uuid(),
        traceId: 'trace-123',
        tool: 'custom_scanner',
        target: 'target.com',
        timestamp: new Date(),
        status: 'success',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {
          executionTime: 300,
          raw: rawOutput
        }
      };

      const raw = event.metadata.raw as { api_version: string };
      expect(raw).toEqual(rawOutput);
      expect(raw.api_version).toBe('2.0');
    });
  });
});
