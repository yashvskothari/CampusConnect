"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const COMMISSION_RATE = 0.15;
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { clientId, freelancerId, status } = req.query;
        const userId = req.user.userId;
        const role = req.user.role;
        const payments = await prisma_1.default.payment.findMany({
            where: {
                ...(status ? { status: status } : {}),
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
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});
router.post('/mock-checkout', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            res.status(400).json({ error: 'Payment ID required' });
            return;
        }
        const payment = await prisma_1.default.payment.findUnique({ where: { id: paymentId } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId) {
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
    }
    catch {
        res.status(500).json({ error: 'Failed to create checkout' });
    }
});
router.post('/mock-complete', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            res.status(400).json({ error: 'Payment ID required' });
            return;
        }
        const payment = await prisma_1.default.payment.findUnique({ where: { id: paymentId } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const updated = await prisma_1.default.payment.update({
            where: { id: paymentId },
            data: { status: 'COMPLETED' },
        });
        if (payment.jobId) {
            await prisma_1.default.job.update({
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
    }
    catch {
        res.status(500).json({ error: 'Failed to complete payment' });
    }
});
exports.default = router;
