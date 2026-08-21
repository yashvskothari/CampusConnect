import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { revieweeId } = req.query;
    const reviews = await prisma.review.findMany({
      where: revieweeId ? { revieweeId: String(revieweeId) } : {},
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        reviewee: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { revieweeId, rating, comment } = req.body;
    if (!revieweeId || !rating || !comment) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    if (revieweeId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot review yourself' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        revieweeId,
        reviewerId: req.user!.userId,
        rating: Number(rating),
        comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
    });

    const avgRating = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
    });

    await prisma.user.update({
      where: { id: revieweeId },
      data: { rating: avgRating._avg.rating ?? 0 },
    });

    res.status(201).json(review);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'You have already reviewed this user' });
      return;
    }
    res.status(500).json({ error: 'Failed to create review' });
  }
});

export default router;
