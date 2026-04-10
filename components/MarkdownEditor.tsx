'use client';

import { useRef, useState } from 'react';
import { MarkdownBody } from '@/components/MarkdownBody';

type Mode = 'write' | 'preview';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

const toolbarBtnClass =
  'rounded border border-charcoal/15 bg-surface px-2 py-1 text-xs font-medium text-charcoal font-body hover:bg-charcoal/5';

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<Mode>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyChange = (next: string) => {
    if (maxLength !== undefined && next.length > maxLength) {
      onChange(next.slice(0, maxLength));
    } else {
      onChange(next);
    }
  };

  const insertAtSelection = (before: string, after: string, fallbackMiddle: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const middle = selected || fallbackMiddle;
    const next = value.slice(0, start) + before + middle + after + value.slice(end);
    applyChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + before.length + middle.length + after.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  const handleBold = () => insertAtSelection('**', '**', 'bold');
  const handleItalic = () => insertAtSelection('*', '*', 'italic');

  const handleLink = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    if (selected) {
      const url = typeof window !== 'undefined' ? window.prompt('URL:') : null;
      if (url === null || url === '') return;
      const insert = `[${selected}](${url})`;
      const next = value.slice(0, start) + insert + value.slice(end);
      applyChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const c = start + insert.length;
        ta.setSelectionRange(c, c);
      });
    } else {
      const insert = '[link text](url)';
      const next = value.slice(0, start) + insert + value.slice(end);
      applyChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const c = start + insert.length;
        ta.setSelectionRange(c, c);
      });
    }
  };

  // Shared floor for Write vs Preview so toggling modes does not jump (all uses: event + spots/items).
  const bodyMinHeight =
    maxLength !== undefined
      ? `calc(${rows} * 1.5rem + 1.25rem + 1.75rem)`
      : `calc(${rows} * 1.5rem + 1.25rem)`;
  const nearLimit =
    maxLength !== undefined && value.length >= maxLength - 50;

  const counter =
    maxLength !== undefined ? (
      <span
        className={`pointer-events-none absolute bottom-2 right-2 text-xs font-body tabular-nums select-none ${
          nearLimit ? 'text-coral' : 'text-muted'
        }`}
        aria-live="polite"
      >
        {value.length} / {maxLength}
      </span>
    ) : null;

  const tabBtn = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`flex items-center py-3 text-sm font-body transition-colors border-b-2 -mb-px ${
        mode === m
          ? 'font-semibold text-charcoal border-sage'
          : 'border-transparent font-normal text-muted hover:text-charcoal'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border border-charcoal/20 bg-surface font-body">
      <div
        className="flex gap-8 border-b border-charcoal/10 px-3"
        role="tablist"
        aria-label="Editor mode"
      >
        {tabBtn('write', 'Write')}
        {tabBtn('preview', 'Preview')}
      </div>

      {/* Toolbar always occupies space so switching Write/Preview does not jump */}
      <div
        className={`flex flex-wrap gap-1 px-3 pt-2 ${
          mode === 'preview' ? 'pointer-events-none invisible' : ''
        }`}
        aria-hidden={mode === 'preview'}
      >
        <button type="button" onClick={handleBold} className={toolbarBtnClass} tabIndex={mode === 'preview' ? -1 : 0}>
          B
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className={`${toolbarBtnClass} italic`}
          tabIndex={mode === 'preview' ? -1 : 0}
        >
          I
        </button>
        <button type="button" onClick={handleLink} className={toolbarBtnClass} tabIndex={mode === 'preview' ? -1 : 0}>
          Link
        </button>
      </div>

      {mode === 'write' ? (
        <div className="relative px-3 pb-3 pt-1" style={{ minHeight: bodyMinHeight }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => applyChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            className={`w-full resize-none border-0 bg-transparent py-2 text-sm text-charcoal placeholder:text-muted/70 focus:outline-none focus:ring-0 font-body ${
              maxLength !== undefined ? 'pb-7 pr-14' : ''
            }`}
          />
          {counter}
        </div>
      ) : (
        <div
          className={`relative min-h-0 overflow-auto px-3 pt-1 text-sm ${
            maxLength !== undefined ? 'pb-10' : 'pb-3'
          }`}
          style={{ minHeight: bodyMinHeight }}
        >
          {value.trim() ? (
            <MarkdownBody
              markdown={value}
              className="prose prose-sm max-w-none text-charcoal prose-p:text-muted prose-li:text-muted prose-headings:text-charcoal prose-strong:text-charcoal"
            />
          ) : (
            <p className="text-sm text-muted font-body">Nothing to preview</p>
          )}
          {counter}
        </div>
      )}
    </div>
  );
}
