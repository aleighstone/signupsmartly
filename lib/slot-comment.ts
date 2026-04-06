/** Default volunteer comment field label when organizer leaves custom label blank. */
export const DEFAULT_COMMENT_LABEL = 'Comment';

/** Trim, cap length, fall back to default — use on write (API) and when comparing. */
export function normalizeCommentLabel(raw: string | null | undefined): string {
  const t = (raw ?? '').trim().slice(0, 60);
  return t.length > 0 ? t : DEFAULT_COMMENT_LABEL;
}

export function formatCommentForExport(
  commentLabel: string | null | undefined,
  comment: string | null | undefined
): string {
  const text = (comment ?? '').trim();
  if (!text) return '';
  const label = normalizeCommentLabel(commentLabel);
  if (label === DEFAULT_COMMENT_LABEL) return text;
  return `${label}: ${text}`;
}
