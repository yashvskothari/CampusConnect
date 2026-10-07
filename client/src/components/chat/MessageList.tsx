import { useEffect, useRef } from 'react';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  typingText?: string | null;
}

export default function MessageList({ messages, currentUserId, typingText }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-0">
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[160px] items-center justify-center text-center text-xs text-surface-600">
          No messages yet. Send a message to start the conversation!
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  isMe
                    ? 'brand-gradient text-white rounded-br-xs'
                    : 'bg-surface-200 border border-surface-300 text-surface-900 rounded-bl-xs'
                }`}
              >
                {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                {msg.fileUrl && (
                  <div className="mt-1.5">
                    {msg.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                      <img
                        src={msg.fileUrl}
                        alt="attachment"
                        className="max-h-48 rounded-lg object-cover"
                      />
                    ) : (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-xs text-primary-300 hover:text-white"
                      >
                        View Attachment
                      </a>
                    )}
                  </div>
                )}
                <span
                  className={`mt-1 block text-[10px] ${
                    isMe ? 'text-white/70 text-right' : 'text-surface-600'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
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
