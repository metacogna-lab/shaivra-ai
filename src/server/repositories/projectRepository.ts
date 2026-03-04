import { prisma } from '../db/prismaClient';
import { ProjectStatus } from '@prisma/client';

export interface CreateProjectInput {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  userId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
  status?: ProjectStatus;
}

/**
 * Project Repository - Database operations for projects
 */
export const projectRepository = {
  /**
   * Find all projects
   */
  async findAll() {
    return prisma.project.findMany({
      where: {
        status: ProjectStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find projects by user
   */
  async findByUser(userId: string) {
    return prisma.project.findMany({
      where: {
        userId,
        status: ProjectStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find project by ID
   */
  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Create a new project
   */
  async create(data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        settings: data.settings || {},
        userId: data.userId,
      },
    });
  },

  /**
   * Update project
   */
  async update(id: string, data: UpdateProjectInput) {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  /**
   * Archive project (soft delete)
   */
  async archive(id: string) {
    return prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.ARCHIVED,
      },
    });
  },

  /**
   * Delete project (hard delete)
   */
  async delete(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  },

  /**
   * Count projects by user
   */
  async countByUser(userId: string) {
    return prisma.project.count({
      where: {
        userId,
        status: ProjectStatus.ACTIVE,
      },
    });
  },
};
