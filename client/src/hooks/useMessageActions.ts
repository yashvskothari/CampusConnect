import { useCallback, useState, type RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { messageApi } from '../services';
import type { Message } from '../types';

type Ack = { ok: boolean; error?: string };

/** Edit / unsend helpers shared by ChatModal and MessagesPage. */
export function useMessageActions(socketRef: RefObject<Socket | null>) {
  const [editing, setEditing] = useState<Message | null>(null);

  const cancelEdit = useCallback(() => setEditing(null), []);

  const submitEdit = useCallback(
    (messageId: string, text: string) => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit('edit_message', { messageId, text }, (res?: Ack) => {
        if (res && !res.ok) toast.error(res.error || 'Could not edit message');
      });
      setEditing(null);
    },
    [socketRef]
  );

  const unsend = useCallback(
    (message: Message) => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit('delete_message', { messageId: message.id }, (res?: Ack) => {
        if (res && !res.ok) toast.error(res.error || 'Could not unsend message');
      });
      setEditing((cur) => (cur?.id === message.id ? null : cur));
    },
    [socketRef]
  );

  return { editing, startEdit: setEditing, cancelEdit, submitEdit, unsend };
}

/** Replace a message in a list with its updated version (edit or unsend). */
export const applyMessageUpdate = (list: Message[], updated: Message) =>
  list.map((m) => (m.id === updated.id ? { ...m, ...updated } : m));

/**
 * Uploads a file to a conversation. Shows the server's error (wrong type,
 * too large, ...) as a toast and re-throws so the input keeps the draft.
 */
export async function sendAttachment(
  conversationId: string,
  file: File,
  text: string,
  onProgress: (percent: number) => void
): Promise<Message> {
  try {
    const { data } = await messageApi.sendAttachment(conversationId, file, text, onProgress);
    return data;
  } catch (err) {
    const message =
      (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
      'Could not send the file. Please try again.';
    toast.error(message);
    throw err;
  }
}
