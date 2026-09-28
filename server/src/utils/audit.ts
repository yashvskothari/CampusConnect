import { Prisma } from '@prisma/client';
import prisma from './prisma';

/**
 * Records an admin action. Never throws: a logging failure must not
 * break the action the admin just performed.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Prisma.InputJsonValue
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, targetType, targetId, ...(details !== undefined ? { details } : {}) },
    });
  } catch (error) {
    console.error('Audit log error:', error instanceof Error ? error.message : 'Unknown error');
  }
}
