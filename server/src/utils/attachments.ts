import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

/**
 * Attachment policy for chat messages.
 *
 * Only images and documents are accepted. Audio, video, archives, scripts,
 * executables, HTML and SVG (which can carry scripts) are all rejected.
 *
 * To allow another format, add ONE line to ALLOWED_TYPES below.
 */

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

type Check = (buf: Buffer) => boolean;

const startsWith =
  (...sigs: number[][]): Check =>
  (buf) =>
    sigs.some((sig) => buf.length >= sig.length && sig.every((b, i) => buf[i] === b));

const ascii = (buf: Buffer, start: number, end: number) => buf.subarray(start, end).toString('latin1');

const isZip = startsWith([0x50, 0x4b, 0x03, 0x04]);
const isOle = startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // legacy .doc/.xls/.ppt

/** OOXML (docx/xlsx/pptx) are zips that always contain [Content_Types].xml */
const isOoxml: Check = (buf) => isZip(buf) && buf.includes('[Content_Types].xml');

/** OpenDocument (odt/ods/odp) are zips whose "mimetype" entry names the format */
const isOpenDocument: Check = (buf) => isZip(buf) && buf.includes('application/vnd.oasis.opendocument');

/** Plain text formats must not contain NUL bytes (a sign of a disguised binary). */
const isPlainText: Check = (buf) => !buf.subarray(0, 8192).includes(0);

const isIsoBmff =
  (...brands: string[]): Check =>
  (buf) =>
    buf.length >= 12 && ascii(buf, 4, 8) === 'ftyp' && brands.includes(ascii(buf, 8, 12));

interface AllowedType {
  mime: string;
  kind: 'image' | 'document';
  check: Check;
}

export const ALLOWED_TYPES: Record<string, AllowedType> = {
  // ---- Images ----
  '.png': { mime: 'image/png', kind: 'image', check: startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  '.jpg': { mime: 'image/jpeg', kind: 'image', check: startsWith([0xff, 0xd8, 0xff]) },
  '.jpeg': { mime: 'image/jpeg', kind: 'image', check: startsWith([0xff, 0xd8, 0xff]) },
  '.jfif': { mime: 'image/jpeg', kind: 'image', check: startsWith([0xff, 0xd8, 0xff]) },
  '.gif': { mime: 'image/gif', kind: 'image', check: startsWith([0x47, 0x49, 0x46, 0x38]) },
  '.webp': {
    mime: 'image/webp',
    kind: 'image',
    check: (buf) => buf.length >= 12 && ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP',
  },
  '.bmp': { mime: 'image/bmp', kind: 'image', check: startsWith([0x42, 0x4d]) },
  '.tif': { mime: 'image/tiff', kind: 'image', check: startsWith([0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]) },
  '.tiff': { mime: 'image/tiff', kind: 'image', check: startsWith([0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]) },
  '.avif': { mime: 'image/avif', kind: 'image', check: isIsoBmff('avif', 'avis') },
  '.heic': { mime: 'image/heic', kind: 'image', check: isIsoBmff('heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1') },
  '.heif': { mime: 'image/heif', kind: 'image', check: isIsoBmff('heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1') },
  '.ico': { mime: 'image/x-icon', kind: 'image', check: startsWith([0x00, 0x00, 0x01, 0x00]) },

  // ---- Documents ----
  '.pdf': { mime: 'application/pdf', kind: 'document', check: (buf) => buf.subarray(0, 1024).includes('%PDF-') },
  '.docx': {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    kind: 'document',
    check: isOoxml,
  },
  '.doc': { mime: 'application/msword', kind: 'document', check: isOle },
  '.xlsx': {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    kind: 'document',
    check: isOoxml,
  },
  '.xls': { mime: 'application/vnd.ms-excel', kind: 'document', check: isOle },
  '.pptx': {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    kind: 'document',
    check: isOoxml,
  },
  '.ppt': { mime: 'application/vnd.ms-powerpoint', kind: 'document', check: isOle },
  '.odt': { mime: 'application/vnd.oasis.opendocument.text', kind: 'document', check: isOpenDocument },
  '.ods': { mime: 'application/vnd.oasis.opendocument.spreadsheet', kind: 'document', check: isOpenDocument },
  '.odp': { mime: 'application/vnd.oasis.opendocument.presentation', kind: 'document', check: isOpenDocument },
  '.rtf': { mime: 'application/rtf', kind: 'document', check: (buf) => ascii(buf, 0, 5) === '{\\rtf' },
  '.md': { mime: 'text/markdown', kind: 'document', check: isPlainText },
  '.txt': { mime: 'text/plain', kind: 'document', check: isPlainText },
  '.csv': { mime: 'text/csv', kind: 'document', check: isPlainText },
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);

export const getExtension = (filename: string) => path.extname(filename || '').toLowerCase();

export const isAllowedExtension = (filename: string) => getExtension(filename) in ALLOWED_TYPES;

/**
 * Validates an uploaded file. The extension must be whitelisted AND the actual
 * bytes must match that format, so a renamed .exe / .mp4 / .zip is rejected.
 * Returns the trusted MIME type, or an error message.
 */
export function validateAttachment(
  originalName: string,
  buffer: Buffer
): { ok: true; mime: string; ext: string } | { ok: false; error: string } {
  const ext = getExtension(originalName);
  const rule = ALLOWED_TYPES[ext];
  if (!rule) {
    return {
      ok: false,
      error: 'This file type is not allowed. Only documents (PDF, DOCX, MD, …) and images (PNG, JPG, …) can be attached.',
    };
  }
  if (buffer.length === 0) return { ok: false, error: 'The file is empty.' };
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: `File is too large. The maximum size is ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.` };
  }
  if (!rule.check(buffer)) {
    return { ok: false, error: `The file content does not match its ${ext} extension.` };
  }
  return { ok: true, mime: rule.mime, ext };
}

