'use client';

import type { ColorTheme, FontTheme } from '@/data/themes';
import { colorThemes, fontFamilyCss, fontThemes } from '@/data/themes';

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const categories: Array<{ key: ColorTheme['category']; label: string }> = [
    { key: 'general', label: 'General' },
    { key: 'unicorn', label: 'Unicorn & Whimsical' },
    { key: 'school', label: 'School & University' },
    { key: 'sports', label: 'Sports Teams' },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-charcoal font-body mb-3">Color theme</p>
      {categories.map(({ key, label }) => (
        <div key={key} className="mb-4">
          <p className="text-xs text-muted font-body mb-2">{label}</p>
          <div className="flex flex-wrap gap-2">
            {colorThemes
              .filter((t) => t.category === key)
              .map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  title={theme.name}
                  onClick={() => onChange(theme.key)}
                  className={`relative h-8 w-8 shrink-0 rounded-full transition-all ${
                    value === theme.key
                      ? 'ring-2 ring-offset-2 ring-charcoal scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: theme.primary }}
                >
                  {theme.key === 'default' ? (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm"
                      aria-hidden
                    >
                      ★
                    </span>
                  ) : null}
                </button>
              ))}
          </div>
        </div>
      ))}
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
  const categories: Array<{ key: FontTheme['category']; label: string }> = [
    { key: 'sans-serif', label: 'Sans-serif' },
    { key: 'serif', label: 'Serif' },
    { key: 'script', label: 'Script & Handwritten' },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-charcoal font-body mb-3">Font</p>
      {categories.map(({ key, label }) => (
        <div key={key} className="mb-4">
          <p className="text-xs text-muted font-body mb-2">{label}</p>
          <div className="flex flex-wrap gap-2">
            {fontThemes
              .filter((f) => f.category === key)
              .map((font) => (
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
      ))}
      <p className="text-xs text-muted font-body mt-2">
        Script fonts apply to headings only — body text stays readable for all volunteers.
      </p>
    </div>
  );
}

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
  return (
    <details className="group rounded-xl border border-charcoal/10 bg-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-charcoal font-body list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span>Customize appearance</span>
        <span className="text-muted text-xs shrink-0">
          <span className="group-open:hidden">Color &amp; font</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-6 border-t border-charcoal/10 pt-4">
        <ColorPicker value={colorKey} onChange={onColorChange} />
        <FontPicker value={fontKey} onChange={onFontChange} />
      </div>
    </details>
  );
}
