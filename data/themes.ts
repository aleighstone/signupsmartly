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
  family: string; // exact Google Fonts family name (URL segment, e.g. DM+Sans)
  category: 'sans-serif' | 'serif' | 'script';
  weights: string; // for Google Fonts URL, e.g. "400;600;700"
};

export const colorThemes: ColorTheme[] = [
  // ── School & University ──────────────────────────────────────
  { key: 'michigan-maize', name: 'Michigan Maize', category: 'school', primary: '#FFCB05', btnText: '#1C1917' },
  { key: 'michigan-blue', name: 'Michigan Blue', category: 'school', primary: '#00274C', btnText: '#FFFFFF' },
  { key: 'oregon-green', name: 'Oregon Green', category: 'school', primary: '#154733', btnText: '#FFFFFF' },
  { key: 'oregon-yellow', name: 'Oregon Yellow', category: 'school', primary: '#FEE123', btnText: '#1C1917' },
  { key: 'usc-cardinal', name: 'USC Cardinal', category: 'school', primary: '#990000', btnText: '#FFFFFF' },
  { key: 'notre-dame-navy', name: 'Notre Dame Navy', category: 'school', primary: '#0C2340', btnText: '#FFFFFF' },
  { key: 'texas-orange', name: 'Texas Orange', category: 'school', primary: '#BF5700', btnText: '#FFFFFF' },
  { key: 'georgia-red', name: 'Georgia Red', category: 'school', primary: '#BA0C2F', btnText: '#FFFFFF' },
  { key: 'ohio-state-scarlet', name: 'Ohio State Scarlet', category: 'school', primary: '#BB0000', btnText: '#FFFFFF' },
  { key: 'duke-blue', name: 'Duke Blue', category: 'school', primary: '#003087', btnText: '#FFFFFF' },
  { key: 'kentucky-blue', name: 'Kentucky Blue', category: 'school', primary: '#0033A0', btnText: '#FFFFFF' },
  { key: 'ucla-blue', name: 'UCLA Blue', category: 'school', primary: '#2D68C4', btnText: '#FFFFFF' },
  { key: 'penn-state-navy', name: 'Penn State Navy', category: 'school', primary: '#001E44', btnText: '#FFFFFF' },
  { key: 'clemson-orange', name: 'Clemson Orange', category: 'school', primary: '#C04E18', btnText: '#FFFFFF' },

  // ── Sports Teams ────────────────────────────────────────────
  { key: 'dodger-blue', name: 'Dodger Blue', category: 'sports', primary: '#005A9C', btnText: '#FFFFFF' },
  { key: 'yankee-navy', name: 'Yankee Navy', category: 'sports', primary: '#132448', btnText: '#FFFFFF' },
  { key: 'lakers-purple', name: 'Lakers Purple', category: 'sports', primary: '#552583', btnText: '#FFFFFF' },
  { key: 'warriors-blue', name: 'Warriors Blue', category: 'sports', primary: '#1D428A', btnText: '#FFFFFF' },
  { key: '49ers-red', name: '49ers Red', category: 'sports', primary: '#AA0000', btnText: '#FFFFFF' },
  { key: 'packers-green', name: 'Packers Green', category: 'sports', primary: '#203731', btnText: '#FFFFFF' },
  { key: 'manchester-red', name: 'Manchester Red', category: 'sports', primary: '#DA291C', btnText: '#FFFFFF' },

  // ── General & Aesthetic ─────────────────────────────────────
  { key: 'default', name: 'Default ★', category: 'general', primary: '#4A7C59', btnText: '#FFFFFF' },
  { key: 'sage', name: 'Sage', category: 'general', primary: '#4A7C59', btnText: '#FFFFFF' },
  { key: 'coral', name: 'Coral', category: 'general', primary: '#A8392A', btnText: '#FFFFFF' },
  { key: 'lavender', name: 'Lavender', category: 'general', primary: '#5B4FB5', btnText: '#FFFFFF' },
  { key: 'rose', name: 'Rose', category: 'general', primary: '#C2185B', btnText: '#FFFFFF' },
  { key: 'teal', name: 'Teal', category: 'general', primary: '#00756A', btnText: '#FFFFFF' },
  { key: 'slate', name: 'Slate', category: 'general', primary: '#455A64', btnText: '#FFFFFF' },
  { key: 'plum', name: 'Plum', category: 'general', primary: '#6A1B9A', btnText: '#FFFFFF' },
  { key: 'amber', name: 'Amber', category: 'general', primary: '#926006', btnText: '#FFFFFF' },
  { key: 'forest', name: 'Forest', category: 'general', primary: '#2D6A4F', btnText: '#FFFFFF' },
  { key: 'sky', name: 'Sky', category: 'general', primary: '#0163A0', btnText: '#FFFFFF' },
  { key: 'blush', name: 'Blush', category: 'general', primary: '#A85560', btnText: '#FFFFFF' },
  { key: 'indigo', name: 'Indigo', category: 'general', primary: '#4338CA', btnText: '#FFFFFF' },
  { key: 'dusty-rose', name: 'Dusty Rose', category: 'general', primary: '#9B555E', btnText: '#FFFFFF' },

  // ── Unicorn & Whimsical ─────────────────────────────────────
  { key: 'fuchsia', name: 'Fuchsia', category: 'unicorn', primary: '#A21CAF', btnText: '#FFFFFF' },
  { key: 'magenta', name: 'Magenta', category: 'unicorn', primary: '#C026D3', btnText: '#FFFFFF' },
  { key: 'bubblegum', name: 'Bubblegum', category: 'unicorn', primary: '#DB2777', btnText: '#FFFFFF' },
  { key: 'violet', name: 'Violet', category: 'unicorn', primary: '#7C3AED', btnText: '#FFFFFF' },
  { key: 'iridescent-teal', name: 'Iridescent Teal', category: 'unicorn', primary: '#0E7490', btnText: '#FFFFFF' },
  { key: 'electric-blue', name: 'Electric Blue', category: 'unicorn', primary: '#1746A2', btnText: '#FFFFFF' },
  { key: 'wisteria', name: 'Wisteria', category: 'unicorn', primary: '#6B46C1', btnText: '#FFFFFF' },
];

