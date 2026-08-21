import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, minRating } = req.query;

    const services = await prisma.service.findMany({
      where: {
        ...(search ? {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
          ],
        } : {}),
        ...(category ? { category: String(category) } : {}),
        ...(minPrice || maxPrice ? {
          price: {
            ...(minPrice ? { gte: Number(minPrice) } : {}),
            ...(maxPrice ? { lte: Number(maxPrice) } : {}),
          },
        } : {}),
        ...(minRating ? { freelancer: { rating: { gte: Number(minRating) } } } : {}),
      },
      include: {
        freelancer: { select: { id: true, name: true, avatar: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(services);
  } catch {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        freelancer: { select: { id: true, name: true, avatar: true, rating: true, bio: true, skills: true } },
      },
    });
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

router.post('/', authenticate, authorize('FREELANCER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { title, description, category, price } = req.body;
    if (!title || !description || !category || !price) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        category,
        price: Number(price),
        freelancerId: req.user!.userId,
      },
      include: {
        freelancer: { select: { id: true, name: true, avatar: true, rating: true } },
      },
    });
    res.status(201).json(service);
  } catch {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    if (existing.freelancerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { title, description, category, price } = req.body;
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price && { price: Number(price) }),
      },
      include: {
        freelancer: { select: { id: true, name: true, avatar: true, rating: true } },
      },
    });
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    if (existing.freelancerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
