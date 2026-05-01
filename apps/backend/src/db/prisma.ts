import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Prisma client singleton.
 * Reuses the instance in dev to avoid exhausting connections on hot reload.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
