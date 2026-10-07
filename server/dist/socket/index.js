"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const prisma_1 = __importDefault(require("../utils/prisma"));
const onlineUsers = new Map();
function setupSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
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
        });
        socket.on('typing', ({ conversationId, isTyping }) => {
            socket.to(`conversation:${conversationId}`).emit('typing', {
                conversationId,
                userId,
                isTyping,
            });
        });
        socket.on('send_message', async ({ conversationId, text, fileUrl }) => {
            try {
                if (!text?.trim() && !fileUrl)
                    return;
                const participant = await prisma_1.default.conversationParticipant.findFirst({
                    where: { conversationId, userId },
                });
                if (!participant)
                    return;
                const message = await prisma_1.default.message.create({
                    data: {
                        text: text ? text.trim() : '',
                        fileUrl: fileUrl || null,
                        senderId: userId,
                        conversationId,
                    },
                    include: { sender: { select: { id: true, name: true, avatar: true } } },
                });
                await prisma_1.default.conversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() },
                });
                // Broadcast to focused room
                io.to(`conversation:${conversationId}`).emit('new_message', message);
                // Notify participants in their personal rooms (for unread count/toasts)
                const participants = await prisma_1.default.conversationParticipant.findMany({
                    where: { conversationId },
                    select: { userId: true },
                });
                for (const p of participants) {
                    io.to(`user:${p.userId}`).emit('notification_message', {
                        message,
                        conversationId,
                    });
                }
            }
            catch (error) {
                console.error('Socket message error:', error);
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
