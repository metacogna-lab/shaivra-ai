import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const databaseUrl = process.env.DATABASE_URL?.trim();

function createPrisma(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/** Singleton Prisma client. Only created when DATABASE_URL is set; otherwise access throws. */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  (databaseUrl
    ? (() => {
        const client = createPrisma();
        if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
        return client;
      })()
    : (new Proxy({} as PrismaClient, {
        get() {
          throw new Error('Database not configured (set DATABASE_URL).');
        },
      }) as PrismaClient));

/**
 * Gracefully disconnect Prisma on app shutdown (no-op when DB not configured).
 */
export async function disconnectPrisma(): Promise<void> {
  if (databaseUrl && globalForPrisma.prisma) await globalForPrisma.prisma.$disconnect();
}

process.on('beforeExit', () => {
  void disconnectPrisma();
});
