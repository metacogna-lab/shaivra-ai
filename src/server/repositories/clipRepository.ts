import { prisma } from '../db/prismaClient';
import { Prisma } from '@prisma/client';

export interface CreateClipInput {
  title: string;
  content: string;
  source?: string;
  tags?: string[];
  metadata?: Prisma.InputJsonValue;
  userId: string;
}

export interface UpdateClipInput {
  title?: string;
  content?: string;
  source?: string;
  tags?: string[];
  metadata?: Prisma.InputJsonValue;
}

/**
 * Clip Repository - Saved intelligence clips
 */
export const clipRepository = {
  /**
   * Find all clips for a user
   */
  async findByUser(userId: string) {
    return prisma.clip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find clip by ID
   */
  async findById(id: string) {
    return prisma.clip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Create a new clip
   */
  async create(data: CreateClipInput) {
    return prisma.clip.create({
      data: {
        title: data.title,
        content: data.content,
        source: data.source,
        tags: data.tags || [],
        metadata: data.metadata ?? Prisma.JsonNull,
        userId: data.userId,
      },
    });
  },

  /**
   * Update clip
   */
  async update(id: string, data: UpdateClipInput) {
    const { metadata, ...rest } = data;
    return prisma.clip.update({
      where: { id },
      data: {
        ...rest,
        ...(metadata !== undefined ? { metadata } : {}),
      },
    });
  },

  /**
   * Delete clip
   */
  async delete(id: string) {
    return prisma.clip.delete({
      where: { id },
    });
  },

  /**
   * Find clips by tag
   */
  async findByTag(userId: string, tag: string) {
    return prisma.clip.findMany({
      where: {
        userId,
        tags: {
          has: tag,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Search clips by content or title
   */
  async search(userId: string, searchTerm: string) {
    return prisma.clip.findMany({
      where: {
        userId,
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Count clips by user
   */
  async countByUser(userId: string) {
    return prisma.clip.count({
      where: { userId },
    });
  },

  /**
   * Get all unique tags for a user
   */
  async getTagsByUser(userId: string) {
    const clips = await prisma.clip.findMany({
      where: { userId },
      select: { tags: true },
    });

    const allTags = clips.flatMap(clip => clip.tags);
    return [...new Set(allTags)].sort();
  },
};
