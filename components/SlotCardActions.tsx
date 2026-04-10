'use client';

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

/** Looks like inline text links; still `<button>` for a11y (not `<a href>`). */
const linkControlClass =
  'inline-flex shrink-0 items-center justify-center rounded p-1 text-charcoal/65 underline-offset-2 hover:text-charcoal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline disabled:hover:text-charcoal/65';

const removeLinkClass = `${linkControlClass} hover:text-coral disabled:hover:text-charcoal/65`;

export function SlotCardActions({
  listLength,
  index,
  onMoveUp,
  onMoveDown,
  onRemove,
  removeAriaLabel,
}: {
  listLength: number;
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  removeAriaLabel: string;
}) {
  if (listLength < 2) return null;

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className={linkControlClass}
        disabled={index === 0}
        onClick={onMoveUp}
        aria-label="Move up"
      >
        <ChevronUp size={14} aria-hidden />
      </button>
      <button
        type="button"
        className={linkControlClass}
        disabled={index === listLength - 1}
        onClick={onMoveDown}
        aria-label="Move down"
      >
        <ChevronDown size={14} aria-hidden />
      </button>
      <button
        type="button"
        className={removeLinkClass}
        onClick={onRemove}
        aria-label={removeAriaLabel}
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  );
}
