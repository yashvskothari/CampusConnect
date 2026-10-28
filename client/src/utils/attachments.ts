/**
 * Attachment rules for chat. Keep this list in sync with
 * server/src/utils/attachments.ts (the server is the real gatekeeper —
 * this file only gives people instant feedback before uploading).
 */

export const MAX_ATTACHMENT_MB = 10;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

export const IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.jfif', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.avif', '.heic', '.heif', '.ico',
];

export const AUDIO_EXTENSIONS = [
  '.mp3', '.wav', '.ogg', '.m4a', '.aac',
];

export const WORD_EXTENSIONS = ['.docx', '.doc'];
export const PDF_EXTENSIONS = ['.pdf'];
export const MD_EXTENSIONS = ['.md'];

export const DOCUMENT_EXTENSIONS = [
  ...PDF_EXTENSIONS,
  ...WORD_EXTENSIONS,
  ...MD_EXTENSIONS,
  '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp', '.rtf', '.txt', '.csv',
];

export const ALLOWED_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
];

export type AttachmentCategoryKey = 'photos' | 'audio' | 'word' | 'pdf' | 'md';

export interface AttachmentCategoryOption {
  key: AttachmentCategoryKey;
  label: string;
  sublabel: string;
  accept: string;
  extensions: string[];
}

export const ATTACHMENT_CATEGORIES: AttachmentCategoryOption[] = [
  {
    key: 'photos',
    label: 'Photos',
    sublabel: 'PNG, JPG, WEBP, GIF',
    accept: 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif',
    extensions: IMAGE_EXTENSIONS,
  },
  {
    key: 'audio',
    label: 'Audio',
    sublabel: 'MP3, WAV, OGG, M4A',
    accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac',
    extensions: AUDIO_EXTENSIONS,
  },
  {
    key: 'word',
    label: 'Word',
    sublabel: 'DOCX, DOC files',
    accept: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
    extensions: WORD_EXTENSIONS,
  },
  {
    key: 'pdf',
    label: 'PDF',
    sublabel: 'PDF documents',
    accept: '.pdf,application/pdf',
    extensions: PDF_EXTENSIONS,
  },
  {
    key: 'md',
    label: 'MD Files',
    sublabel: 'Markdown documents',
    accept: '.md,text/markdown',
    extensions: MD_EXTENSIONS,
  },
];

/** Default accept string */
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(',');

export const getExtension = (name: string) => {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
};

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: File, expectedCategory?: AttachmentCategoryKey): string | null {
  const ext = getExtension(file.name);
  if (expectedCategory) {
    const cat = ATTACHMENT_CATEGORIES.find((c) => c.key === expectedCategory);
    if (cat && !cat.extensions.includes(ext)) {
      return `Please select a valid ${cat.label} file (${cat.sublabel}).`;
    }
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Only photos, audio, Word, PDF, and Markdown files are supported.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_ATTACHMENT_BYTES) return `File is too large. The maximum size is ${MAX_ATTACHMENT_MB} MB.`;
  return null;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const isImageType = (mime?: string | null, filename?: string) => {
  if (mime && mime.startsWith('image/')) return true;
  if (filename) return IMAGE_EXTENSIONS.includes(getExtension(filename));
  return false;
};

export const isAudioType = (mime?: string | null, filename?: string) => {
  if (mime && mime.startsWith('audio/')) return true;
  if (filename) return AUDIO_EXTENSIONS.includes(getExtension(filename));
  return false;
};

export const isPdfType = (mime?: string | null, filename?: string) => {
  if (mime === 'application/pdf') return true;
  if (filename) return getExtension(filename) === '.pdf';
  return false;
};

export const isWordType = (mime?: string | null, filename?: string) => {
  if (filename) return WORD_EXTENSIONS.includes(getExtension(filename));
  return (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  );
};

export const isMdType = (mime?: string | null, filename?: string) => {
  if (filename) return getExtension(filename) === '.md';
  return mime === 'text/markdown';
};

