import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { editMessage, unsendMessage, MAX_MESSAGE_LENGTH } from '../utils/messageActions';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Map<string, number>();

let ioInstance: Server | null = null;

/**
 * Broadcasts a freshly created message to everyone in the conversation.
 * Shared by the socket "send_message" handler and the REST attachment upload.
 */
export async function publishMessage(message: { id: string; conversationId: string; senderId: string }) {
  if (!ioInstance) return;
  const { conversationId } = message;

  // Broadcast to focused room
  ioInstance.to(`conversation:${conversationId}`).emit('new_message', message);

  // Notify participants in their personal rooms (for unread count/toasts)
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  for (const p of participants) {
    ioInstance.to(`user:${p.userId}`).emit('notification_message', { message, conversationId });
  }
}

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance = io;

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

    // Text only. Files must go through the validated REST upload
    // (POST /api/messages/conversations/:id/attachments) so type, size and
    // ownership are always checked — clients can never inject a file reference.
    socket.on('send_message', async ({ conversationId, text }: { conversationId: string; text: string }) => {
      try {
        if (!text?.trim()) return;

        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, userId },
        });
        if (!participant) return;

        const message = await prisma.message.create({
          data: {
            text: text.trim().slice(0, MAX_MESSAGE_LENGTH),
            senderId: userId,
            conversationId,
          },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        await publishMessage(message);

        // When a message is sent, clear typing indicator for the sender in this conversation
        socket.to(`conversation:${conversationId}`).emit('typing', {
          conversationId,
          userId,
          isTyping: false,
        });
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    const broadcastUpdate = async (conversationId: string, message: unknown) => {
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });
      // Chained .to() delivers once per socket even if it is in several of these rooms
      let target = io.to(`conversation:${conversationId}`);
      for (const p of participants) target = target.to(`user:${p.userId}`);
      target.emit('message_updated', message);
    };

    socket.on('edit_message', async ({ messageId, text }: { messageId: string; text: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
      try {
        const result = await editMessage(userId, messageId, text);
        if (!result.ok) return ack?.({ ok: false, error: result.error });
        await broadcastUpdate(result.message.conversationId, result.message);
        ack?.({ ok: true });
      } catch (error) {
        console.error('Socket edit error:', error);
        ack?.({ ok: false, error: 'Failed to edit message' });
      }
    });

    socket.on('delete_message', async ({ messageId }: { messageId: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
      try {
        const result = await unsendMessage(userId, messageId);
        if (!result.ok) return ack?.({ ok: false, error: result.error });
        await broadcastUpdate(result.message.conversationId, result.message);
        ack?.({ ok: true });
      } catch (error) {
        console.error('Socket delete error:', error);
        ack?.({ ok: false, error: 'Failed to unsend message' });
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
