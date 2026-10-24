import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; code?: string; message?: string };
  if (err.name === 'PrismaClientInitializationError') return true;
  if (typeof err.code === 'string' && err.code.startsWith('P1')) return true;
  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("can't reach database server") ||
      msg.includes('database_url') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('connection error') ||
      msg.includes('authentication failed') ||
      msg.includes('server closed the connection')
    ) {
      return true;
    }
  }
  return false;
}
