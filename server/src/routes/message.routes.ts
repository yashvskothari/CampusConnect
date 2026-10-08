import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';
import { canUsersChat } from '../utils/chatAuth';
import { editMessage, unsendMessage, MAX_MESSAGE_LENGTH } from '../utils/messageActions';
import { publishMessage } from '../socket';
import {
  MAX_ATTACHMENT_BYTES,
  attachmentPath,
  deleteAttachment,
  isAllowedExtension,
  sanitizeDisplayName,
  saveAttachment,
  validateAttachment,
} from '../utils/attachments';

class UploadRejected extends Error {}

// Files are held in memory (max 10 MB) so they can be validated BEFORE anything
// touches the disk. Rejected files are never written anywhere.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedExtension(sanitizeDisplayName(file.originalname))) {
      cb(new UploadRejected('This file type is not allowed. Only documents (PDF, DOCX, MD, …) and images (PNG, JPG, …) can be attached.'));
      return;
    }
    cb(null, true);
  },
});

/** Only conversation participants may upload — checked before the body is buffered. */
async function requireParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: getParam(req.params.id), userId: req.user!.userId },
    });
    if (!participant) {
      res.status(403).json({ error: 'Not a participant' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: 'Failed to verify conversation' });
  }
}

/** Runs multer and turns its errors into clean JSON responses. */
function handleAttachmentUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof UploadRejected) {
      res.status(400).json({ error: err.message });
    } else if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: `File is too large. The maximum size is ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.` });
    } else {
      res.status(400).json({ error: 'Upload failed. Please try again with a single, valid file.' });
    }
  });
}

const router = Router();

router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: req.user!.userId } },
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

    const allowed = await canUsersChat(req.user!.userId, participantId);
    if (!allowed) {
      res.status(403).json({
        error: 'Chat is restricted to freelancers and clients who share an active proposal, job, or contract.',
      });
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
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

// Text-only. Files go through /attachments below so they are always validated.
router.post('/conversations/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const conversationId = getParam(req.params.id);
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: req.user!.userId },
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

    const message = await prisma.message.create({
      data: {
        text: text.slice(0, MAX_MESSAGE_LENGTH),
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

// Send a file (image or document) with an optional caption.
router.post(
  '/conversations/:id/attachments',
  authenticate,
  requireParticipant,
  handleAttachmentUpload,
  async (req: Request, res: Response) => {
    let storedKey: string | null = null;
    try {
      const conversationId = getParam(req.params.id);
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file received.' });
        return;
      }

      const displayName = sanitizeDisplayName(file.originalname);
      const checked = validateAttachment(displayName, file.buffer);
      if (!checked.ok) {
        res.status(400).json({ error: checked.error });
        return;
      }

      const caption = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, MAX_MESSAGE_LENGTH) : '';

      storedKey = await saveAttachment(file.buffer, checked.ext);

      const message = await prisma.message.create({
        data: {
          text: caption,
          fileUrl: storedKey,
          fileName: displayName,
          fileType: checked.mime,
          fileSize: file.size,
          senderId: req.user!.userId,
          conversationId,
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Real-time delivery to the other person (and the sender's other tabs)
      await publishMessage(message);

      res.status(201).json(message);
    } catch (error) {
      console.error('Attachment upload error:', error);
      await deleteAttachment(storedKey); // don't leave an orphaned file behind
      res.status(500).json({ error: 'Failed to send attachment' });
    }
  }
);

// Authenticated download — only the two people in the conversation can open a file.
router.get('/:id/attachment', authenticate, async (req: Request, res: Response) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: getParam(req.params.id) },
      select: { fileUrl: true, fileName: true, fileType: true, conversationId: true, deletedAt: true },
    });
    if (!message || !message.fileUrl || message.deletedAt) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: message.conversationId, userId: req.user!.userId },
    });
    if (!participant) {
      res.status(403).json({ error: 'Not a participant' });
      return;
    }

    const filePath = attachmentPath(message.fileUrl);
    if (!filePath || !fs.existsSync(filePath)) {
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
  } catch {
    res.status(500).json({ error: 'Failed to load attachment' });
  }
});

router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await editMessage(req.user!.userId, getParam(req.params.id), req.body?.text);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.message);
  } catch {
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await unsendMessage(req.user!.userId, getParam(req.params.id));
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.message);
  } catch {
    res.status(500).json({ error: 'Failed to unsend message' });
  }
});

export default router;
