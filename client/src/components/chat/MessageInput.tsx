import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { Send, Smile, Check, X, Pencil, Paperclip, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import EmojiPicker from './EmojiPicker';
import { ACCEPT_ATTR, formatFileSize, validateFile } from '../../utils/attachments';
import type { Message } from '../../types';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  /** Uploads a file (with optional caption). Should throw on failure so the draft is kept. */
  onSendAttachment?: (file: File, text: string, onProgress: (percent: number) => void) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  /** When set, the input switches to "edit mode" for this message. */
  editingMessage?: Message | null;
  onSubmitEdit?: (messageId: string, text: string) => void;
  onCancelEdit?: () => void;
}

export default function MessageInput({
  onSendMessage,
  onSendAttachment,
  onTyping,
  disabled,
  editingMessage,
  onSubmitEdit,
  onCancelEdit,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const isEditing = Boolean(editingMessage);

  const startTyping = () => {
    if (disabled || isEditing) return;
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

  // Entering / leaving edit mode: load the message text, or restore an empty box
  useEffect(() => {
    if (editingMessage) {
      stopTyping();
      setText(editingMessage.text);
      setShowEmoji(false);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      });
    } else {
      setText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingMessage?.id]);

  const handleFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again later
    if (!file) return;
    const problem = validateFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setPendingFile(file);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const canSend = (Boolean(text.trim()) || Boolean(pendingFile)) && !disabled && !uploading;

  const handleSend = async () => {
    if (!canSend) return;
    const value = text.trim();

    if (pendingFile && !editingMessage) {
      if (!onSendAttachment) return;
      stopTyping();
      setUploading(true);
      setProgress(0);
      try {
        await onSendAttachment(pendingFile, value, setProgress);
        setPendingFile(null);
        setText('');
        setShowEmoji(false);
      } catch {
        // parent already showed the error; keep the file and caption so they can retry
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!value) return;
    if (editingMessage) {
      if (value !== editingMessage.text) onSubmitEdit?.(editingMessage.id, value);
      else onCancelEdit?.();
      return;
    }
    stopTyping();
    setText('');
    setShowEmoji(false);
    onSendMessage(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && isEditing) {
      onCancelEdit?.();
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    startTyping();
    // restore the caret right after the inserted emoji
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="relative border-t border-surface-300 bg-surface-100">
      {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}

      {isEditing && (
        <div className="flex items-center gap-2 border-b border-surface-300 bg-surface-200/60 px-3 py-1.5 text-xs text-surface-800">
          <Pencil className="h-3.5 w-3.5 text-primary-400" />
          <span className="flex-1 truncate">
            Editing message: <span className="text-surface-700">{editingMessage?.text}</span>
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            aria-label="Cancel editing"
            className="rounded p-0.5 text-surface-700 hover:bg-surface-300 hover:text-surface-900 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {pendingFile && !isEditing && (
        <div className="border-b border-surface-300 bg-surface-200/60 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-surface-800">
            <FileText className="h-4 w-4 shrink-0 text-primary-400" />
            <span className="min-w-0 flex-1 truncate" title={pendingFile.name}>
              {pendingFile.name}
            </span>
            <span className="shrink-0 text-surface-600">{formatFileSize(pendingFile.size)}</span>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              disabled={uploading}
              aria-label="Remove attachment"
              className="rounded p-0.5 text-surface-700 hover:bg-surface-300 hover:text-surface-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {uploading && (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-300">
              <div className="h-full brand-gradient transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleFileChosen}
        />
        {onSendAttachment && (
          <button
            type="button"
            disabled={disabled || isEditing || uploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a file"
            title="Attach a document or image"
            className="rounded-lg p-2 text-surface-700 transition-colors hover:bg-surface-200 hover:text-surface-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          data-emoji-toggle
          disabled={disabled}
          onClick={() => setShowEmoji((v) => !v)}
          aria-label="Add emoji"
          aria-expanded={showEmoji}
          className={`rounded-lg p-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
            showEmoji ? 'bg-surface-300 text-primary-400' : 'text-surface-700 hover:bg-surface-200 hover:text-surface-900'
          }`}
        >
          <Smile className="h-5 w-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled || uploading}
          maxLength={2000}
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
          placeholder={isEditing ? 'Edit your message...' : pendingFile ? 'Add a caption (optional)...' : 'Type a message...'}
          className="flex-1 min-w-0 rounded-lg border border-surface-400 bg-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-600 focus:border-primary-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          aria-label={isEditing ? 'Save edited message' : 'Send message'}
          className="brand-gradient text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
