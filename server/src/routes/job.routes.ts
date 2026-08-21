import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, status, clientId } = req.query;

    const jobs = await prisma.job.findMany({
      where: {
        ...(search ? {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
          ],
        } : {}),
        ...(category ? { category: String(category) } : {}),
        ...(status ? { status: status as any } : {}),
        ...(clientId ? { clientId: String(clientId) } : {}),
      },
      include: {
        client: { select: { id: true, name: true, avatar: true, rating: true } },
        bids: { include: { freelancer: { select: { id: true, name: true, avatar: true } } } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, avatar: true, rating: true } },
        bids: {
          include: { freelancer: { select: { id: true, name: true, avatar: true, rating: true, skills: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.post('/', authenticate, authorize('CLIENT', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { title, description, budget, deadline, category } = req.body;
    if (!title || !description || !budget || !deadline || !category) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget: Number(budget),
        deadline: new Date(deadline),
        category,
        clientId: req.user!.userId,
      },
      include: {
        client: { select: { id: true, name: true, avatar: true, rating: true } },
      },
    });
    res.status(201).json(job);
  } catch {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (job.clientId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { status } = req.body;
    const updated = await prisma.job.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

export default router;
