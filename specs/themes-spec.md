# Spec: Signup Page Themes (Colors + Fonts)

## Overview

Organizers can choose a color theme and a heading font for their signup page.
The theme applies to the public volunteer-facing signup page only — the
organizer dashboard is unaffected.

Themes are curated, not free-form. Organizers choose from a pre-defined set of
42 color themes and 21 Google Fonts. All color/text contrast combinations are
pre-validated to meet WCAG AA (4.5:1 minimum ratio).

Reference sheet: `/public/marketing-content/color-themes-reference.png`

---

## Design decisions

- **Curated palette only** — no free-form color picker. Prevents illegible
  low-contrast combinations and reduces UI complexity.
- **Font applies to headings only** — body text stays as Inter for readability
  regardless of theme. The heading font gives personality without sacrificing
  legibility.
- **Default theme** — `Default ★` uses Sage (#4A7C59) + Quicksand. Existing
  events without a theme render in this default state.
- **Stored as JSON** — a single `theme` JSONB column on the events table keeps
  this flexible without new columns for every future theme property.
- **No extra infrastructure** — Google Fonts loads via a URL in the signup page
  `<head>`. In organizer forms, picker fonts lazy-load when "Customize
  appearance" is expanded. Colors apply via CSS variables. No CDN, no image
  storage.

---

## Database changes

```sql
alter table events
  add column theme jsonb default '{"colorKey":"default","fontKey":"quicksand"}'::jsonb;
```

Run a backfill to set the default theme on all existing events:

```sql
update events
set theme = '{"colorKey":"default","fontKey":"quicksand"}'::jsonb
where theme is null;
```

Schema of the `theme` object:

```ts
type EventTheme = {
  colorKey: string;  // e.g. "michigan-blue", "fuchsia", "sage", "default"
  fontKey:  string;  // e.g. "nunito", "playfair-display", "dancing-script"
};
```

### The "Default" theme

Add a first entry to `colorThemes` in `data/themes.ts` representing the
default/no-theme state:

```ts
{ key: 'default', name: 'Default', category: 'general', primary: '#4A7C59', btnText: '#FFFFFF' },
```

The Default entry renders identically to Sage — it IS Sage — but is stored
separately so that:
1. Existing events that haven't been touched by an organizer are recognisably
   in the "Default" state, not a named theme the organizer chose
2. If the brand color ever changes, Default can be updated independently of
   the named "Sage" theme

In the theme picker UI, "Default" renders as the first swatch with a small
star or checkmark icon to indicate it's the current brand default. Label it
"Default ★" in the General group.

---

## Files to create / modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `data/themes.ts` | Color palette + font list data |
| Modify | `app/create-event/CreateEventForm.tsx` | Theme picker in create flow |
| Modify | `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Theme picker in edit flow |
| Modify | `app/api/events/route.ts` (POST) | Accept + store theme |
| Modify | `app/api/events/[id]/route.ts` (PATCH) | Accept + store theme |
| Modify | `app/event/[id]/page.tsx` | Apply theme to signup page |
| Modify | `app/signup/confirm/page.tsx` | Apply theme on confirmation page |

---

## 1. Data file: `data/themes.ts`

```ts
export type ColorTheme = {
  key: string;
  name: string;
  category: 'school' | 'sports' | 'general' | 'unicorn';
  primary: string; // button background hex
  btnText: string; // button text hex — pre-validated for 4.5:1 contrast
};

export type FontTheme = {
  key: string;
  name: string;
  family: string; // exact Google Fonts family name
  category: 'sans-serif' | 'serif' | 'script';
  weights: string; // for Google Fonts URL, e.g. "400;600;700"
};
// Exactly 42 curated colors and 21 curated fonts.
// Source of truth: `colorThemes` and `fontThemes` exports in this file.
// Example entries:
export const colorThemes: ColorTheme[] = [
  { key: 'default', name: 'Default ★', category: 'general', primary: '#4A7C59', btnText: '#FFFFFF' },
  { key: 'michigan-blue', name: 'Michigan Blue', category: 'school', primary: '#00274C', btnText: '#FFFFFF' },
  { key: 'dodger-blue', name: 'Dodger Blue', category: 'sports', primary: '#005A9C', btnText: '#FFFFFF' },
  { key: 'fuchsia', name: 'Fuchsia', category: 'unicorn', primary: '#A21CAF', btnText: '#FFFFFF' },
  // ...see full list in `data/themes.ts`
];

export const fontThemes: FontTheme[] = [
  { key: 'quicksand', name: 'Quicksand', family: 'Quicksand', category: 'sans-serif', weights: '400;600;700' },
  { key: 'playfair-display', name: 'Playfair Display', family: 'Playfair+Display', category: 'serif', weights: '400;600;700' },
  { key: 'dancing-script', name: 'Dancing Script', family: 'Dancing+Script', category: 'script', weights: '400;700' },
  // ...see full list in `data/themes.ts`
];

export const DEFAULT_COLOR_KEY = 'default';
export const DEFAULT_FONT_KEY = 'quicksand';
```

---

## 2. Theme picker UI (create + edit forms)

Add a collapsible "Customize appearance" section at the bottom of both forms,
above the Save/Create button. Collapsed by default so it doesn't distract from
the core event setup flow.

```tsx
<details className="group rounded-xl border border-charcoal/10 bg-surface">
  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-charcoal
                      font-body list-none flex items-center justify-between">
    Customize appearance
    <span className="text-muted text-xs group-open:hidden">Color &amp; font</span>
    <span className="text-muted text-xs hidden group-open:inline">▲</span>
  </summary>

  <div className="px-4 pb-4 space-y-6 border-t border-charcoal/10 pt-4">
    {/* Color picker */}
    <ColorPicker value={colorKey} onChange={setColorKey} />
    {/* Font picker */}
    <FontPicker value={fontKey} onChange={setFontKey} />
  </div>
</details>
```

### `ColorPicker` component

- Groups themes by category with a category label above each group
- Each theme renders as a circular swatch (32×32px) with a tooltip on hover
  showing the theme name
- Selected swatch has a ring: `ring-2 ring-offset-2 ring-charcoal`
- Category order: General → Unicorn → School → Sports
  (most commonly used first)

```tsx
function ColorPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const categories: Array<{ key: ColorTheme['category']; label: string }> = [
    { key: 'general', label: 'General' },
    { key: 'unicorn', label: 'Unicorn & Whimsical' },
    { key: 'school',  label: 'School & University' },
    { key: 'sports',  label: 'Sports Teams' },
  ];
  return (
    <div>
      <p className="text-sm font-medium text-charcoal font-body mb-3">Color theme</p>
      {categories.map(({ key, label }) => (
        <div key={key} className="mb-4">
          <p className="text-xs text-muted font-body mb-2">{label}</p>
          <div className="flex flex-wrap gap-2">
            {colorThemes.filter(t => t.category === key).map(theme => (
              <button
                key={theme.key}
                type="button"
                title={theme.name}
                onClick={() => onChange(theme.key)}
                className={`h-8 w-8 rounded-full transition-all ${
                  value === theme.key
                    ? 'ring-2 ring-offset-2 ring-charcoal scale-110'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: theme.primary }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### `FontPicker` component

- Groups by category: Sans-serif, Serif, Script
- Each option renders in its own font in the picker UI
- Google Fonts for picker preview load lazily (single combined stylesheet for
  all picker fonts) when "Customize appearance" is opened
- Section header chevrons match the app's select chevron style
- Selected option uses highlighted border/background treatment
- Small disclaimer below script fonts: "Script fonts apply to headings only"

```tsx
function FontPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const categories: Array<{ key: FontTheme['category']; label: string }> = [
    { key: 'sans-serif', label: 'Sans-serif' },
    { key: 'serif',      label: 'Serif' },
    { key: 'script',     label: 'Script & Handwritten' },
  ];
  return (
    <div>
      <p className="text-sm font-medium text-charcoal font-body mb-3">Font</p>
      {categories.map(({ key, label }) => (
        <div key={key} className="mb-4">
          <p className="text-xs text-muted font-body mb-2">{label}</p>
          <div className="flex flex-wrap gap-2">
            {fontThemes.filter(f => f.category === key).map(font => (
              <button
                key={font.key}
                type="button"
                onClick={() => onChange(font.key)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  value === font.key
                    ? 'border-sage bg-sage/10 text-charcoal'
                    : 'border-charcoal/15 text-charcoal hover:border-charcoal/30'
                }`}
                style={{ fontFamily: `'${font.family.replace(/\+/g,' ')}', sans-serif` }}
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
```

---

## 3. API schema changes

### POST `/api/events` and PATCH `/api/events/[id]`

Add to the event schema in both route handlers:

```ts
theme: z.object({
  colorKey: z.string().optional(),
  fontKey:  z.string().optional(),
}).optional().nullable(),
```

Pass `theme` through to the Supabase upsert unchanged.

---

## 4. Applying the theme to volunteer-facing pages

In `app/event/[id]/page.tsx` (server component), read the event's `theme`
field and inject CSS variables + Google Fonts into the page:

### Font loading

```tsx
import { fontThemes, DEFAULT_FONT_KEY } from '@/data/themes';

const fontKey   = event.theme?.fontKey ?? DEFAULT_FONT_KEY;
const fontTheme = fontThemes.find(f => f.key === fontKey) ?? fontThemes[0];
const fontsUrl  = `https://fonts.googleapis.com/css2?family=${fontTheme.family}:wght@${fontTheme.weights}&display=swap`;
```

Add to the page `<head>` (use Next.js metadata or render inline in the layout):

```tsx
<>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href={fontsUrl} rel="stylesheet" />
</>
```

### CSS variables

Inject a `<style>` tag with CSS custom properties derived from the chosen theme:

```tsx
import { colorThemes, DEFAULT_COLOR_KEY } from '@/data/themes';

const colorKey   = event.theme?.colorKey ?? DEFAULT_COLOR_KEY;
const colorTheme = colorThemes.find(c => c.key === colorKey) ?? colorThemes.find(c => c.key === DEFAULT_COLOR_KEY)!;

const themeStyle = `
  :root {
    --theme-primary:   ${colorTheme.primary};
    --theme-btn-text:  ${colorTheme.btnText};
    --theme-font:      '${fontTheme.family.replace(/\+/g,' ')}', sans-serif;
  }
`;
```

```tsx
<style dangerouslySetInnerHTML={{ __html: themeStyle }} />
```

### Using the variables in volunteer-facing UI

Replace hardcoded sage button classes with theme-aware inline styles or a
utility class that reads the CSS variables:

```tsx
// Sign Up button
<button
  style={{
    backgroundColor: 'var(--theme-primary)',
    color: 'var(--theme-btn-text)',
  }}
  className="w-full rounded-full px-4 py-2.5 text-sm font-semibold font-body
             transition-opacity hover:opacity-90"
>
  Confirm Signup
</button>

// Event title heading
<h1
  style={{ fontFamily: 'var(--theme-font)' }}
  className="text-2xl font-semibold text-charcoal"
>
  {event.title}
</h1>
```

Apply `var(--theme-primary)` to:
- Public event page "Sign up" button background
- Public event page "See who" / "View signups" links
- Public event page section icon accents for "Still Needed" / "Filled Roles"
- Public event page coverage bar fill
- Signup confirmation page "Add to Calendar" button background

Apply `var(--theme-btn-text)` to:
- The themed button text on volunteer-facing primary actions

Apply `var(--theme-font)` to:
- Public event page title and section headings
- Signup confirmation heading and event title field

Keep neutral (not theme-colored):
- Coverage line text (`X of Y filled`) and "still needed" text remain charcoal
- Most body copy remains design-system neutrals for readability

---

## 5. Preview in the organizer UI (stretch goal, v2)

A live preview of the signup page within the theme picker would be ideal but
is not required for v1. In v1, organizers see the result after saving and
visiting their signup page.

---

## Performance note

Volunteer-facing pages load the selected heading font with `display=swap`,
ensuring text renders immediately in fallback fonts while webfonts load.

Organizer create/edit forms do not preload all fonts by default; picker fonts
are fetched only when "Customize appearance" is expanded.

---

## What's New entry

```ts
{
  type: 'new',
  text: 'Themes — customize your signup page with a color theme and font. Choose from 42 color themes (including school colors, team colors, and whimsical palettes) and 21 Google Fonts across sans-serif, serif, and script styles.',
},
```
