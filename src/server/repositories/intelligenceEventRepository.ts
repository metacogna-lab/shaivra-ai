import { prisma } from '../db/prismaClient';
import type { IntelligenceEvent } from '../../contracts/intelligence';
import { Prisma } from '@prisma/client';

/** Serialize nested structures so Date and other non-JSON values become JSON-safe for Prisma Json columns. */
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export interface CreateIntelligenceEventInput {
  id?: string;
  traceId: string;
  investigationId?: string | null;
  tool: string;
  target: string;
  timestamp: Date;
  status: string;
  entities: unknown[];
  observations: unknown[];
  relationships: unknown[];
  metadata: Record<string, unknown>;
}

/**
 * Intelligence Event Repository - Persist canonical OSINT events from the pipeline.
 * Maps contract IntelligenceEvent to Prisma intelligence_events table.
 */
export const intelligenceEventRepository = {
  /**
   * Create an intelligence event (from canonical contract or input shape).
   */
  async create(data: IntelligenceEvent | CreateIntelligenceEventInput) {
    const id = 'id' in data && data.id ? data.id : undefined;
    return prisma.intelligenceEvent.create({
      data: {
        ...(id && { id }),
        traceId: data.traceId,
        investigationId: data.investigationId ?? null,
        tool: data.tool,
        target: data.target,
        timestamp: data.timestamp,
        status: data.status,
        entities: toJsonValue(data.entities),
        observations: toJsonValue(data.observations),
        relationships: toJsonValue(data.relationships),
        metadata: toJsonValue(data.metadata),
      },
    });
  },

  /**
   * Find event by ID.
   */
  async findById(id: string) {
    return prisma.intelligenceEvent.findUnique({
      where: { id },
      include: { investigation: true },
    });
  },

  /**
   * Find events by trace ID (same pipeline run).
   */
  async findByTraceId(traceId: string, limit = 100) {
    return prisma.intelligenceEvent.findMany({
      where: { traceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  /**
   * Find events by investigation ID.
   */
  async findByInvestigationId(investigationId: string, limit = 200) {
    return prisma.intelligenceEvent.findMany({
      where: { investigationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  /**
   * Find most recent events across all investigations.
   */
  async findRecent(limit = 50) {
    return prisma.intelligenceEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  /**
   * Count events by investigation.
   */
  async countByInvestigationId(investigationId: string) {
    return prisma.intelligenceEvent.count({
      where: { investigationId },
    });
  },
};
