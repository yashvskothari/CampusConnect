import { useEffect, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  ImageOff,
  Headphones,
  FileDown,
  FileCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messageApi } from '../../services';
import {
  formatFileSize,
  isImageType,
  isAudioType,
  isPdfType,
  isWordType,
  isMdType,
  getExtension,
} from '../../utils/attachments';
import type { Message } from '../../types';

interface MessageAttachmentProps {
  message: Message;
  isMe: boolean;
}

/**
 * Attachments are private, so <img src> / <audio src> can't be accessed without an auth header.
 * Files are fetched as blobs via messageApi.getAttachment(message.id).
 */
export default function MessageAttachment({ message, isMe }: MessageAttachmentProps) {
  const name = message.fileName || 'Attachment';
  const isImage = isImageType(message.fileType, message.fileName || undefined);
  const isAudio = isAudioType(message.fileType, message.fileName || undefined);
  const isPdf = isPdfType(message.fileType, message.fileName || undefined);
  const isWord = isWordType(message.fileType, message.fileName || undefined);
  const isMd = isMdType(message.fileType, message.fileName || undefined);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load image previews
  useEffect(() => {
    if (!isImage) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setImageFailed(false);
    messageApi
      .getAttachment(message.id)
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setImageUrl(objectUrl);
      })
      .catch(() => !cancelled && setImageFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [message.id, isImage]);

  // Load audio preview for inline player
  useEffect(() => {
    if (!isAudio) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setAudioFailed(false);
    messageApi
      .getAttachment(message.id)
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setAudioUrl(objectUrl);
      })
      .catch(() => !cancelled && setAudioFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [message.id, isAudio]);

  const saveBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const download = async () => {
    setBusy(true);
    try {
      const { data } = await messageApi.getAttachment(message.id);
      saveBlob(data);
    } catch {
      toast.error('Could not download this file. It may have been removed.');
    } finally {
      setBusy(false);
    }
  };

  // Open the tab first inside the click event so popup blockers allow it
  const openFileInTab = async () => {
    const tab = window.open('', '_blank');
    setBusy(true);
    try {
      const { data } = await messageApi.getAttachment(message.id);
      const url = URL.createObjectURL(data);
      if (tab) tab.location.href = url;
      else saveBlob(data);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab?.close();
      toast.error('Could not open this file. It may have been removed.');
    } finally {
      setBusy(false);
    }
  };

  const btn =
    'rounded-md p-1.5 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-50 ' +
    (isMe ? 'hover:bg-white/20' : 'hover:bg-surface-300');

  // 1. Photos
  if (isImage && !imageFailed) {
    return (
      <div className="mt-1.5">
        {imageUrl ? (
          <button
            type="button"
            onClick={() => window.open(imageUrl, '_blank')}
            title="Open full size"
            className="block cursor-zoom-in"
          >
            <img src={imageUrl} alt={name} className="max-h-56 max-w-full rounded-lg object-cover" />
          </button>
        ) : (
          <div className="h-32 w-48 animate-pulse rounded-lg bg-black/15" />
        )}
        <div className="mt-1 flex items-center gap-1 text-[11px] opacity-80">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <button type="button" onClick={download} disabled={busy} aria-label={`Download ${name}`} className={btn}>
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Audio
  if (isAudio && !audioFailed) {
    return (
      <div className={`mt-1.5 min-w-[230px] max-w-sm rounded-xl p-2.5 ${isMe ? 'bg-black/20' : 'bg-surface-300/70'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Headphones className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-medium" title={name}>
                {name}
              </p>
              <span className="shrink-0 rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-semibold uppercase text-amber-400">
                Audio
              </span>
            </div>
            <p className="text-[10px] opacity-70">{formatFileSize(message.fileSize)}</p>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={busy}
            aria-label={`Download ${name}`}
            title="Download audio"
            className={btn}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
        {audioUrl ? (
          <audio controls src={audioUrl} className="h-8 w-full rounded" preload="metadata" />
        ) : (
          <div className="h-8 w-full animate-pulse rounded bg-black/15" />
        )}
      </div>
    );
  }

  // 3. Document badge details (Word, PDF, MD, or fallback)
  const getDocDetails = () => {
    if (isWord) {
      return {
        Icon: FileText,
        badge: getExtension(name).replace('.', '').toUpperCase() || 'WORD',
        colorClass: 'bg-sky-500/20 text-sky-400',
        badgeClass: 'bg-sky-500/20 text-sky-400',
      };
    }
    if (isPdf) {
      return {
        Icon: FileDown,
        badge: 'PDF',
        colorClass: 'bg-rose-500/20 text-rose-400',
        badgeClass: 'bg-rose-500/20 text-rose-400',
      };
    }
    if (isMd) {
      return {
        Icon: FileCode,
        badge: 'MD',
        colorClass: 'bg-emerald-500/20 text-emerald-400',
        badgeClass: 'bg-emerald-500/20 text-emerald-400',
      };
    }
    return {
      Icon: isImage ? ImageOff : FileText,
      badge: getExtension(name).replace('.', '').toUpperCase() || 'FILE',
      colorClass: 'bg-primary-500/20 text-primary-400',
      badgeClass: 'bg-primary-500/20 text-primary-400',
    };
  };

  const doc = getDocDetails();
  const DocIcon = doc.Icon;

  return (
    <div className={`mt-1.5 flex items-center gap-2.5 rounded-xl p-2.5 ${isMe ? 'bg-black/15' : 'bg-surface-300/70'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${doc.colorClass}`}>
        <DocIcon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium" title={name}>
            {name}
          </p>
          <span className={`shrink-0 rounded px-1 py-0.2 text-[9px] font-semibold uppercase ${doc.badgeClass}`}>
            {doc.badge}
          </span>
        </div>
        <p className="text-[10px] opacity-70">{formatFileSize(message.fileSize)}</p>
      </div>
      {isPdf && (
        <button type="button" onClick={openFileInTab} disabled={busy} aria-label={`Open ${name}`} title="Open PDF" className={btn}>
          <ExternalLink className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={download} disabled={busy} aria-label={`Download ${name}`} title="Download" className={btn}>
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