export const fontThemes: FontTheme[] = [
  // ── Sans-serif ───────────────────────────────────────────────
  { key: 'quicksand', name: 'Quicksand', family: 'Quicksand', category: 'sans-serif', weights: '400;600;700' },
  { key: 'nunito', name: 'Nunito', family: 'Nunito', category: 'sans-serif', weights: '400;600;700' },
  { key: 'poppins', name: 'Poppins', family: 'Poppins', category: 'sans-serif', weights: '400;600;700' },
  { key: 'raleway', name: 'Raleway', family: 'Raleway', category: 'sans-serif', weights: '400;600;700' },
  { key: 'lato', name: 'Lato', family: 'Lato', category: 'sans-serif', weights: '400;700' },
  { key: 'montserrat', name: 'Montserrat', family: 'Montserrat', category: 'sans-serif', weights: '400;600;700' },
  { key: 'dm-sans', name: 'DM Sans', family: 'DM+Sans', category: 'sans-serif', weights: '400;600;700' },
  { key: 'outfit', name: 'Outfit', family: 'Outfit', category: 'sans-serif', weights: '400;600;700' },

  // ── Serif ────────────────────────────────────────────────────
  { key: 'playfair-display', name: 'Playfair Display', family: 'Playfair+Display', category: 'serif', weights: '400;600;700' },
  { key: 'merriweather', name: 'Merriweather', family: 'Merriweather', category: 'serif', weights: '400;700' },
  { key: 'lora', name: 'Lora', family: 'Lora', category: 'serif', weights: '400;600;700' },
  { key: 'eb-garamond', name: 'EB Garamond', family: 'EB+Garamond', category: 'serif', weights: '400;600;700' },
  { key: 'libre-baskerville', name: 'Libre Baskerville', family: 'Libre+Baskerville', category: 'serif', weights: '400;700' },
  { key: 'cormorant-garamond', name: 'Cormorant Garamond', family: 'Cormorant+Garamond', category: 'serif', weights: '400;600;700' },
  { key: 'crimson-pro', name: 'Crimson Pro', family: 'Crimson+Pro', category: 'serif', weights: '400;600;700' },

  // ── Script / Handwritten ─────────────────────────────────────
  { key: 'pacifico', name: 'Pacifico', family: 'Pacifico', category: 'script', weights: '400' },
  { key: 'dancing-script', name: 'Dancing Script', family: 'Dancing+Script', category: 'script', weights: '400;700' },
  { key: 'satisfy', name: 'Satisfy', family: 'Satisfy', category: 'script', weights: '400' },
  { key: 'caveat', name: 'Caveat', family: 'Caveat', category: 'script', weights: '400;700' },
  { key: 'kalam', name: 'Kalam', family: 'Kalam', category: 'script', weights: '400;700' },
  { key: 'permanent-marker', name: 'Permanent Marker', family: 'Permanent+Marker', category: 'script', weights: '400' },
  { key: 'handlee', name: 'Handlee', family: 'Handlee', category: 'script', weights: '400' },
];

export const DEFAULT_COLOR_KEY = 'default';
export const DEFAULT_FONT_KEY = 'quicksand';

export function fontFamilyCss(font: FontTheme): string {
  return `'${font.family.replace(/\+/g, ' ')}', sans-serif`;
}

export function resolveColorTheme(colorKey: string | null | undefined): ColorTheme {
  const found = colorThemes.find((c) => c.key === colorKey);
  if (found) return found;
  return colorThemes.find((c) => c.key === DEFAULT_COLOR_KEY)!;
}

export function resolveFontTheme(fontKey: string | null | undefined): FontTheme {
  const found = fontThemes.find((f) => f.key === fontKey);
  if (found) return found;
  return fontThemes.find((f) => f.key === DEFAULT_FONT_KEY)!;
}

export function googleFontsStylesheetHref(font: FontTheme): string {
  return `https://fonts.googleapis.com/css2?family=${font.family}:wght@${font.weights}&display=swap`;
}

/** Single stylesheet for every picker font (organizer UI); use with display=swap when injecting. */
export function googleFontsAllPickerStylesheetHref(): string {
  const families = fontThemes.map((f) => `family=${f.family}:wght@${f.weights}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** Parse `events.theme` jsonb and build Google Fonts URL + :root CSS for volunteer-facing pages. */
export function buildVolunteerFacingThemeHead(theme: unknown): {
  fontsUrl: string;
  themeStyleCss: string;
} {
  const themeObj =
    theme && typeof theme === 'object' && !Array.isArray(theme)
      ? (theme as Record<string, unknown>)
      : null;
  const storedColorKey =
    themeObj && typeof themeObj.colorKey === 'string' ? themeObj.colorKey : undefined;
  const storedFontKey =
    themeObj && typeof themeObj.fontKey === 'string' ? themeObj.fontKey : undefined;
  const colorTheme = resolveColorTheme(storedColorKey);
  const fontTheme = resolveFontTheme(storedFontKey);
  const fontsUrl = googleFontsStylesheetHref(fontTheme);
  const themeStyleCss = `:root {
    --theme-primary: ${colorTheme.primary};
    --theme-btn-text: ${colorTheme.btnText};
    --theme-font: ${fontFamilyCss(fontTheme)};
  }`;
  return { fontsUrl, themeStyleCss };
}
