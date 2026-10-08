import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { messageApi } from '../services';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import { useAuth } from '../context/AuthContext';
import { useMessageActions, applyMessageUpdate, sendAttachment } from '../hooks/useMessageActions';
import { messagePreview } from '../utils/chat';
import type { Conversation, Message } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function MessagesPage() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const receiverTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { editing, startEdit, cancelEdit, submitEdit, unsend } = useMessageActions(socketRef);

  useEffect(() => {
    messageApi.getConversations().then(({ data }) => {
      setConversations(data);
      const userId = searchParams.get('user');
      if (userId) {
        messageApi
          .createConversation(userId)
          .then(({ data: conv }) => {
            setActiveConv(conv);
            setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
          })
          .catch((err) => {
            toast.error(err.response?.data?.error || 'Unable to open conversation.');
          });
      }
    }).catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL || window.location.origin, { auth: { token } });
    socketRef.current = socket;

    const onNotificationMessage = ({ message }: { message: Message }) => {
      setConversations((prev) => {
        const found = prev.find((c) => c.id === message.conversationId);
        if (!found) {
          messageApi.getConversations().then(({ data }) => setConversations(data)).catch(() => {});
          return prev;
        }
        const updated = { ...found, messages: [message] };
        return [updated, ...prev.filter((c) => c.id !== message.conversationId)];
      });
    };

    // Keep the sidebar preview in sync when the latest message is edited / unsent
    const onMessageUpdatedSidebar = (updated: Message) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === updated.conversationId && c.messages?.[0]?.id === updated.id
            ? { ...c, messages: [{ ...c.messages[0], ...updated }] }
            : c
        )
      );
    };

    socket.on('notification_message', onNotificationMessage);
    socket.on('message_updated', onMessageUpdatedSidebar);

    return () => {
      socket.off('notification_message', onNotificationMessage);
      socket.off('message_updated', onMessageUpdatedSidebar);
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!activeConv || !socketRef.current) return;
    socketRef.current.emit('join_conversation', activeConv.id);

    messageApi.getMessages(activeConv.id).then(({ data }) => setMessages(data));

    const onMessage = (msg: Message) => {
      if (msg.conversationId === activeConv.id) {
        if (msg.senderId !== user?.id) {
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
        setConversations((prev) => {
          const found = prev.find((c) => c.id === msg.conversationId);
          if (!found) return prev;
          const updated = { ...found, messages: [msg] };
          return [updated, ...prev.filter((c) => c.id !== msg.conversationId)];
        });
      }
    };
    const onTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) {
        if (receiverTypingTimeoutRef.current) {
          clearTimeout(receiverTypingTimeoutRef.current);
          receiverTypingTimeoutRef.current = null;
        }
        if (isTyping) {
          const other = getOtherParticipant(activeConv);
          setTyping(other ? `${other.name} is typing...` : 'typing...');
          receiverTypingTimeoutRef.current = setTimeout(() => {
            setTyping(null);
          }, 4000);
        } else {
          setTyping(null);
        }
      }
    };

    const onMessageUpdated = (msg: Message) => {
      if (msg.conversationId === activeConv.id) {
        setMessages((prev) => applyMessageUpdate(prev, msg));
      }
    };

    socketRef.current.on('new_message', onMessage);
    socketRef.current.on('message_updated', onMessageUpdated);
    socketRef.current.on('typing', onTyping);

    return () => {
      cancelEdit();
      if (receiverTypingTimeoutRef.current) {
        clearTimeout(receiverTypingTimeoutRef.current);
      }
      setTyping(null);
      socketRef.current?.off('new_message', onMessage);
      socketRef.current?.off('message_updated', onMessageUpdated);
      socketRef.current?.off('typing', onTyping);
      socketRef.current?.emit('leave_conversation', activeConv.id);
    };
  }, [activeConv, user?.id]);

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.user.id !== user?.id)?.user;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-surface-900 mb-6">Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <Card className="overflow-y-auto lg:col-span-1 p-0">
          {conversations.length === 0 ? (
            <EmptyState title="No conversations" description="Start chatting from a user profile" />
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-surface-50 border-b border-surface-300 ${activeConv?.id === conv.id ? 'bg-primary-500/10' : ''}`}
                >
                  {other && <Avatar name={other.name} src={other.avatar} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{other?.name}</p>
                    {conv.messages?.[0] && (
                      <p className={`text-xs text-surface-700 truncate ${conv.messages[0].deletedAt ? 'italic' : ''}`}>
                        {messagePreview(conv.messages[0], conv.messages[0].senderId === user?.id)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </Card>

        <Card className="lg:col-span-2 flex flex-col p-0 overflow-hidden">
          {activeConv ? (
            <>
              <div className="border-b border-surface-300 p-4">
                <p className="font-medium">{getOtherParticipant(activeConv)?.name}</p>
                {typing && <p className="text-xs text-primary-400">{typing}</p>}
              </div>
              <MessageList
                messages={messages}
                currentUserId={user?.id}
                typingText={typing}
                onEditMessage={startEdit}
                onUnsendMessage={unsend}
              />
              <MessageInput
                key={activeConv.id}
                onSendMessage={(text) => {
                  socketRef.current?.emit('send_message', { conversationId: activeConv.id, text });
                }}
                onSendAttachment={async (file, text, onProgress) => {
                  const msg = await sendAttachment(activeConv.id, file, text, onProgress);
                  setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
                }}
                onTyping={(isTyping) => {
                  socketRef.current?.emit('typing', { conversationId: activeConv.id, isTyping });
                }}
                editingMessage={editing}
                onSubmitEdit={submitEdit}
                onCancelEdit={cancelEdit}
              />
            </>
          ) : (
            <EmptyState title="Select a conversation" description="Choose a chat from the sidebar to start messaging" />
          )}
        </Card>
      </div>
    </div>
  );
}
