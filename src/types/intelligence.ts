/**
 * Canonical Intelligence Schema
 *
 * This module defines the canonical data model for all OSINT intelligence signals.
 * ALL tools must normalize their output to these types before entering the knowledge graph.
 *
 * @module intelligence
 */

/**
 * Entity Reference
 *
 * Represents a discovered entity (person, organization, infrastructure, event, or unknown)
 * with confidence scoring and source attribution.
 */
export interface EntityReference {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Entity classification */
  type: 'person' | 'organization' | 'infrastructure' | 'event' | 'unknown';

  /** Primary name/identifier */
  name: string;

  /** Alternative names, handles, identifiers */
  aliases: string[];

  /** Confidence score (0.0 = no confidence, 1.0 = absolute certainty) */
  confidence: number;

  /** Flexible attributes specific to entity type */
  attributes: Record<string, any>;

  /** References to observations that discovered this entity */
  sourceIds: string[];

  /** When entity was first observed */
  firstSeen: Date;

  /** When entity was last observed */
  lastSeen: Date;

  /** Metadata for entity management */
  metadata: {
    /** Has this entity been manually verified? */
    verified: boolean;

    /** Classification tags */
    tags: string[];

    /** Optional human-readable notes */
    notes?: string;
  };
}

/**
 * Observation
 *
 * Represents a specific attribute, behavior, or event associated with an entity.
 * Observations are the atomic units of intelligence with full source provenance.
 */
export interface Observation {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Reference to the entity this observation describes */
  entityId: string;

  /** Observation classification */
  type: 'attribute' | 'behavior' | 'event' | 'relationship';

  /** What property was observed (e.g., "email", "location", "post") */
  property: string;

  /** The observed value (flexible type) */
  value: any;

  /** Confidence score (0.0 = no confidence, 1.0 = absolute certainty) */
  confidence: number;

  /** Source provenance - critical for attribution */
  source: {
    /** Which OSINT tool produced this observation */
    tool: string;

    /** Source URL if applicable */
    url?: string;

    /** When the observation was made */
    timestamp: Date;

    /** Raw data from tool (for debugging and re-processing) */
    raw: any;
  };

  /** Additional context about the observation */
  context: Record<string, any>;

  /** When this observation becomes stale/invalid (optional) */
  expiresAt?: Date;
}

/**
 * Relationship
 *
 * Represents a connection between two entities with evidence tracking.
 * Relationships can be directional or bidirectional and include confidence scoring.
 */
export interface Relationship {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Source entity ID */
  fromEntityId: string;

  /** Target entity ID */
  toEntityId: string;

  /** Relationship type (e.g., "employs", "located_in", "mentions") */
  type: string;

  /** Relationship strength (0.0 = weak, 1.0 = strong) */
  strength: number;

  /** Confidence score (0.0 = no confidence, 1.0 = absolute certainty) */
  confidence: number;

  /** Observation IDs that support this relationship */
  evidence: string[];

  /** Is this relationship symmetric? (e.g., "friend" is bidirectional) */
  bidirectional: boolean;

  /** Relationship metadata */
  metadata: {
    /** When relationship was first observed */
    firstSeen: Date;

    /** When relationship was last observed */
    lastSeen: Date;

    /** How many times this relationship has been observed */
    count: number;

    /** Optional context about the relationship */
    context?: string;
  };
}

/**
 * Intelligence Event
 *
 * Wrapper for entities, observations, and relationships from a single OSINT tool execution.
 * This is the top-level structure that gets stored in the database.
 */
export interface IntelligenceEvent {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Trace ID linking this event to an investigation or query */
  traceId: string;

  /** Optional foreign key to Investigation table */
  investigationId?: string;

  /** Which OSINT tool generated this event */
  tool: string;

  /** Investigation target (IP, domain, person name, etc.) */
  target: string;

  /** When the tool was executed */
  timestamp: Date;

  /** Execution status */
  status: 'success' | 'partial' | 'failed';

  /** Entities discovered by this tool execution */
  entities: EntityReference[];

  /** Observations made by this tool execution */
  observations: Observation[];

  /** Relationships discovered by this tool execution */
  relationships: Relationship[];

  /** Event metadata */
  metadata: {
    /** Tool execution time in milliseconds */
    executionTime: number;

    /** Estimated cost (API credits, compute time, etc.) */
    cost?: number;

    /** Errors encountered during execution */
    errors?: string[];

    /** Raw tool output (for debugging and re-processing) */
    raw?: any;
  };
}

/**
 * Type guard to check if an object is a valid EntityReference
 */
export function isEntityReference(obj: any): obj is EntityReference {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    ['person', 'organization', 'infrastructure', 'event', 'unknown'].includes(obj.type) &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.aliases) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 1 &&
    typeof obj.attributes === 'object' &&
    Array.isArray(obj.sourceIds) &&
    obj.firstSeen instanceof Date &&
    obj.lastSeen instanceof Date &&
    typeof obj.metadata === 'object'
  );
}

/**
 * Type guard to check if an object is a valid IntelligenceEvent
 */
export function isIntelligenceEvent(obj: any): obj is IntelligenceEvent {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.traceId === 'string' &&
    typeof obj.tool === 'string' &&
    typeof obj.target === 'string' &&
    obj.timestamp instanceof Date &&
    ['success', 'partial', 'failed'].includes(obj.status) &&
    Array.isArray(obj.entities) &&
    Array.isArray(obj.observations) &&
    Array.isArray(obj.relationships) &&
    typeof obj.metadata === 'object' &&
    typeof obj.metadata.executionTime === 'number'
  );
}
