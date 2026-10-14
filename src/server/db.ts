import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Utility to verify database connectivity.
 * Returns true if connection succeeds, false otherwise.
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, latencyMs: Date.now() - start };
  } catch (error: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: error?.message || 'Database connection error',
    };
  }
}
