import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { X } from 'lucide-react';
import Avatar from '../Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { messageApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useMessageActions, applyMessageUpdate, sendAttachment } from '../../hooks/useMessageActions';
import type { Conversation, Message } from '../../types';

interface ChatModalProps {
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatModal({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  isOpen,
  onClose,
}: ChatModalProps) {
  const { user, token } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const receiverTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { editing, startEdit, cancelEdit, submitEdit, unsend } = useMessageActions(socketRef);

  useEffect(() => {
    if (!isOpen || !token || !targetUserId) return;
    setError(null);
    setLoading(true);

    // Initialize or fetch conversation
    messageApi
      .createConversation(targetUserId)
      .then(({ data }) => {
        setConversation(data);
        return messageApi.getMessages(data.id);
      })
      .then(({ data }) => setMessages(data))
      .catch((err: unknown) => {
        const errObj = err as { response?: { data?: { error?: string } } };
        setError(
          errObj.response?.data?.error ||
            'Unable to start chat. Chat is restricted to freelancers and clients who share a proposal or project.'
        );
      })
      .finally(() => setLoading(false));

    // Connect WebSocket
    const socket = io(SOCKET_URL || window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('online_users', (users: string[]) => {
      setIsOnline(users.includes(targetUserId));
    });

    socket.on('user_online', ({ userId }: { userId: string }) => {
      if (userId === targetUserId) setIsOnline(true);
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      if (userId === targetUserId) setIsOnline(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen, targetUserId, token]);

  useEffect(() => {
    if (!conversation || !socketRef.current) return;
    const socket = socketRef.current;
    socket.emit('join_conversation', conversation.id);

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === conversation.id) {
        if (msg.senderId === targetUserId) {
          if (receiverTypingTimeoutRef.current) {
            clearTimeout(receiverTypingTimeoutRef.current);
            receiverTypingTimeoutRef.current = null;
          }
          setTyping(null);
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId === targetUserId) {
        if (receiverTypingTimeoutRef.current) {
          clearTimeout(receiverTypingTimeoutRef.current);
          receiverTypingTimeoutRef.current = null;
        }
        if (isTyping) {
          setTyping(`${targetUserName} is typing...`);
          receiverTypingTimeoutRef.current = setTimeout(() => {
            setTyping(null);
          }, 4000);
        } else {
          setTyping(null);
        }
      }
    };

    const handleMessageUpdated = (msg: Message) => {
      if (msg.conversationId === conversation.id) {
        setMessages((prev) => applyMessageUpdate(prev, msg));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('typing', handleTyping);

    return () => {
      if (receiverTypingTimeoutRef.current) {
        clearTimeout(receiverTypingTimeoutRef.current);
      }
      setTyping(null);
      socket.emit('leave_conversation', conversation.id);
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('typing', handleTyping);
    };
  }, [conversation, targetUserId, targetUserName]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-125 w-84 sm:w-96 flex-col overflow-hidden rounded-2xl border border-surface-300 bg-surface-100 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-300 bg-surface-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={targetUserName} src={targetUserAvatar} size="sm" />
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface-100 ${
                isOnline ? 'bg-emerald-500' : 'bg-surface-500'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900 leading-tight">{targetUserName}</p>
            <p className="text-[11px] text-surface-600">{isOnline ? 'Active now' : 'Offline'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-red-400 bg-surface-0">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <MessageList
            messages={messages}
            currentUserId={user?.id}
            typingText={typing}
            onEditMessage={startEdit}
            onUnsendMessage={unsend}
          />
          <MessageInput
            disabled={!conversation}
            editingMessage={editing}
            onSubmitEdit={submitEdit}
            onCancelEdit={cancelEdit}
            onSendMessage={(text) => {
              if (conversation && socketRef.current) {
                socketRef.current.emit('send_message', { conversationId: conversation.id, text });
              }
            }}
            onSendAttachment={async (file, text, onProgress) => {
              if (!conversation) throw new Error('No conversation');
              const msg = await sendAttachment(conversation.id, file, text, onProgress);
              setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            }}
            onTyping={(isTyping) => {
              if (conversation && socketRef.current) {
                socketRef.current.emit('typing', { conversationId: conversation.id, isTyping });
              }
            }}
          />
        </>
      )}
    </div>
  );
}
