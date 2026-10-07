import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../utils/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Map<string, number>();

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
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

    // Track active connection count per user
    const currentCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, currentCount + 1);
    if (currentCount === 0) {
      io.emit('user_online', { userId });
    }
    // Inform this socket of all currently online users
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    socket.on('join_conversation', async (conversationId: string) => {
      try {
        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId },
        });
        if (participant) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.error('join_conversation error:', err);
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        isTyping: false,
      });
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
        if (!text?.trim() && !fileUrl) return;

        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId },
        });
        if (!participant) return;

        const message = await prisma.message.create({
          data: {
            text: text ? text.trim() : '',
            fileUrl: fileUrl || null,
            senderId: userId,
            conversationId,
          },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast to focused room
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        // When a message is sent, clear typing indicator for the sender in this conversation
        socket.to(`conversation:${conversationId}`).emit('typing', {
          conversationId,
          userId,
          isTyping: false,
        });

        // Notify participants in their personal rooms (for unread count/toasts)
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        for (const p of participants) {
          io.to(`user:${p.userId}`).emit('notification_message', {
            message,
            conversationId,
          });
        }
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    socket.on('disconnect', () => {
      const remaining = (onlineUsers.get(userId) || 1) - 1;
      if (remaining <= 0) {
        onlineUsers.delete(userId);
        io.emit('user_offline', { userId });
      } else {
        onlineUsers.set(userId, remaining);
      }
    });
  });

  return io;
}
