import { prisma } from '../db/prismaClient';

export interface CreateSearchHistoryInput {
  query: string;
  results: Record<string, unknown>;
  source?: string;
  metadata?: Record<string, unknown>;
  userId: string;
}

/**
 * Search History Repository - Track all search queries
 */
export const searchHistoryRepository = {
  /**
   * Find all search history for a user
   */
  async findByUser(userId: string, limit = 50) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Create search history entry
   */
  async create(data: CreateSearchHistoryInput) {
    return prisma.searchHistory.create({
      data: {
        query: data.query,
        results: data.results,
        source: data.source,
        metadata: data.metadata,
        userId: data.userId,
      },
    });
  },

  /**
   * Find recent searches (last 24 hours)
   */
  async findRecent(userId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return prisma.searchHistory.findMany({
      where: {
        userId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Search history by query text
   */
  async findByQuery(userId: string, searchTerm: string) {
    return prisma.searchHistory.findMany({
      where: {
        userId,
        query: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Delete old search history (cleanup)
   */
  async deleteOlderThan(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return prisma.searchHistory.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
  },

  /**
   * Count searches by user
   */
  async countByUser(userId: string) {
    return prisma.searchHistory.count({
      where: { userId },
    });
  },
};
