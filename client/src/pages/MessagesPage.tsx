import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { messageApi } from '../services';
import { useAuth } from '../context/AuthContext';
import type { Conversation, Message } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function MessagesPage() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageApi.getConversations().then(({ data }) => {
      setConversations(data);
      const userId = searchParams.get('user');
      if (userId) {
        messageApi.createConversation(userId).then(({ data: conv }) => {
          setActiveConv(conv);
          setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
        });
      }
    }).catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL || window.location.origin, { auth: { token } });
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (!activeConv || !socketRef.current) return;
    socketRef.current.emit('join_conversation', activeConv.id);

    messageApi.getMessages(activeConv.id).then(({ data }) => setMessages(data));

    const onMessage = (msg: Message) => {
      if (msg.conversationId === activeConv.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) setTyping(isTyping ? 'typing...' : null);
    };

    socketRef.current.on('new_message', onMessage);
    socketRef.current.on('typing', onTyping);

    return () => {
      socketRef.current?.off('new_message', onMessage);
      socketRef.current?.off('typing', onTyping);
      socketRef.current?.emit('leave_conversation', activeConv.id);
    };
  }, [activeConv, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !activeConv || !socketRef.current) return;
    socketRef.current.emit('send_message', { conversationId: activeConv.id, text: text.trim() });
    setText('');
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (activeConv && socketRef.current) {
      socketRef.current.emit('typing', { conversationId: activeConv.id, isTyping: value.length > 0 });
    }
  };

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
                    {conv.messages?.[0] && <p className="text-xs text-surface-700 truncate">{conv.messages[0].text}</p>}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${msg.senderId === user?.id ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-900'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-surface-300 p-4 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-surface-400 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                <button onClick={sendMessage} className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <EmptyState title="Select a conversation" description="Choose a chat from the sidebar to start messaging" />
          )}
        </Card>
      </div>
    </div>
  );
}
