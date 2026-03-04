import { prisma } from '../db/prismaClient';
import { Role } from '@prisma/client';

export interface CreateUserInput {
  email: string;
  role?: Role;
}

export interface UpdateUserInput {
  email?: string;
  role?: Role;
}

/**
 * User Repository - Database operations for users
 */
export const userRepository = {
  /**
   * Find all users
   */
  async findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        projects: true,
        clips: true,
      },
    });
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Create a new user
   */
  async create(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: data.email,
        role: data.role || Role.ANALYST,
      },
    });
  },

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete user
   */
  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  /**
   * Count total users
   */
  async count() {
    return prisma.user.count();
  },

  /**
   * Count users by role
   */
  async countByRole(role: Role) {
    return prisma.user.count({
      where: { role },
    });
  },
};
