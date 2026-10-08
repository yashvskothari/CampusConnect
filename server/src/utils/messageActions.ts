import prisma from './prisma';
import { deleteAttachment } from './attachments';

export const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes, like WhatsApp / Instagram
export const MAX_MESSAGE_LENGTH = 2000;

const senderSelect = { select: { id: true, name: true, avatar: true } };

export type ActionResult =
  | { ok: true; message: any }
  | { ok: false; status: number; error: string };

export async function editMessage(userId: string, messageId: string, newText: string): Promise<ActionResult> {
  const text = (newText ?? '').trim();
  if (!text) return { ok: false, status: 400, error: 'Message cannot be empty' };
  if (text.length > MAX_MESSAGE_LENGTH) return { ok: false, status: 400, error: 'Message is too long' };

  const existing = await prisma.message.findUnique({ where: { id: messageId } });
  if (!existing) return { ok: false, status: 404, error: 'Message not found' };
  if (existing.senderId !== userId) return { ok: false, status: 403, error: 'You can only edit your own messages' };
  if (existing.deletedAt) return { ok: false, status: 400, error: 'Deleted messages cannot be edited' };
  if (Date.now() - existing.createdAt.getTime() > EDIT_WINDOW_MS) {
    return { ok: false, status: 400, error: 'Messages can only be edited within 15 minutes of sending' };
  }
  if (existing.text === text) return { ok: true, message: await withSender(messageId) };

  await prisma.message.update({ where: { id: messageId }, data: { text, editedAt: new Date() } });
  return { ok: true, message: await withSender(messageId) };
}

export async function unsendMessage(userId: string, messageId: string): Promise<ActionResult> {
  const existing = await prisma.message.findUnique({ where: { id: messageId } });
  if (!existing) return { ok: false, status: 404, error: 'Message not found' };
  if (existing.senderId !== userId) return { ok: false, status: 403, error: 'You can only unsend your own messages' };
  if (existing.deletedAt) return { ok: true, message: await withSender(messageId) };

  // Soft delete: wipe the content so it is gone for both people, keep the row as a placeholder
  await prisma.message.update({
    where: { id: messageId },
    data: { text: '', fileUrl: null, fileName: null, fileType: null, fileSize: null, deletedAt: new Date() },
  });
  // Also remove the stored file so an unsent attachment is really gone
  await deleteAttachment(existing.fileUrl);
  return { ok: true, message: await withSender(messageId) };
}

function withSender(messageId: string) {
  return prisma.message.findUnique({ where: { id: messageId }, include: { sender: senderSelect } });
}
