import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(search ? { name: { contains: String(search), mode: 'insensitive' } } : {}),
        ...(role ? { role: role as any } : {}),
      },
      select: {
        id: true, name: true, email: true, role: true, bio: true, skills: true, avatar: true, rating: true, createdAt: true,
      },
      take: 50,
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, bio: true, skills: true, avatar: true, rating: true, createdAt: true,
        services: true,
        reviewsReceived: {
          include: { reviewer: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (req.user!.userId !== id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { name, bio, skills, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(avatar !== undefined && { avatar }),
      },
      select: { id: true, name: true, email: true, role: true, bio: true, skills: true, avatar: true, rating: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
