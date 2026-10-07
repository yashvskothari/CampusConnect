"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const recommendation_service_1 = require("../services/recommendation.service");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
router.get('/jobs', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('FREELANCER', 'ADMIN'), async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const openJobs = await prisma_1.default.job.findMany({
            where: { status: 'OPEN' },
            include: { client: { select: { rating: true } } },
        });
        const completedJobs = await prisma_1.default.bid.count({
            where: { freelancerId: user.id, status: 'ACCEPTED' },
        });
        const matches = (0, recommendation_service_1.calculateJobMatches)({
            user,
            jobs: openJobs,
            completedJobsCount: completedJobs,
        });
        const jobsWithScores = openJobs.map((job) => {
            const match = matches.find((m) => m.jobId === job.id);
            return { ...job, matchScore: match?.score ?? 0, breakdown: match?.breakdown };
        }).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
        res.json(jobsWithScores);
    }
    catch {
        res.status(500).json({ error: 'Failed to get job recommendations' });
    }
});
router.get('/bid/:jobId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('FREELANCER', 'ADMIN'), async (req, res) => {
    try {
        const jobId = (0, params_1.getParam)(req.params.jobId);
        const job = await prisma_1.default.job.findUnique({ where: { id: jobId } });
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        const freelancer = await prisma_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!freelancer) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const avgBid = await prisma_1.default.bid.aggregate({
            where: { jobId: job.id },
            _avg: { quote: true },
        });
        const suggestion = (0, recommendation_service_1.generateBidSuggestion)(job, freelancer, avgBid._avg.quote ?? undefined);
        res.json(suggestion);
    }
    catch {
        res.status(500).json({ error: 'Failed to generate bid suggestion' });
    }
});
exports.default = router;
