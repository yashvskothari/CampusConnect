"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const params_1 = require("../utils/params");
const chatAuth_1 = require("../utils/chatAuth");
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const router = (0, express_1.Router)();
router.get('/conversations', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                participants: { some: { userId: req.user.userId } },
                messages: { some: {} },
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { sender: { select: { id: true, name: true } } },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(conversations);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
router.post('/conversations', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { participantId } = req.body;
        if (!participantId) {
            res.status(400).json({ error: 'Participant ID required' });
            return;
        }
        const allowed = await (0, chatAuth_1.canUsersChat)(req.user.userId, participantId);
        if (!allowed) {
            res.status(403).json({
                error: 'Chat is restricted to freelancers and clients who share an active proposal, job, or contract.',
            });
            return;
        }
        const existing = await prisma_1.default.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: req.user.userId } } },
                    { participants: { some: { userId: participantId } } },
                ],
            },
            include: {
                participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { sender: { select: { id: true, name: true } } },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        if (existing) {
            res.json(existing);
            return;
        }
        const conversation = await prisma_1.default.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: req.user.userId },
                        { userId: participantId },
                    ],
                },
            },
            include: {
                participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { sender: { select: { id: true, name: true } } },
                },
            },
        });
        res.status(201).json(conversation);
    }
    catch {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});
router.get('/conversations/:id/messages', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const conversationId = (0, params_1.getParam)(req.params.id);
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId, userId: req.user.userId },
        });
        if (!participant) {
            res.status(403).json({ error: 'Not a participant' });
            return;
        }
        const messages = await prisma_1.default.message.findMany({
            where: { conversationId },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
        });
        res.json(messages);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
router.post('/conversations/:id/messages', auth_middleware_1.authenticate, upload.single('file'), async (req, res) => {
    try {
        const conversationId = (0, params_1.getParam)(req.params.id);
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId, userId: req.user.userId },
        });
        if (!participant) {
            res.status(403).json({ error: 'Not a participant' });
            return;
        }
        const { text } = req.body;
        if (!text && !req.file) {
            res.status(400).json({ error: 'Message text or file required' });
            return;
        }
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const message = await prisma_1.default.message.create({
            data: {
                text: text || '',
                fileUrl,
                senderId: req.user.userId,
                conversationId,
            },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
        });
        await prisma_1.default.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
        res.status(201).json(message);
    }
    catch {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
