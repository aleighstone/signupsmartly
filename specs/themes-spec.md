# Spec: Signup Page Themes (Colors + Fonts)

## Overview

Organizers can choose a color theme and a heading font for their signup page.
The theme applies to the public volunteer-facing signup page only — the
organizer dashboard is unaffected.

Themes are curated, not free-form. Organizers choose from a pre-defined set of
51 color themes and 21 Google Fonts. All color/text contrast combinations are
pre-validated to meet WCAG AA (4.5:1 minimum ratio).

Reference sheet: `/public/marketing-content/color-themes-reference.png`

---

## Design decisions

- **Curated palette only** — no free-form color picker. Prevents illegible
  low-contrast combinations and reduces UI complexity.
- **Font applies to headings only** — body text stays as Inter for readability
  regardless of theme. The heading font gives personality without sacrificing
  legibility.
- **Default theme** — Sage (#4A7C59), Quicksand (current brand font). Existing
  events without a theme render identically to today.
- **Stored as JSON** — a single `theme` JSONB column on the events table keeps
  this flexible without new columns for every future theme property.
- **No extra infrastructure** — Google Fonts loads via a URL in the signup page
  `<head>`. Colors apply via inline CSS variables. No CDN, no image storage.

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
| Modify | `app/event/[slug]/page.tsx` | Apply theme to signup page |

---

## 1. Data file: `data/themes.ts`

```ts
export type ColorTheme = {
  key:      string;
  name:     string;
  category: 'school' | 'sports' | 'general' | 'unicorn';
  primary:  string;  // button background hex
  btnText:  string;  // button text hex — pre-validated for 4.5:1 contrast
};

export type FontTheme = {
  key:      string;
  name:     string;
  family:   string;  // exact Google Fonts family name
  category: 'sans-serif' | 'serif' | 'script';
  weights:  string;  // for Google Fonts URL, e.g. "400;600;700"
};

export const colorThemes: ColorTheme[] = [

  // ── School & University ──────────────────────────────────────
  { key: 'michigan-maize',     name: 'Michigan Maize',     category: 'school',  primary: '#FFCB05', btnText: '#1C1917' },
  { key: 'michigan-blue',      name: 'Michigan Blue',      category: 'school',  primary: '#00274C', btnText: '#FFFFFF' },
  { key: 'alabama-crimson',    name: 'Alabama Crimson',    category: 'school',  primary: '#9E1B32', btnText: '#FFFFFF' },
  { key: 'oregon-green',       name: 'Oregon Green',       category: 'school',  primary: '#154733', btnText: '#FFFFFF' },
  { key: 'oregon-yellow',      name: 'Oregon Yellow',      category: 'school',  primary: '#FEE123', btnText: '#1C1917' },
  { key: 'usc-cardinal',       name: 'USC Cardinal',       category: 'school',  primary: '#990000', btnText: '#FFFFFF' },
  { key: 'stanford-cardinal',  name: 'Stanford Cardinal',  category: 'school',  primary: '#8C1515', btnText: '#FFFFFF' },
  { key: 'notre-dame-navy',    name: 'Notre Dame Navy',    category: 'school',  primary: '#0C2340', btnText: '#FFFFFF' },
  { key: 'texas-orange',       name: 'Texas Orange',       category: 'school',  primary: '#BF5700', btnText: '#FFFFFF' },
  { key: 'georgia-red',        name: 'Georgia Red',        category: 'school',  primary: '#BA0C2F', btnText: '#FFFFFF' },
  { key: 'ohio-state-scarlet', name: 'Ohio State Scarlet', category: 'school',  primary: '#BB0000', btnText: '#FFFFFF' },
  { key: 'duke-blue',          name: 'Duke Blue',          category: 'school',  primary: '#003087', btnText: '#FFFFFF' },
  { key: 'kentucky-blue',      name: 'Kentucky Blue',      category: 'school',  primary: '#0033A0', btnText: '#FFFFFF' },
  { key: 'ucla-blue',          name: 'UCLA Blue',          category: 'school',  primary: '#2D68C4', btnText: '#FFFFFF' },
  { key: 'florida-blue',       name: 'Florida Blue',       category: 'school',  primary: '#003087', btnText: '#FFFFFF' },
  { key: 'penn-state-navy',    name: 'Penn State Navy',    category: 'school',  primary: '#001E44', btnText: '#FFFFFF' },
  { key: 'clemson-orange',     name: 'Clemson Orange',     category: 'school',  primary: '#C04E18', btnText: '#FFFFFF' },
  { key: 'auburn-orange',      name: 'Auburn Orange',      category: 'school',  primary: '#B85210', btnText: '#FFFFFF' },

  // ── Sports Teams ────────────────────────────────────────────
  { key: 'dodger-blue',        name: 'Dodger Blue',        category: 'sports',  primary: '#005A9C', btnText: '#FFFFFF' },
  { key: 'yankee-navy',        name: 'Yankee Navy',        category: 'sports',  primary: '#132448', btnText: '#FFFFFF' },
  { key: 'red-sox-red',        name: 'Red Sox Red',        category: 'sports',  primary: '#BD3039', btnText: '#FFFFFF' },
  { key: 'lakers-purple',      name: 'Lakers Purple',      category: 'sports',  primary: '#552583', btnText: '#FFFFFF' },
  { key: 'warriors-blue',      name: 'Warriors Blue',      category: 'sports',  primary: '#1D428A', btnText: '#FFFFFF' },
  { key: '49ers-red',          name: '49ers Red',          category: 'sports',  primary: '#AA0000', btnText: '#FFFFFF' },
  { key: 'packers-green',      name: 'Packers Green',      category: 'sports',  primary: '#203731', btnText: '#FFFFFF' },
  { key: 'cowboys-navy',       name: 'Cowboys Navy',       category: 'sports',  primary: '#003594', btnText: '#FFFFFF' },
  { key: 'chelsea-blue',       name: 'Chelsea Blue',       category: 'sports',  primary: '#034694', btnText: '#FFFFFF' },
  { key: 'manchester-red',     name: 'Manchester Red',     category: 'sports',  primary: '#DA291C', btnText: '#FFFFFF' },

  // ── General & Aesthetic ─────────────────────────────────────
  { key: 'sage',               name: 'Sage',               category: 'general', primary: '#4A7C59', btnText: '#FFFFFF' },
  { key: 'ocean',              name: 'Ocean',              category: 'general', primary: '#0077B6', btnText: '#FFFFFF' },
  { key: 'coral',              name: 'Coral',              category: 'general', primary: '#A8392A', btnText: '#FFFFFF' },
  { key: 'lavender',           name: 'Lavender',           category: 'general', primary: '#5B4FB5', btnText: '#FFFFFF' },
  { key: 'rose',               name: 'Rose',               category: 'general', primary: '#C2185B', btnText: '#FFFFFF' },
  { key: 'teal',               name: 'Teal',               category: 'general', primary: '#00756A', btnText: '#FFFFFF' },
  { key: 'slate',              name: 'Slate',              category: 'general', primary: '#455A64', btnText: '#FFFFFF' },
  { key: 'plum',               name: 'Plum',               category: 'general', primary: '#6A1B9A', btnText: '#FFFFFF' },
  { key: 'amber',              name: 'Amber',              category: 'general', primary: '#926006', btnText: '#FFFFFF' },
  { key: 'forest',             name: 'Forest',             category: 'general', primary: '#2D6A4F', btnText: '#FFFFFF' },
  { key: 'sky',                name: 'Sky',                category: 'general', primary: '#0163A0', btnText: '#FFFFFF' },
  { key: 'blush',              name: 'Blush',              category: 'general', primary: '#A85560', btnText: '#FFFFFF' },
  { key: 'indigo',             name: 'Indigo',             category: 'general', primary: '#4338CA', btnText: '#FFFFFF' },
  { key: 'dusty-rose',         name: 'Dusty Rose',         category: 'general', primary: '#9B555E', btnText: '#FFFFFF' },
  { key: 'olive',              name: 'Olive',              category: 'general', primary: '#4F5E2A', btnText: '#FFFFFF' },

  // ── Unicorn & Whimsical ─────────────────────────────────────
  { key: 'fuchsia',            name: 'Fuchsia',            category: 'unicorn', primary: '#A21CAF', btnText: '#FFFFFF' },
  { key: 'magenta',            name: 'Magenta',            category: 'unicorn', primary: '#C026D3', btnText: '#FFFFFF' },
  { key: 'bubblegum',          name: 'Bubblegum',          category: 'unicorn', primary: '#DB2777', btnText: '#FFFFFF' },
  { key: 'violet',             name: 'Violet',             category: 'unicorn', primary: '#7C3AED', btnText: '#FFFFFF' },
  { key: 'periwinkle',         name: 'Periwinkle',         category: 'unicorn', primary: '#4352B3', btnText: '#FFFFFF' },
  { key: 'iridescent-teal',    name: 'Iridescent Teal',   category: 'unicorn', primary: '#0E7490', btnText: '#FFFFFF' },
  { key: 'electric-blue',      name: 'Electric Blue',      category: 'unicorn', primary: '#1746A2', btnText: '#FFFFFF' },
  { key: 'wisteria',           name: 'Wisteria',           category: 'unicorn', primary: '#6B46C1', btnText: '#FFFFFF' },
];

export const fontThemes: FontTheme[] = [

  // ── Sans-serif ───────────────────────────────────────────────
  { key: 'quicksand',          name: 'Quicksand',          family: 'Quicksand',          category: 'sans-serif', weights: '400;600;700' },
  { key: 'nunito',             name: 'Nunito',             family: 'Nunito',             category: 'sans-serif', weights: '400;600;700' },
  { key: 'poppins',            name: 'Poppins',            family: 'Poppins',            category: 'sans-serif', weights: '400;600;700' },
  { key: 'raleway',            name: 'Raleway',            family: 'Raleway',            category: 'sans-serif', weights: '400;600;700' },
  { key: 'lato',               name: 'Lato',               family: 'Lato',               category: 'sans-serif', weights: '400;700' },
  { key: 'montserrat',         name: 'Montserrat',         family: 'Montserrat',         category: 'sans-serif', weights: '400;600;700' },
  { key: 'dm-sans',            name: 'DM Sans',            family: 'DM+Sans',            category: 'sans-serif', weights: '400;600;700' },
  { key: 'outfit',             name: 'Outfit',             family: 'Outfit',             category: 'sans-serif', weights: '400;600;700' },

  // ── Serif ────────────────────────────────────────────────────
  { key: 'playfair-display',   name: 'Playfair Display',   family: 'Playfair+Display',   category: 'serif',      weights: '400;600;700' },
  { key: 'merriweather',       name: 'Merriweather',       family: 'Merriweather',       category: 'serif',      weights: '400;700' },
  { key: 'lora',               name: 'Lora',               family: 'Lora',               category: 'serif',      weights: '400;600;700' },
  { key: 'eb-garamond',        name: 'EB Garamond',        family: 'EB+Garamond',        category: 'serif',      weights: '400;600;700' },
  { key: 'libre-baskerville',  name: 'Libre Baskerville',  family: 'Libre+Baskerville',  category: 'serif',      weights: '400;700' },
  { key: 'cormorant-garamond', name: 'Cormorant Garamond', family: 'Cormorant+Garamond', category: 'serif',      weights: '400;600;700' },
  { key: 'crimson-pro',        name: 'Crimson Pro',        family: 'Crimson+Pro',        category: 'serif',      weights: '400;600;700' },

  // ── Script / Handwritten ─────────────────────────────────────
  { key: 'pacifico',           name: 'Pacifico',           family: 'Pacifico',           category: 'script',     weights: '400' },
  { key: 'dancing-script',     name: 'Dancing Script',     family: 'Dancing+Script',     category: 'script',     weights: '400;700' },
  { key: 'satisfy',            name: 'Satisfy',            family: 'Satisfy',            category: 'script',     weights: '400' },
  { key: 'caveat',             name: 'Caveat',             family: 'Caveat',             category: 'script',     weights: '400;700' },
  { key: 'kalam',              name: 'Kalam',              family: 'Kalam',              category: 'script',     weights: '400;700' },
  { key: 'permanent-marker',   name: 'Permanent Marker',   family: 'Permanent+Marker',   category: 'script',     weights: '400' },
  { key: 'handlee',            name: 'Handlee',            family: 'Handlee',            category: 'script',     weights: '400' },
];

export const DEFAULT_COLOR_KEY = 'sage';
export const DEFAULT_FONT_KEY  = 'quicksand';
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
- Each option renders in its own font (loaded lazily via a preconnect + small
  CSS import when the picker is opened)
- Selected option has a sage underline
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

## 4. Applying the theme to the signup page

In `app/event/[slug]/page.tsx` (server component), read the event's `theme`
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

### Using the variables in the signup page

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
- The "Sign Up" / "Confirm Signup" button background
- The coverage bar fill
- The "Still Needed" section heading accent
- Any other primary-color accents on the page

Apply `var(--theme-font)` to:
- The event title (`<h1>`)
- Section headings ("Still Needed", "Filled Roles")

---

## 5. Preview in the organizer UI (stretch goal, v2)

A live preview of the signup page within the theme picker would be ideal but
is not required for v1. In v1, organizers see the result after saving and
visiting their signup page.

---

## Performance note

Google Fonts are loaded only on the public signup page — not on any
authenticated organizer pages. The `display=swap` parameter ensures text
renders immediately in the fallback font while the custom font loads, avoiding
a flash of invisible text.

---

## What's New entry

```ts
{
  type: 'new',
  text: 'Themes — customize your signup page with a color theme and font. Choose from 51 color themes (including school colors, team colors, and whimsical palettes) and 21 Google Fonts across sans-serif, serif, and script styles.',
},
```
