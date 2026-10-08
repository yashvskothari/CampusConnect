import { useEffect, useRef, useState } from 'react';
import { Ban, Check, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import type { Message } from '../../types';
import { canEditMessage, isEmojiOnly } from '../../utils/chat';
import MessageAttachment from './MessageAttachment';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  typingText?: string | null;
  onEditMessage?: (message: Message) => void;
  onUnsendMessage?: (message: Message) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  typingText,
  onEditMessage,
  onUnsendMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Re-evaluate the 15 minute edit window while the chat stays open
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingText]);

  const closeMenu = () => {
    setOpenMenuId(null);
    setConfirmId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-0" onClick={closeMenu}>
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[160px] items-center justify-center text-center text-xs text-surface-600">
          No messages yet. Send a message to start the conversation!
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          const deleted = Boolean(msg.deletedAt);
          const emojiOnly = !deleted && !msg.fileUrl && isEmojiOnly(msg.text);
          const canEdit = isMe && !deleted && Boolean(msg.text) && canEditMessage(msg.createdAt, now);
          const showActions = isMe && !deleted && (onEditMessage || onUnsendMessage);
          const menuOpen = openMenuId === msg.id;
          const confirming = confirmId === msg.id;

          return (
            <div key={msg.id} className={`group flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {showActions && (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {confirming ? (
                    <div className="flex items-center gap-1 rounded-full border border-surface-300 bg-surface-200 px-2 py-1 text-[11px] text-surface-800">
                      <span>Unsend?</span>
                      <button
                        type="button"
                        aria-label="Confirm unsend"
                        onClick={() => {
                          onUnsendMessage?.(msg);
                          closeMenu();
                        }}
                        className="rounded-full p-0.5 text-red-400 hover:bg-red-500/20 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel unsend"
                        onClick={closeMenu}
                        className="rounded-full p-0.5 text-surface-700 hover:bg-surface-300 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : menuOpen ? (
                    <div className="flex items-center gap-0.5 rounded-full border border-surface-300 bg-surface-200 p-0.5">
                      {canEdit && onEditMessage && (
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit message"
                          onClick={() => {
                            onEditMessage(msg);
                            closeMenu();
                          }}
                          className="rounded-full p-1.5 text-surface-800 hover:bg-surface-300 hover:text-white cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onUnsendMessage && (
                        <button
                          type="button"
                          title="Unsend"
                          aria-label="Unsend message"
                          onClick={() => setConfirmId(msg.id)}
                          className="rounded-full p-1.5 text-surface-800 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label="Message options"
                      onClick={() => setOpenMenuId(msg.id)}
                      className="rounded-full p-1 text-surface-600 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-surface-200 hover:text-surface-900 cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {deleted ? (
                <div className="max-w-[78%] rounded-2xl border border-dashed border-surface-400 px-3.5 py-2 text-sm italic text-surface-600">
                  <span className="flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5" />
                    {isMe ? 'You unsent a message' : 'This message was unsent'}
                  </span>
                </div>
              ) : emojiOnly ? (
                <div className="max-w-[78%]">
                  <p className="text-4xl leading-tight">{msg.text}</p>
                  <span className={`block text-[10px] text-surface-600 ${isMe ? 'text-right' : ''}`}>
                    {msg.editedAt && 'Edited · '}
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    isMe
                      ? 'brand-gradient text-white rounded-br-xs'
                      : 'bg-surface-200 border border-surface-300 text-surface-900 rounded-bl-xs'
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                  {msg.fileUrl && <MessageAttachment message={msg} isMe={isMe} />}
                  <span
                    className={`mt-1 block text-[10px] ${isMe ? 'text-white/70 text-right' : 'text-surface-600'}`}
                  >
                    {msg.editedAt && 'Edited · '}
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
      {typingText && (
        <div className="flex justify-start">
          <div className="rounded-xl bg-surface-200 border border-surface-300 px-3 py-1.5 text-xs text-primary-400 italic">
            {typingText}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
