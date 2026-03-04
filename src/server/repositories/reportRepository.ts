import { prisma } from '../db/prismaClient';
import { ReportType } from '@prisma/client';

export interface CreateReportInput {
  type: ReportType;
  title?: string;
  data: Record<string, unknown>;
  summary?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Report Repository - Generated intelligence reports
 */
export const reportRepository = {
  /**
   * Find all reports
   */
  async findAll(limit = 50) {
    return prisma.report.findMany({
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Find reports by type
   */
  async findByType(type: ReportType, limit = 50) {
    return prisma.report.findMany({
      where: { type },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Find report by ID
   */
  async findById(id: string) {
    return prisma.report.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new report
   */
  async create(data: CreateReportInput) {
    return prisma.report.create({
      data: {
        type: data.type,
        title: data.title,
        data: data.data,
        summary: data.summary,
        metadata: data.metadata,
      },
    });
  },

  /**
   * Find daily reports
   */
  async findDaily(limit = 30) {
    return this.findByType(ReportType.DAILY, limit);
  },

  /**
   * Find weekly reports
   */
  async findWeekly(limit = 12) {
    return this.findByType(ReportType.WEEKLY, limit);
  },

  /**
   * Find strategic reports
   */
  async findStrategic(limit = 20) {
    return this.findByType(ReportType.STRATEGIC, limit);
  },

  /**
   * Find reports by date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.report.findMany({
      where: {
        generatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  },

  /**
   * Delete report
   */
  async delete(id: string) {
    return prisma.report.delete({
      where: { id },
    });
  },

  /**
   * Count reports by type
   */
  async countByType(type: ReportType) {
    return prisma.report.count({
      where: { type },
    });
  },

  /**
   * Delete old reports (cleanup)
   */
  async deleteOlderThan(days: number, type?: ReportType) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return prisma.report.deleteMany({
      where: {
        generatedAt: {
          lt: cutoff,
        },
        ...(type && { type }),
      },
    });
  },
};
