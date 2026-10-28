"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_MESSAGE_LENGTH = exports.EDIT_WINDOW_MS = void 0;
exports.editMessage = editMessage;
exports.unsendMessage = unsendMessage;
const prisma_1 = __importDefault(require("./prisma"));
const attachments_1 = require("./attachments");
exports.EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes, like WhatsApp / Instagram
exports.MAX_MESSAGE_LENGTH = 2000;
const senderSelect = { select: { id: true, name: true, avatar: true } };
async function editMessage(userId, messageId, newText) {
    const text = (newText ?? '').trim();
    if (!text)
        return { ok: false, status: 400, error: 'Message cannot be empty' };
    if (text.length > exports.MAX_MESSAGE_LENGTH)
        return { ok: false, status: 400, error: 'Message is too long' };
    const existing = await prisma_1.default.message.findUnique({ where: { id: messageId } });
    if (!existing)
        return { ok: false, status: 404, error: 'Message not found' };
    if (existing.senderId !== userId)
        return { ok: false, status: 403, error: 'You can only edit your own messages' };
    if (existing.deletedAt)
        return { ok: false, status: 400, error: 'Deleted messages cannot be edited' };
    if (Date.now() - existing.createdAt.getTime() > exports.EDIT_WINDOW_MS) {
        return { ok: false, status: 400, error: 'Messages can only be edited within 15 minutes of sending' };
    }
    if (existing.text === text)
        return { ok: true, message: await withSender(messageId) };
    await prisma_1.default.message.update({ where: { id: messageId }, data: { text, editedAt: new Date() } });
    return { ok: true, message: await withSender(messageId) };
}
async function unsendMessage(userId, messageId) {
    const existing = await prisma_1.default.message.findUnique({ where: { id: messageId } });
    if (!existing)
        return { ok: false, status: 404, error: 'Message not found' };
    if (existing.senderId !== userId)
        return { ok: false, status: 403, error: 'You can only unsend your own messages' };
    if (existing.deletedAt)
        return { ok: true, message: await withSender(messageId) };
    // Soft delete: wipe the content so it is gone for both people, keep the row as a placeholder
    await prisma_1.default.message.update({
        where: { id: messageId },
        data: { text: '', fileUrl: null, fileName: null, fileType: null, fileSize: null, deletedAt: new Date() },
    });
    // Also remove the stored file so an unsent attachment is really gone
    await (0, attachments_1.deleteAttachment)(existing.fileUrl);
    return { ok: true, message: await withSender(messageId) };
}
function withSender(messageId) {
    return prisma_1.default.message.findUnique({ where: { id: messageId }, include: { sender: senderSelect } });
}
