import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, onTyping, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = () => {
    if (disabled) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 4000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, []);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    const messageText = text.trim();
    stopTyping();
    setText('');
    onSendMessage(messageText);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-surface-300 bg-surface-100 p-3 flex items-center gap-2">
      <input
        type="text"
        value={text}
        disabled={disabled}
        onFocus={() => {
          startTyping();
        }}
        onBlur={() => {
          stopTyping();
        }}
        onChange={(e) => {
          setText(e.target.value);
          startTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 rounded-lg border border-surface-400 bg-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-600 focus:border-primary-500 focus:outline-none"
      />
      <button
        type="button"
        disabled={!text.trim() || disabled}
        onClick={handleSend}
        aria-label="Send message"
        className="brand-gradient text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