/** Clean up the name shown in the UI (never used as a path on disk). */
export function sanitizeDisplayName(raw: string): string {
  // multer hands us the name decoded as latin1; recover UTF-8 names (e.g. "रिपोर्ट.pdf")
  let name = raw;
  try {
    name = Buffer.from(raw, 'latin1').toString('utf8');
    if (name.includes('\uFFFD')) name = raw;
  } catch {
    name = raw;
  }
  name = path.basename(name.replace(/\\/g, '/'));
  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '').trim();
  if (name.length > 120) {
    const ext = path.extname(name);
    name = name.slice(0, 120 - ext.length) + ext;
  }
  return name || 'attachment';
}

/**
 * Attachments live OUTSIDE the public /uploads folder and are only served
 * through an authenticated route. On Render, point ATTACHMENT_DIR at a
 * persistent disk, otherwise files are lost on every redeploy.
 */
export const ATTACHMENT_DIR = process.env.ATTACHMENT_DIR || path.join(process.cwd(), 'storage', 'attachments');

export function ensureAttachmentDir() {
  if (!fs.existsSync(ATTACHMENT_DIR)) fs.mkdirSync(ATTACHMENT_DIR, { recursive: true });
}

/** Writes the file under a random name and returns the storage key. */
export async function saveAttachment(buffer: Buffer, ext: string): Promise<string> {
  ensureAttachmentDir();
  const key = `${randomUUID()}${ext}`;
  await fs.promises.writeFile(path.join(ATTACHMENT_DIR, key), buffer, { flag: 'wx' });
  return key;
}

/** Resolves a storage key to a path, refusing anything that escapes ATTACHMENT_DIR. */
export function attachmentPath(key: string): string | null {
  const safe = path.basename(key);
  if (safe !== key) return null;
  return path.join(ATTACHMENT_DIR, safe);
}

export async function deleteAttachment(key?: string | null) {
  if (!key) return;
  const p = attachmentPath(key);
  if (!p) return;
  try {
    await fs.promises.unlink(p);
  } catch {
    // already gone — nothing to do
  }
}
