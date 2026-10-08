export const EDIT_WINDOW_MS = 15 * 60 * 1000;

export const canEditMessage = (createdAt: string, now = Date.now()) =>
  now - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;

/** True when the text is 1-3 emojis and nothing else (rendered large, WhatsApp style). */
export function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 24) return false;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const parts = Array.from(segmenter.segment(t), (s) => s.segment).filter((g) => g.trim() !== '');
  return (
    parts.length > 0 &&
    parts.length <= 3 &&
    parts.every((g) => /\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}]|^[0-9#*]\uFE0F?\u20E3$/u.test(g))
  );
}

/** Short text for conversation list previews. */
export function messagePreview(msg: { text: string; deletedAt?: string | null; fileUrl?: string | null; fileName?: string | null }, mine: boolean) {
  if (msg.deletedAt) return mine ? 'You unsent a message' : 'This message was unsent';
  if (!msg.text && msg.fileUrl) return `📎 ${msg.fileName || 'Attachment'}`;
  return msg.text;
}
