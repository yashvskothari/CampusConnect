import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Resilient Prisma Client wrapper with automatic retry for transient database
 * cold-starts, connection drops, and pooler resets (common in Neon serverless).
 */
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let retries = 2;
        while (true) {
          try {
            return await query(args);
          } catch (error: any) {
            const isTransient =
              error?.code === 'P1001' || // Can't reach database server
              error?.code === 'P1002' || // The database server was reached but timed out
              error?.code === 'P1008' || // Operations timed out
              error?.code === 'P1017' || // Server has closed the connection
              error?.message?.includes("Can't reach database server") ||
              error?.message?.includes('server has closed the connection') ||
              error?.message?.includes('Connection pool timeout') ||
              error?.message?.includes('Connection closed unexpectedly');

            if (isTransient && retries > 0) {
              retries--;
              console.warn(
                `[Prisma Auto-Retry] Database waking up / reconnecting for ${String(model)}.${operation} (retrying in 800ms...)`
              );
              await new Promise((resolve) => setTimeout(resolve, 800));
              continue;
            }
            throw error;
          }
        }
      },
    },
  },
});

export default prisma as unknown as PrismaClient;
