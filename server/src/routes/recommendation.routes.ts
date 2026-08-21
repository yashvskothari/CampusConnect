import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { calculateJobMatches, generateBidSuggestion } from '../services/recommendation.service';
import { getParam } from '../utils/params';

const router = Router();

router.get('/jobs', authenticate, authorize('FREELANCER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const openJobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      include: { client: { select: { rating: true } } },
    });

    const completedJobs = await prisma.bid.count({
      where: { freelancerId: user.id, status: 'ACCEPTED' },
    });

    const matches = calculateJobMatches({
      user,
      jobs: openJobs,
      completedJobsCount: completedJobs,
    });

    const jobsWithScores = openJobs.map((job) => {
      const match = matches.find((m) => m.jobId === job.id);
      return { ...job, matchScore: match?.score ?? 0, breakdown: match?.breakdown };
    }).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

    res.json(jobsWithScores);
  } catch {
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

router.get('/bid/:jobId', authenticate, authorize('FREELANCER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const jobId = getParam(req.params.jobId);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const freelancer = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!freelancer) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const avgBid = await prisma.bid.aggregate({
      where: { jobId: job.id },
      _avg: { quote: true },
    });

    const suggestion = generateBidSuggestion(job, freelancer, avgBid._avg.quote ?? undefined);
    res.json(suggestion);
  } catch {
    res.status(500).json({ error: 'Failed to generate bid suggestion' });
  }
});

export default router;
