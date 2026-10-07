"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { search, category, status, clientId } = req.query;
        const jobs = await prisma_1.default.job.findMany({
            where: {
                ...(search ? {
                    OR: [
                        { title: { contains: String(search), mode: 'insensitive' } },
                        { description: { contains: String(search), mode: 'insensitive' } },
                    ],
                } : {}),
                ...(category ? { category: String(category) } : {}),
                ...(status ? { status: status } : {}),
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
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const job = await prisma_1.default.job.findUnique({
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
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const { title, description, budget, deadline, category } = req.body;
        if (!title || !description || !budget || !deadline || !category) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const job = await prisma_1.default.job.create({
            data: {
                title,
                description,
                budget: Number(budget),
                deadline: new Date(deadline),
                category,
                clientId: req.user.userId,
            },
            include: {
                client: { select: { id: true, name: true, avatar: true, rating: true } },
            },
        });
        res.status(201).json(job);
    }
    catch (error) {
        console.error('Failed to create job:', error);
        res.status(500).json({ error: 'Failed to create job' });
    }
});
router.patch('/:id/status', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const job = await prisma_1.default.job.findUnique({ where: { id } });
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        if (job.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const { status } = req.body;
        const updated = await prisma_1.default.job.update({
            where: { id },
            data: { status },
        });
        res.json(updated);
    }
    catch {
        res.status(500).json({ error: 'Failed to update job status' });
    }
});
exports.default = router;
