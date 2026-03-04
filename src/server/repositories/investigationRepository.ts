import { prisma } from '../db/prismaClient';
import { InvestigationStatus } from '@prisma/client';

export interface CreateInvestigationInput {
  target: string;
  goal: string;
  certainty?: number;
  logs?: unknown[];
  entities?: unknown[];
  citations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateInvestigationInput {
  status?: InvestigationStatus;
  certainty?: number;
  logs?: unknown[];
  entities?: unknown[];
  citations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  completedAt?: Date;
}

/**
 * Investigation Repository - Autonomous bot investigations
 */
export const investigationRepository = {
  /**
   * Find all investigations
   */
  async findAll(limit = 50) {
    return prisma.investigation.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Find investigation by ID
   */
  async findById(id: string) {
    return prisma.investigation.findUnique({
      where: { id },
    });
  },

  /**
   * Find investigations by status
   */
  async findByStatus(status: InvestigationStatus) {
    return prisma.investigation.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find running investigations
   */
  async findRunning() {
    return this.findByStatus(InvestigationStatus.RUNNING);
  },

  /**
   * Find completed investigations
   */
  async findCompleted(limit = 50) {
    return prisma.investigation.findMany({
      where: { status: InvestigationStatus.COMPLETED },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Create a new investigation
   */
  async create(data: CreateInvestigationInput) {
    return prisma.investigation.create({
      data: {
        target: data.target,
        goal: data.goal,
        certainty: data.certainty || 0,
        logs: data.logs || [],
        entities: data.entities || [],
        citations: data.citations,
        metadata: data.metadata,
      },
    });
  },

  /**
   * Update investigation
   */
  async update(id: string, data: UpdateInvestigationInput) {
    return prisma.investigation.update({
      where: { id },
      data,
    });
  },

  /**
   * Update investigation status
   */
  async updateStatus(id: string, status: InvestigationStatus) {
    const updateData: UpdateInvestigationInput = { status };

    if (status === InvestigationStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.update(id, updateData);
  },

  /**
   * Append log to investigation
   */
  async appendLog(id: string, logEntry: unknown) {
    const investigation = await this.findById(id);
    if (!investigation) {
      throw new Error('Investigation not found');
    }

    const logs = Array.isArray(investigation.logs) ? investigation.logs : [];
    logs.push(logEntry);

    return this.update(id, { logs });
  },

  /**
   * Update certainty level
   */
  async updateCertainty(id: string, certainty: number) {
    return this.update(id, { certainty });
  },

  /**
   * Delete investigation
   */
  async delete(id: string) {
    return prisma.investigation.delete({
      where: { id },
    });
  },

  /**
   * Count investigations by status
   */
  async countByStatus(status: InvestigationStatus) {
    return prisma.investigation.count({
      where: { status },
    });
  },

  /**
   * Find investigations by target
   */
  async findByTarget(target: string) {
    return prisma.investigation.findMany({
      where: {
        target: {
          contains: target,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
