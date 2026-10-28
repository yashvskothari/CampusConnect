"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const params_1 = require("../utils/params");
const chatAuth_1 = require("../utils/chatAuth");
const messageActions_1 = require("../utils/messageActions");
const socket_1 = require("../socket");
const attachments_1 = require("../utils/attachments");
class UploadRejected extends Error {
}
// Files are held in memory (max 10 MB) so they can be validated BEFORE anything
// touches the disk. Rejected files are never written anywhere.
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: attachments_1.MAX_ATTACHMENT_BYTES, files: 1, fields: 5 },
    fileFilter: (_req, file, cb) => {
        if (!(0, attachments_1.isAllowedExtension)((0, attachments_1.sanitizeDisplayName)(file.originalname))) {
            cb(new UploadRejected('This file type is not allowed. Only photos, audio, and documents (PDF, Word, MD, …) can be attached.'));
            return;
        }
        cb(null, true);
    },
});
/** Only conversation participants may upload — checked before the body is buffered. */
async function requireParticipant(req, res, next) {
    try {
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId: (0, params_1.getParam)(req.params.id), userId: req.user.userId },
        });
        if (!participant) {
            res.status(403).json({ error: 'Not a participant' });
            return;
        }
        next();
    }
    catch {
        res.status(500).json({ error: 'Failed to verify conversation' });
    }
}
/** Runs multer and turns its errors into clean JSON responses. */
function handleAttachmentUpload(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof UploadRejected) {
            res.status(400).json({ error: err.message });
        }
        else if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: `File is too large. The maximum size is ${attachments_1.MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.` });
        }
        else {
            res.status(400).json({ error: 'Upload failed. Please try again with a single, valid file.' });
        }
    });
}
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
// Text-only. Files go through /attachments below so they are always validated.
router.post('/conversations/:id/messages', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const conversationId = (0, params_1.getParam)(req.params.id);
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId, userId: req.user.userId },
        });
        if (!participant) {
            res.status(403).json({ error: 'Not a participant' });
            return;
        }
        const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
        if (!text) {
            res.status(400).json({ error: 'Message text required' });
            return;
        }
        const message = await prisma_1.default.message.create({
            data: {
                text: text.slice(0, messageActions_1.MAX_MESSAGE_LENGTH),
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
// Send a file (image or document) with an optional caption.
router.post('/conversations/:id/attachments', auth_middleware_1.authenticate, requireParticipant, handleAttachmentUpload, async (req, res) => {
    let storedKey = null;
    try {
        const conversationId = (0, params_1.getParam)(req.params.id);
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'No file received.' });
            return;
        }
        const displayName = (0, attachments_1.sanitizeDisplayName)(file.originalname);
        const checked = (0, attachments_1.validateAttachment)(displayName, file.buffer);
        if (!checked.ok) {
            res.status(400).json({ error: checked.error });
            return;
        }
        const caption = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, messageActions_1.MAX_MESSAGE_LENGTH) : '';
        storedKey = await (0, attachments_1.saveAttachment)(file.buffer, checked.ext);
        const message = await prisma_1.default.message.create({
            data: {
                text: caption,
                fileUrl: storedKey,
                fileName: displayName,
                fileType: checked.mime,
                fileSize: file.size,
                senderId: req.user.userId,
                conversationId,
            },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
        });
        await prisma_1.default.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
        // Real-time delivery to the other person (and the sender's other tabs)
        await (0, socket_1.publishMessage)(message);
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Attachment upload error:', error);
        await (0, attachments_1.deleteAttachment)(storedKey); // don't leave an orphaned file behind
        res.status(500).json({ error: 'Failed to send attachment' });
    }
});
// Authenticated download — only the two people in the conversation can open a file.
router.get('/:id/attachment', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const message = await prisma_1.default.message.findUnique({
            where: { id: (0, params_1.getParam)(req.params.id) },
            select: { fileUrl: true, fileName: true, fileType: true, conversationId: true, deletedAt: true },
        });
        if (!message || !message.fileUrl || message.deletedAt) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId: message.conversationId, userId: req.user.userId },
        });
        if (!participant) {
            res.status(403).json({ error: 'Not a participant' });
            return;
        }
        const filePath = (0, attachments_1.attachmentPath)(message.fileUrl);
        if (!filePath || !fs_1.default.existsSync(filePath)) {
            res.status(404).json({ error: 'This file is no longer available.' });
            return;
        }
        const name = message.fileName || 'attachment';
        const asciiName = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
        res.setHeader('Content-Type', message.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(name)}`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.sendFile(filePath, { dotfiles: 'deny' });
    }
    catch {
        res.status(500).json({ error: 'Failed to load attachment' });
    }
});
router.patch('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const result = await (0, messageActions_1.editMessage)(req.user.userId, (0, params_1.getParam)(req.params.id), req.body?.text);
        if (!result.ok) {
            res.status(result.status).json({ error: result.error });
            return;
        }
        res.json(result.message);
    }
    catch {
        res.status(500).json({ error: 'Failed to edit message' });
    }
});
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const result = await (0, messageActions_1.unsendMessage)(req.user.userId, (0, params_1.getParam)(req.params.id));
        if (!result.ok) {
            res.status(result.status).json({ error: result.error });
            return;
        }
        res.json(result.message);
    }
    catch {
        res.status(500).json({ error: 'Failed to unsend message' });
    }
});
exports.default = router;
