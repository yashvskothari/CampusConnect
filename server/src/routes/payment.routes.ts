import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const COMMISSION_RATE = 0.15;

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId, freelancerId, status } = req.query;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const payments = await prisma.payment.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(clientId ? { clientId: String(clientId) } : {}),
        ...(freelancerId ? { freelancerId: String(freelancerId) } : {}),
        ...(role === 'CLIENT' && !clientId ? { clientId: userId } : {}),
        ...(role === 'FREELANCER' && !freelancerId ? { freelancerId: userId } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        freelancer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/mock-checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      res.status(400).json({ error: 'Payment ID required' });
      return;
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    if (payment.clientId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.json({
      checkoutUrl: `/payment/success?paymentId=${paymentId}`,
      amount: payment.amount,
      commission: payment.commission,
      freelancerPayout: payment.amount - payment.commission,
      message: 'Mock Stripe checkout session created',
    });
  } catch {
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

router.post('/mock-complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      res.status(400).json({ error: 'Payment ID required' });
      return;
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    if (payment.clientId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' },
    });

    if (payment.jobId) {
      await prisma.job.update({
        where: { id: payment.jobId },
        data: { status: 'COMPLETED' },
      });
    }

    res.json({
      payment: updated,
      commission: updated.commission,
      freelancerPayout: updated.amount - updated.commission,
      commissionRate: COMMISSION_RATE,
    });
  } catch {
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

export default router;
