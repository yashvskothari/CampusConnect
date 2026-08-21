import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../utils/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        isTyping,
      });
    });

    socket.on('send_message', async ({ conversationId, text, fileUrl }: { conversationId: string; text: string; fileUrl?: string }) => {
      try {
        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId },
        });
        if (!participant) return;

        const message = await prisma.message.create({
          data: { text, fileUrl: fileUrl || null, senderId: userId, conversationId },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${conversationId}`).emit('new_message', message);
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });
  });

  return io;
}
