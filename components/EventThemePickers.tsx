'use client';

import { useEffect, useState } from 'react';
import type { ColorTheme, FontTheme as _FontTheme } from '@/data/themes';
import {
  colorThemes,
  fontFamilyCss,
  fontThemes,
  googleFontsAllPickerStylesheetHref,
} from '@/data/themes';

/** Matches select chevrons (CreateEventForm, SignupForm, etc.): `M19 9l-7 7-7-7` */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

/** Inverse of app down chevron */
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 15l7-7 7 7"
      />
    </svg>
  );
}

// Colors sorted by hue family: greens → blues → purples → pinks → reds → oranges → yellows → neutrals
const COLOR_KEY_ORDER = [
  // Greens
  'default', 'sage', 'forest', 'teal', 'iridescent-teal', 'oregon-green', 'packers-green',
  // Blues
  'sky', 'ucla-blue', 'dodger-blue', 'warriors-blue', 'electric-blue', 'duke-blue',
  'kentucky-blue', 'michigan-blue', 'notre-dame-navy', 'penn-state-navy', 'yankee-navy',
  // Purples
  'lavender', 'indigo', 'violet', 'wisteria', 'lakers-purple', 'plum',
  // Pinks / Magentas
  'fuchsia', 'magenta', 'bubblegum', 'rose',
  // Reds
  'manchester-red', '49ers-red', 'ohio-state-scarlet', 'georgia-red', 'usc-cardinal',
  // Blush / Muted pinks
  'coral', 'blush', 'dusty-rose',
  // Oranges / Ambers
  'clemson-orange', 'texas-orange', 'amber',
  // Yellows
  'michigan-maize', 'oregon-yellow',
  // Neutrals
  'slate',
];

const sortedColorThemes = COLOR_KEY_ORDER
  .map((key) => colorThemes.find((t) => t.key === key))
  .filter((t): t is ColorTheme => t !== undefined);

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-charcoal font-body mb-3">Color theme</p>
      <div className="flex flex-wrap gap-2">
        {sortedColorThemes.map((theme) => (
          <button
            key={theme.key}
            type="button"
            title={theme.name}
            onClick={() => onChange(theme.key)}
            className={`h-8 w-8 shrink-0 rounded-full transition-all ${
              value === theme.key
                ? 'ring-2 ring-offset-2 ring-charcoal scale-110'
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: theme.primary }}
          />
        ))}
      </div>
    </div>
  );
}

export function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-charcoal font-body mb-3">Font</p>
      <div className="flex flex-wrap gap-2">
        {fontThemes.map((font) => (
          <button
            key={font.key}
            type="button"
            onClick={() => onChange(font.key)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
              value === font.key
                ? 'border-sage bg-sage/10 text-charcoal'
                : 'border-charcoal/15 text-charcoal hover:border-charcoal/30'
            }`}
            style={{ fontFamily: fontFamilyCss(font) }}
          >
            {font.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const FONT_PICKER_STYLESHEET_ID = 'signupsmartly-font-picker-google-fonts';

export function CustomizeAppearanceSection({
  colorKey,
  fontKey,
  onColorChange,
  onFontChange,
}: {
  colorKey: string;
  fontKey: string;
  onColorChange: (key: string) => void;
  onFontChange: (key: string) => void;
}) {
  const [loadPickerFonts, setLoadPickerFonts] = useState(false);

  useEffect(() => {
    if (!loadPickerFonts || typeof document === 'undefined') return;

    const ensureHeadLink = (
      id: string,
      rel: string,
      href: string,
      crossOrigin?: 'anonymous'
    ) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = rel;
      link.href = href;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      document.head.appendChild(link);
    };

    ensureHeadLink('signupsmartly-font-picker-preconnect-g', 'preconnect', 'https://fonts.googleapis.com');
    ensureHeadLink(
      'signupsmartly-font-picker-preconnect-gstatic',
      'preconnect',
      'https://fonts.gstatic.com',
      'anonymous'
    );

    if (!document.getElementById(FONT_PICKER_STYLESHEET_ID)) {
      const link = document.createElement('link');
      link.id = FONT_PICKER_STYLESHEET_ID;
      link.rel = 'stylesheet';
      link.href = googleFontsAllPickerStylesheetHref();
      document.head.appendChild(link);
    }
  }, [loadPickerFonts]);

  return (
    <details
      className="group rounded-xl border border-charcoal/10 bg-surface"
      onToggle={(e) => {
        if (e.currentTarget.open) setLoadPickerFonts(true);
      }}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-charcoal font-body list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span>Customize appearance</span>
        <span className="flex items-center gap-1.5 shrink-0 text-muted">
          <span className="text-sm group-open:hidden">Color &amp; font</span>
          <ChevronDownIcon className="shrink-0 group-open:hidden" />
          <ChevronUpIcon className="hidden shrink-0 group-open:block" />
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-6 border-t border-charcoal/10 pt-4">
        <ColorPicker value={colorKey} onChange={onColorChange} />
        <FontPicker value={fontKey} onChange={onFontChange} />
      </div>
    </details>
  );
}
