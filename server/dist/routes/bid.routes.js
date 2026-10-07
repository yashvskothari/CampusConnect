"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const params_1 = require("../utils/params");
const COMMISSION_RATE = 0.15;
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { jobId, freelancerId, status } = req.query;
        const bids = await prisma_1.default.bid.findMany({
            where: {
                ...(jobId ? { jobId: String(jobId) } : {}),
                ...(freelancerId ? { freelancerId: String(freelancerId) } : {}),
                ...(status ? { status: status } : {}),
            },
            include: {
                job: { include: { client: { select: { id: true, name: true } } } },
                freelancer: { select: { id: true, name: true, avatar: true, rating: true, skills: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(bids);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch bids' });
    }
});
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('FREELANCER', 'ADMIN'), async (req, res) => {
    try {
        const { jobId, proposal, quote, deliveryDays } = req.body;
        if (!jobId || !proposal || quote === undefined || quote === null || !deliveryDays) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const numQuote = Number(quote);
        const numDeliveryDays = Math.round(Number(deliveryDays));
        if (isNaN(numQuote) || numQuote <= 0) {
            res.status(400).json({ error: 'Quote must be a positive number' });
            return;
        }
        if (isNaN(numDeliveryDays) || numDeliveryDays <= 0) {
            res.status(400).json({ error: 'Delivery days must be at least 1 day' });
            return;
        }
        const job = await prisma_1.default.job.findUnique({ where: { id: jobId } });
        if (!job || job.status !== 'OPEN') {
            res.status(400).json({ error: 'Job is not open for bids' });
            return;
        }
        if (job.clientId === req.user.userId) {
            res.status(400).json({ error: 'You cannot bid on your own job' });
            return;
        }
        const bid = await prisma_1.default.bid.create({
            data: {
                jobId,
                proposal: String(proposal).trim(),
                quote: numQuote,
                deliveryDays: numDeliveryDays,
                freelancerId: req.user.userId,
            },
            include: {
                job: true,
                freelancer: { select: { id: true, name: true, avatar: true, rating: true } },
            },
        });
        res.status(201).json(bid);
    }
    catch (error) {
        console.error('Failed to submit bid:', error);
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'You have already bid on this job' });
            return;
        }
        res.status(500).json({ error: 'Failed to submit bid' });
    }
});
router.patch('/:id/accept', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const bid = await prisma_1.default.bid.findUnique({
            where: { id },
            include: { job: true },
        });
        if (!bid) {
            res.status(404).json({ error: 'Bid not found' });
            return;
        }
        if (bid.job.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized: You are not the client who posted this job' });
            return;
        }
        if (bid.status === 'ACCEPTED') {
            res.status(400).json({ error: 'This bid has already been accepted' });
            return;
        }
        const [updatedBid] = await prisma_1.default.$transaction([
            prisma_1.default.bid.update({ where: { id }, data: { status: 'ACCEPTED' } }),
            prisma_1.default.bid.updateMany({ where: { jobId: bid.jobId, id: { not: id } }, data: { status: 'REJECTED' } }),
            prisma_1.default.job.update({ where: { id: bid.jobId }, data: { status: 'IN_PROGRESS' } }),
        ]);
        const commission = bid.quote * COMMISSION_RATE;
        await prisma_1.default.payment.create({
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
    }
    catch (error) {
        console.error('Failed to accept bid:', error);
        res.status(500).json({ error: 'Failed to accept bid' });
    }
});
router.patch('/:id/reject', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const bid = await prisma_1.default.bid.findUnique({
            where: { id },
            include: { job: true },
        });
        if (!bid) {
            res.status(404).json({ error: 'Bid not found' });
            return;
        }
        if (bid.job.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized: You are not the client who posted this job' });
            return;
        }
        const updated = await prisma_1.default.bid.update({
            where: { id },
            data: { status: 'REJECTED' },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to reject bid:', error);
        res.status(500).json({ error: 'Failed to reject bid' });
    }
});
exports.default = router;
