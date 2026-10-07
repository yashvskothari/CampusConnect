"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { revieweeId } = req.query;
        const reviews = await prisma_1.default.review.findMany({
            where: revieweeId ? { revieweeId: String(revieweeId) } : {},
            include: {
                reviewer: { select: { id: true, name: true, avatar: true } },
                reviewee: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reviews);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
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
        if (revieweeId === req.user.userId) {
            res.status(400).json({ error: 'Cannot review yourself' });
            return;
        }
        const review = await prisma_1.default.review.create({
            data: {
                revieweeId,
                reviewerId: req.user.userId,
                rating: Number(rating),
                comment,
            },
            include: {
                reviewer: { select: { id: true, name: true, avatar: true } },
            },
        });
        const avgRating = await prisma_1.default.review.aggregate({
            where: { revieweeId },
            _avg: { rating: true },
        });
        await prisma_1.default.user.update({
            where: { id: revieweeId },
            data: { rating: avgRating._avg.rating ?? 0 },
        });
        res.status(201).json(review);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'You have already reviewed this user' });
            return;
        }
        res.status(500).json({ error: 'Failed to create review' });
    }
});
exports.default = router;
