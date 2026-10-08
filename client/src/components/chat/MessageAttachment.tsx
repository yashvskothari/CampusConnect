import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { messageApi } from '../../services';
import { formatFileSize, isImageType, isPdfType } from '../../utils/attachments';
import type { Message } from '../../types';

interface MessageAttachmentProps {
  message: Message;
  isMe: boolean;
}

/**
 * Attachments are private, so <img src> / <a href> can't be used directly
 * (they don't send the auth token). Files are fetched as blobs instead.
 */
export default function MessageAttachment({ message, isMe }: MessageAttachmentProps) {
  const name = message.fileName || 'Attachment';
  const isImage = isImageType(message.fileType);
  const isPdf = isPdfType(message.fileType);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load image previews (HEIC/TIFF/etc. that browsers can't draw fall back to the file card)
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

  // Open the tab first (inside the click) so popup blockers allow it, then point it at the PDF
  const openPdf = async () => {
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

  return (
    <div className={`mt-1.5 flex items-center gap-2.5 rounded-xl p-2.5 ${isMe ? 'bg-black/15' : 'bg-surface-300/70'}`}>
      {isImage ? <ImageOff className="h-8 w-8 shrink-0 opacity-80" /> : <FileText className="h-8 w-8 shrink-0 opacity-80" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium" title={name}>
          {name}
        </p>
        <p className="text-[10px] opacity-70">{formatFileSize(message.fileSize)}</p>
      </div>
      {isPdf && (
        <button type="button" onClick={openPdf} disabled={busy} aria-label={`Open ${name}`} title="Open" className={btn}>
          <ExternalLink className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={download} disabled={busy} aria-label={`Download ${name}`} title="Download" className={btn}>
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
