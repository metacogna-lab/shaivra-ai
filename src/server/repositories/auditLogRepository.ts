import { prisma } from '../db/prismaClient';

export interface CreateAuditLogInput {
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Log Repository - Security and compliance logging
 */
export const auditLogRepository = {
  /**
   * Create audit log entry
   */
  async create(data: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  },

  /**
   * Find logs by user
   */
  async findByUser(userId: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Find logs by action
   */
  async findByAction(action: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Find logs by date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Find recent logs (last N hours)
   */
  async findRecent(hours = 24, limit = 100) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Find logs by IP address (security investigation)
   */
  async findByIP(ipAddress: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { ipAddress },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Count logs by action
   */
  async countByAction(action: string) {
    return prisma.auditLog.count({
      where: { action },
    });
  },

  /**
   * Delete old audit logs (retention policy)
   */
  async deleteOlderThan(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
  },

  /**
   * Get action statistics (for compliance dashboard)
   */
  async getActionStats(startDate: Date, endDate: Date) {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        action: true,
      },
    });

    const stats = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);
  },
};
