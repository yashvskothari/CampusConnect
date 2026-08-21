import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: req.user!.userId } },
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.post('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      res.status(400).json({ error: 'Participant ID required' });
      return;
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.user!.userId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    if (existing) {
      res.json(existing);
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: req.user!.userId },
            { userId: participantId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });
    res.status(201).json(conversation);
  } catch {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const conversationId = getParam(req.params.id);
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: req.user!.userId },
    });
    if (!participant) {
      res.status(403).json({ error: 'Not a participant' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/conversations/:id/messages', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const conversationId = getParam(req.params.id);
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: req.user!.userId },
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

    const message = await prisma.message.create({
      data: {
        text: text || '',
        fileUrl,
        senderId: req.user!.userId,
        conversationId,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
