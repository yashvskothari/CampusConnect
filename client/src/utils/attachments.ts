/**
 * Attachment rules for chat. Keep this list in sync with
 * server/src/utils/attachments.ts (the server is the real gatekeeper —
 * this file only gives people instant feedback before uploading).
 *
 * Only images and documents are allowed. No audio, video, archives or code.
 */

export const MAX_ATTACHMENT_MB = 10;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

export const IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.jfif', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.avif', '.heic', '.heif', '.ico',
];

export const DOCUMENT_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp', '.rtf', '.md', '.txt', '.csv',
];

export const ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS];

/** Value for <input type="file" accept="..."> */
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(',');

export const getExtension = (name: string) => {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
};

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Only documents (PDF, DOCX, MD, …) and images (PNG, JPG, …) can be attached. Audio, video and other files are not allowed.';
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

export const isImageType = (mime?: string | null) => Boolean(mime && mime.startsWith('image/'));
export const isPdfType = (mime?: string | null) => mime === 'application/pdf';
