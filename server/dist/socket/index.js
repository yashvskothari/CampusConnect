"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishMessage = publishMessage;
exports.setupSocket = setupSocket;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const prisma_1 = __importDefault(require("../utils/prisma"));
const messageActions_1 = require("../utils/messageActions");
const onlineUsers = new Map();
let ioInstance = null;
/**
 * Broadcasts a freshly created message to everyone in the conversation.
 * Shared by the socket "send_message" handler and the REST attachment upload.
 */
async function publishMessage(message) {
    if (!ioInstance)
        return;
    const { conversationId } = message;
    // Broadcast to focused room
    ioInstance.to(`conversation:${conversationId}`).emit('new_message', message);
    // Notify participants in their personal rooms (for unread count/toasts)
    const participants = await prisma_1.default.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
    });
    for (const p of participants) {
        ioInstance.to(`user:${p.userId}`).emit('notification_message', { message, conversationId });
    }
}
function setupSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (origin === process.env.CLIENT_URL ||
                    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
                    /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
                    return callback(null, true);
                }
                return callback(null, false);
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    ioInstance = io;
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            next(new Error('Authentication required'));
            return;
        }
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            socket.userId = decoded.userId;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        socket.join(`user:${userId}`);
        // Track active connection count per user
        const currentCount = onlineUsers.get(userId) || 0;
        onlineUsers.set(userId, currentCount + 1);
        if (currentCount === 0) {
            io.emit('user_online', { userId });
        }
        // Inform this socket of all currently online users
        socket.emit('online_users', Array.from(onlineUsers.keys()));
        socket.on('join_conversation', async (conversationId) => {
            try {
                const participant = await prisma_1.default.conversationParticipant.findFirst({
                    where: { conversationId, userId },
                });
                if (participant) {
                    socket.join(`conversation:${conversationId}`);
                }
            }
            catch (err) {
                console.error('join_conversation error:', err);
            }
        });
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            socket.to(`conversation:${conversationId}`).emit('typing', {
                conversationId,
                userId,
                isTyping: false,
            });
        });
        socket.on('typing', ({ conversationId, isTyping }) => {
            socket.to(`conversation:${conversationId}`).emit('typing', {
                conversationId,
                userId,
                isTyping,
            });
        });
        // Text only. Files must go through the validated REST upload
        // (POST /api/messages/conversations/:id/attachments) so type, size and
        // ownership are always checked — clients can never inject a file reference.
        socket.on('send_message', async ({ conversationId, text }) => {
            try {
                if (!text?.trim())
                    return;
                const participant = await prisma_1.default.conversationParticipant.findFirst({
                    where: { conversationId, userId },
                });
                if (!participant)
                    return;
                const message = await prisma_1.default.message.create({
                    data: {
                        text: text.trim().slice(0, messageActions_1.MAX_MESSAGE_LENGTH),
                        senderId: userId,
                        conversationId,
                    },
                    include: { sender: { select: { id: true, name: true, avatar: true } } },
                });
                await prisma_1.default.conversation.update({
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
            }
            catch (error) {
                console.error('Socket message error:', error);
            }
        });
        const broadcastUpdate = async (conversationId, message) => {
            const participants = await prisma_1.default.conversationParticipant.findMany({
                where: { conversationId },
                select: { userId: true },
            });
            // Chained .to() delivers once per socket even if it is in several of these rooms
            let target = io.to(`conversation:${conversationId}`);
            for (const p of participants)
                target = target.to(`user:${p.userId}`);
            target.emit('message_updated', message);
        };
        socket.on('edit_message', async ({ messageId, text }, ack) => {
            try {
                const result = await (0, messageActions_1.editMessage)(userId, messageId, text);
                if (!result.ok)
                    return ack?.({ ok: false, error: result.error });
                await broadcastUpdate(result.message.conversationId, result.message);
                ack?.({ ok: true });
            }
            catch (error) {
                console.error('Socket edit error:', error);
                ack?.({ ok: false, error: 'Failed to edit message' });
            }
        });
        socket.on('delete_message', async ({ messageId }, ack) => {
            try {
                const result = await (0, messageActions_1.unsendMessage)(userId, messageId);
                if (!result.ok)
                    return ack?.({ ok: false, error: result.error });
                await broadcastUpdate(result.message.conversationId, result.message);
                ack?.({ ok: true });
            }
            catch (error) {
                console.error('Socket delete error:', error);
                ack?.({ ok: false, error: 'Failed to unsend message' });
            }
        });
        socket.on('disconnect', () => {
            const remaining = (onlineUsers.get(userId) || 1) - 1;
            if (remaining <= 0) {
                onlineUsers.delete(userId);
                io.emit('user_offline', { userId });
            }
            else {
                onlineUsers.set(userId, remaining);
            }
        });
    });
    return io;
}
