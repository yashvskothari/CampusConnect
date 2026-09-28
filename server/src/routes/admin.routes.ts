import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { Prisma, Role, JobStatus, PaymentStatus, UserStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getParam, getQuery } from '../utils/params';
import { logAdminAction } from '../utils/audit';

const router = Router();

// Every route in this file requires a logged-in, active ADMIN.
router.use(authenticate, authorize('ADMIN'));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MANAGEABLE_ROLES: Role[] = ['CLIENT', 'FREELANCER'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
const uploadsDir = path.join(process.cwd(), 'uploads');

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  bio: true,
  skills: true,
  avatar: true,
  rating: true,
  status: true,
  suspendedAt: true,
  suspensionReason: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

function pagination(req: Request) {
  const page = Math.max(1, parseInt(getQuery(req.query.page) ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(getQuery(req.query.limit) ?? '20', 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function pageMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/** Deletes a locally stored avatar, only ever inside /uploads. */
function removeLocalAvatar(avatar: string | null) {
  if (!avatar || !avatar.startsWith('/uploads/')) return;
  const filePath = path.resolve(process.cwd(), avatar.replace(/^\/+/, ''));
  if (!filePath.startsWith(uploadsDir + path.sep)) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

/**
 * Loads the target user and makes sure this admin is allowed to manage it.
 * Sends the error response itself and returns null when not allowed.
 */
async function loadManageableUser(req: Request, res: Response, opts: { allowSelf?: boolean } = {}) {
  const id = getParam(req.params.id);
  const target = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }
  if (target.id === req.user!.userId && !opts.allowSelf) {
    res.status(400).json({ error: 'You cannot perform this action on your own account' });
    return null;
  }
  if (target.role === 'ADMIN') {
    res.status(403).json({ error: 'Admin accounts cannot be modified from the admin panel' });
    return null;
  }
  return target;
}

function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/* ------------------------------------------------------------------ */
/* Dashboard stats                                                     */
/* ------------------------------------------------------------------ */

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      usersByRole,
      usersByStatus,
      newUsers7d,
      newUsers30d,
      jobsByStatus,
      totalServices,
      totalBids,
      totalReviews,
      completedPayments,
      pendingPayments,
      signupsRaw,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.count({ where: { createdAt: { gte: d7 } } }),
      prisma.user.count({ where: { createdAt: { gte: d30 } } }),
      prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.service.count(),
      prisma.bid.count(),
      prisma.review.count(),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true, commission: true },
        _count: { _all: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ day: Date; count: number }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${d30}
        GROUP BY 1
        ORDER BY 1`,
    ]);

    const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all]));
    const statusCounts = Object.fromEntries(usersByStatus.map((r) => [r.status, r._count._all]));
    const jobCounts = Object.fromEntries(jobsByStatus.map((r) => [r.status, r._count._all]));

    res.json({
      users: {
        total: usersByRole.reduce((n, r) => n + r._count._all, 0),
        clients: roleCounts.CLIENT ?? 0,
        freelancers: roleCounts.FREELANCER ?? 0,
        admins: roleCounts.ADMIN ?? 0,
        active: statusCounts.ACTIVE ?? 0,
        suspended: statusCounts.SUSPENDED ?? 0,
        newLast7Days: newUsers7d,
        newLast30Days: newUsers30d,
      },
      jobs: {
        total: Object.values(jobCounts).reduce((a, b) => a + b, 0),
        open: jobCounts.OPEN ?? 0,
        inProgress: jobCounts.IN_PROGRESS ?? 0,
        completed: jobCounts.COMPLETED ?? 0,
        cancelled: jobCounts.CANCELLED ?? 0,
      },
      marketplace: { services: totalServices, bids: totalBids, reviews: totalReviews },
      payments: {
        completedCount: completedPayments._count._all,
        totalVolume: completedPayments._sum.amount ?? 0,
        totalCommission: completedPayments._sum.commission ?? 0,
        pendingCount: pendingPayments._count._all,
        pendingVolume: pendingPayments._sum.amount ?? 0,
      },
      signupsLast30Days: signupsRaw.map((r) => ({ date: r.day.toISOString().slice(0, 10), count: r.count })),
    });
  } catch (error) {
    console.error('Admin stats error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

function buildUserWhere(req: Request): Prisma.UserWhereInput {
  const search = getQuery(req.query.search)?.trim();
  const role = getQuery(req.query.role);
  const status = getQuery(req.query.status);
  return {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(role && (Object.values(Role) as string[]).includes(role) ? { role: role as Role } : {}),
    ...(status && (Object.values(UserStatus) as string[]).includes(status) ? { status: status as UserStatus } : {}),
  };
}

// List users — GET /api/admin/users?search=&role=&status=&page=&limit=&sortBy=&order=
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pagination(req);
    const where = buildUserWhere(req);

    const sortable = ['createdAt', 'name', 'email', 'rating', 'lastLoginAt'];
    const sortBy = getQuery(req.query.sortBy);
    const order = getQuery(req.query.order) === 'asc' ? 'asc' : 'desc';
    const orderBy = {
      [sortBy && sortable.includes(sortBy) ? sortBy : 'createdAt']: order,
    } as Prisma.UserOrderByWithRelationInput;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...userSelect,
          _count: { select: { services: true, jobs: true, bids: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, pagination: pageMeta(total, page, limit) });
  } catch (error) {
    console.error('Admin list users error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Export users (filters apply) as CSV — must be declared before /users/:id
router.get('/users/export', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: buildUserWhere(req),
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const header = ['id', 'name', 'email', 'role', 'status', 'rating', 'createdAt', 'lastLoginAt'];
    const rows = users.map((u) =>
      [u.id, u.name, u.email, u.role, u.status, u.rating, u.createdAt, u.lastLoginAt].map(csvCell).join(',')
    );

    await logAdminAction(req.user!.userId, 'USER_EXPORT', 'User', null, { count: users.length });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send([header.join(','), ...rows].join('\n'));
  } catch (error) {
    console.error('Admin export users error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// User detail with activity summary
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        _count: {
          select: {
            services: true,
            jobs: true,
            bids: true,
            reviewsGiven: true,
            reviewsReceived: true,
            paymentsAsClient: true,
            paymentsAsFreelancer: true,
          },
        },
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [recentJobs, recentBids, recentPayments] = await Promise.all([
      prisma.job.findMany({
        where: { clientId: id },
        select: { id: true, title: true, status: true, budget: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.bid.findMany({
        where: { freelancerId: id },
        select: { id: true, quote: true, status: true, jobId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.payment.findMany({
        where: { OR: [{ clientId: id }, { freelancerId: id }] },
        select: { id: true, amount: true, commission: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({ ...user, recentJobs, recentBids, recentPayments });
  } catch (error) {
    console.error('Admin get user error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = req.body?.role as Role;
    const { bio, skills } = req.body ?? {};

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'name, email, password and role are required' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address' });
      return;
    }
    if (password.length < MIN_PASSWORD) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
      return;
    }
    if (!MANAGEABLE_ROLES.includes(role)) {
      res.status(400).json({ error: 'role must be CLIENT or FREELANCER' });
      return;
    }
    if (skills !== undefined && !isStringArray(skills)) {
      res.status(400).json({ error: 'skills must be an array of strings' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role,
        bio: typeof bio === 'string' && bio.trim() ? bio.trim() : null,
        skills: skills ?? [],
      },
      select: userSelect,
    });

    await logAdminAction(req.user!.userId, 'USER_CREATE', 'User', user.id, { email: user.email, role: user.role });
    res.status(201).json(user);
  } catch (error) {
    console.error('Admin create user error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user profile / role
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const target = await loadManageableUser(req, res);
    if (!target) return;

    const { name, email, bio, skills, role } = req.body ?? {};
    const data: Prisma.UserUpdateInput = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'name must be a non-empty string' });
        return;
      }
      data.name = name.trim();
    }
    if (email !== undefined) {
      const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!EMAIL_RE.test(normalized)) {
        res.status(400).json({ error: 'Enter a valid email address' });
        return;
      }
      const clash = await prisma.user.findFirst({
        where: { email: { equals: normalized, mode: 'insensitive' }, NOT: { id: target.id } },
        select: { id: true },
      });
      if (clash) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      data.email = normalized;
    }
    if (bio !== undefined) {
      if (bio !== null && typeof bio !== 'string') {
        res.status(400).json({ error: 'bio must be a string' });
        return;
      }
      data.bio = bio;
    }
    if (skills !== undefined) {
      if (!isStringArray(skills)) {
        res.status(400).json({ error: 'skills must be an array of strings' });
        return;
      }
      data.skills = skills;
    }
    if (role !== undefined) {
      if (!MANAGEABLE_ROLES.includes(role)) {
        res.status(400).json({ error: 'role must be CLIENT or FREELANCER' });
        return;
      }
      data.role = role;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const updated = await prisma.user.update({ where: { id: target.id }, data, select: userSelect });

    await logAdminAction(req.user!.userId, 'USER_UPDATE', 'User', target.id, {
      fields: Object.keys(data),
      ...(data.role ? { roleFrom: target.role, roleTo: data.role } : {}),
    });
    res.json(updated);
  } catch (error) {
    console.error('Admin update user error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Suspend user (they are locked out immediately, even with a valid token)
router.patch('/users/:id/suspend', async (req: Request, res: Response) => {
  try {
    const target = await loadManageableUser(req, res);
    if (!target) return;

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { status: 'SUSPENDED', suspendedAt: new Date(), suspensionReason: reason || null },
      select: userSelect,
    });

    await logAdminAction(req.user!.userId, 'USER_SUSPEND', 'User', target.id, { reason: reason || null });
    res.json(updated);
  } catch (error) {
    console.error('Admin suspend user error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Reactivate a suspended user
router.patch('/users/:id/unsuspend', async (req: Request, res: Response) => {
  try {
    const target = await loadManageableUser(req, res);
    if (!target) return;

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { status: 'ACTIVE', suspendedAt: null, suspensionReason: null },
      select: userSelect,
    });

    await logAdminAction(req.user!.userId, 'USER_UNSUSPEND', 'User', target.id);
    res.json(updated);
  } catch (error) {
    console.error('Admin unsuspend user error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
});

// Set a new password for a user (e.g. locked out and can't use email reset)
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const target = await loadManageableUser(req, res);
    if (!target) return;

    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (newPassword.length < MIN_PASSWORD) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: target.id }, data: { password: await bcrypt.hash(newPassword, 10) } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: target.id } }),
    ]);

    await logAdminAction(req.user!.userId, 'USER_PASSWORD_RESET', 'User', target.id);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Admin reset password error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user permanently (cascades to their jobs, bids, services, messages, etc.)
// Refuses if the user has work in progress unless ?force=true.
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const target = await loadManageableUser(req, res);
    if (!target) return;

    const force = getQuery(req.query.force) === 'true';
    if (!force) {
      const [activeJobs, activeBids, pendingPayments] = await Promise.all([
        prisma.job.count({ where: { clientId: target.id, status: 'IN_PROGRESS' } }),
        prisma.bid.count({ where: { freelancerId: target.id, status: 'ACCEPTED', job: { status: 'IN_PROGRESS' } } }),
        prisma.payment.count({
          where: { status: 'PENDING', OR: [{ clientId: target.id }, { freelancerId: target.id }] },
        }),
      ]);
      if (activeJobs || activeBids || pendingPayments) {
        res.status(409).json({
          error: 'User has active work. Resolve it first, or retry with ?force=true to delete anyway.',
          activeJobs,
          activeBids,
          pendingPayments,
        });
        return;
      }
    }

    await prisma.user.delete({ where: { id: target.id } });
    removeLocalAvatar(target.avatar);

    await logAdminAction(req.user!.userId, 'USER_DELETE', 'User', target.id, {
      email: target.email,
      name: target.name,
      role: target.role,
      forced: force,
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Bulk actions: { action: "suspend" | "unsuspend" | "delete", userIds: string[], reason? }
router.post('/users/bulk', async (req: Request, res: Response) => {
  try {
    const { action, userIds, reason } = req.body ?? {};
    if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
      res.status(400).json({ error: 'action must be suspend, unsuspend or delete' });
      return;
    }
    if (!isStringArray(userIds) || userIds.length === 0 || userIds.length > 100) {
      res.status(400).json({ error: 'userIds must be an array of 1-100 ids' });
      return;
    }

    // Only non-admin users, never the requesting admin.
    const targets = await prisma.user.findMany({
      where: { id: { in: userIds, not: req.user!.userId }, role: { in: MANAGEABLE_ROLES } },
      select: { id: true, email: true, avatar: true },
    });
    const ids = targets.map((t) => t.id);

    if (action === 'delete') {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
      targets.forEach((t) => removeLocalAvatar(t.avatar));
    } else if (action === 'suspend') {
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date(),
          suspensionReason: typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 500) : null,
        },
      });
    } else {
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ACTIVE', suspendedAt: null, suspensionReason: null },
      });
    }

    await logAdminAction(req.user!.userId, `USER_BULK_${String(action).toUpperCase()}`, 'User', null, {
      requested: userIds.length,
      affected: ids.length,
      userIds: ids,
    });
    res.json({ action, requested: userIds.length, affected: ids.length, skipped: userIds.length - ids.length });
  } catch (error) {
    console.error('Admin bulk users error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pagination(req);
    const search = getQuery(req.query.search)?.trim();
    const status = getQuery(req.query.status);

    const where: Prisma.JobWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(status && (Object.values(JobStatus) as string[]).includes(status) ? { status: status as JobStatus } : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);
    res.json({ data: jobs, pagination: pageMeta(total, page, limit) });
  } catch (error) {
    console.error('Admin list jobs error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.patch('/jobs/:id/status', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const status = req.body?.status;
    if (!(Object.values(JobStatus) as string[]).includes(status)) {
      res.status(400).json({ error: `status must be one of ${Object.values(JobStatus).join(', ')}` });
      return;
    }
    const job = await prisma.job.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const updated = await prisma.job.update({ where: { id }, data: { status } });
    await logAdminAction(req.user!.userId, 'JOB_STATUS_CHANGE', 'Job', id, { from: job.status, to: status });
    res.json(updated);
  } catch (error) {
    console.error('Admin job status error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const job = await prisma.job.findUnique({ where: { id }, select: { id: true, title: true, clientId: true } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    await prisma.job.delete({ where: { id } });
    await logAdminAction(req.user!.userId, 'JOB_DELETE', 'Job', id, { title: job.title, clientId: job.clientId });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Admin delete job error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

router.get('/services', async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pagination(req);
    const search = getQuery(req.query.search)?.trim();
    const where: Prisma.ServiceWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: { freelancer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);
    res.json({ data: services, pagination: pageMeta(total, page, limit) });
  } catch (error) {
    console.error('Admin list services error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.delete('/services/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, title: true, freelancerId: true },
    });
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    await prisma.service.delete({ where: { id } });
    await logAdminAction(req.user!.userId, 'SERVICE_DELETE', 'Service', id, {
      title: service.title,
      freelancerId: service.freelancerId,
    });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Admin delete service error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pagination(req);
    const maxRating = parseInt(getQuery(req.query.maxRating) ?? '', 10);
    const where: Prisma.ReviewWhereInput = Number.isInteger(maxRating) ? { rating: { lte: maxRating } } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: { select: { id: true, name: true, email: true } },
          reviewee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);
    res.json({ data: reviews, pagination: pageMeta(total, page, limit) });
  } catch (error) {
    console.error('Admin list reviews error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Remove an abusive review and recompute the reviewee's rating
router.delete('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    await prisma.review.delete({ where: { id } });
    const avg = await prisma.review.aggregate({ where: { revieweeId: review.revieweeId }, _avg: { rating: true } });
    await prisma.user.update({ where: { id: review.revieweeId }, data: { rating: avg._avg.rating ?? 0 } });

    await logAdminAction(req.user!.userId, 'REVIEW_DELETE', 'Review', id, {
      reviewerId: review.reviewerId,
      revieweeId: review.revieweeId,
      rating: review.rating,
    });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/* ------------------------------------------------------------------ */
/* Payments (read-only)                                                */
/* ------------------------------------------------------------------ */

router.get('/payments', async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pagination(req);
    const status = getQuery(req.query.status);
    const where: Prisma.PaymentWhereInput =
      status && (Object.values(PaymentStatus) as string[]).includes(status) ? { status: status as PaymentStatus } : {};

    const [payments, total, totals] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          freelancer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({ where, _sum: { amount: true, commission: true } }),
    ]);
    res.json({
      data: payments,
      totals: { amount: totals._sum.amount ?? 0, commission: totals._sum.commission ?? 0 },
      pagination: pageMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Admin list payments error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pagination(req);
    const action = getQuery(req.query.action);
    const targetType = getQuery(req.query.targetType);
    const targetId = getQuery(req.query.targetId);
    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ data: logs, pagination: pageMeta(total, page, limit) });
  } catch (error) {
    console.error('Admin audit logs error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
