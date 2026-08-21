import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';

const COMMISSION_RATE = 0.15;

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { jobId, freelancerId, status } = req.query;

    const bids = await prisma.bid.findMany({
      where: {
        ...(jobId ? { jobId: String(jobId) } : {}),
        ...(freelancerId ? { freelancerId: String(freelancerId) } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        job: { include: { client: { select: { id: true, name: true } } } },
        freelancer: { select: { id: true, name: true, avatar: true, rating: true, skills: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bids);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

router.post('/', authenticate, authorize('FREELANCER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { jobId, proposal, quote, deliveryDays } = req.body;
    if (!jobId || !proposal || !quote || !deliveryDays) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'OPEN') {
      res.status(400).json({ error: 'Job is not open for bids' });
      return;
    }

    const bid = await prisma.bid.create({
      data: {
        jobId,
        proposal,
        quote: Number(quote),
        deliveryDays: Number(deliveryDays),
        freelancerId: req.user!.userId,
      },
      include: {
        job: true,
        freelancer: { select: { id: true, name: true, avatar: true, rating: true } },
      },
    });
    res.status(201).json(bid);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'You have already bid on this job' });
      return;
    }
    res.status(500).json({ error: 'Failed to submit bid' });
  }
});

router.patch('/:id/accept', authenticate, authorize('CLIENT', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const bid = await prisma.bid.findUnique({
      where: { id },
      include: { job: true },
    });
    if (!bid) {
      res.status(404).json({ error: 'Bid not found' });
      return;
    }
    if (bid.job.clientId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const [updatedBid] = await prisma.$transaction([
      prisma.bid.update({ where: { id }, data: { status: 'ACCEPTED' } }),
      prisma.bid.updateMany({ where: { jobId: bid.jobId, id: { not: id } }, data: { status: 'REJECTED' } }),
      prisma.job.update({ where: { id: bid.jobId }, data: { status: 'IN_PROGRESS' } }),
    ]);

    const commission = bid.quote * COMMISSION_RATE;
    await prisma.payment.create({
      data: {
        amount: bid.quote,
        commission,
        status: 'PENDING',
        clientId: bid.job.clientId,
        freelancerId: bid.freelancerId,
        jobId: bid.jobId,
      },
    });

    res.json(updatedBid);
  } catch {
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

router.patch('/:id/reject', authenticate, authorize('CLIENT', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const bid = await prisma.bid.findUnique({
      where: { id },
      include: { job: true },
    });
    if (!bid) {
      res.status(404).json({ error: 'Bid not found' });
      return;
    }
    if (bid.job.clientId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updated = await prisma.bid.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to reject bid' });
  }
});

export default router;
