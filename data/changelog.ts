export type ChangeType = 'new' | 'improved' | 'fixed';

export type Change = {
  type: ChangeType;
  text: string;
};

export type Release = {
  date: string; // Display string, e.g. "March 22, 2026"
  changes: Change[];
};

export const changelog: Release[] = [
  {
    date: 'April 2, 2026',
    changes: [
      { type: 'improved', text: 'Scheduled spots now sort automatically by date and time when you save — so you can enter spots in any order and they\'ll always appear chronologically.' },
    ],
  },
  {
    date: 'March 27, 2026',
    changes: [
      { type: 'new', text: 'Themes — customize your signup page with a color theme and font. Choose from 51 color themes (including school colors, team colors, and whimsical palettes) and 21 Google Fonts across sans-serif, serif, and script styles.' },
      { type: 'new', text: 'See who\'s signed up — volunteers can tap a slot to see who has already claimed a spot. Shown by default; organizers can turn it off for anonymous signups.' },
      { type: 'new', text: 'Per-spot volunteer notes: set a custom label (e.g. “Potluck dish”) and optionally require volunteers to fill it in when they sign up — works on create, edit, the public signup form, organizer manual add, exports, and the signups table.' },
      { type: 'fixed', text: 'Volunteer signup page — scheduled spots now show the date as well as the time (including in the sign-up modal), so it is clear which day each shift is for.' },
      { type: 'fixed', text: 'Edit signup — slot dates and times now load reliably into the edit form with your saved values, instead of sometimes appearing empty.' },
    ],
  },
  {
    date: 'March 22, 2026',
    changes: [
      { type: 'fixed', text: 'Fixed scheduled signup times — the app no longer converts timezones; Volunteers now see the same time as organizers with no timezone translation logic.' },
      { type: 'new', text: 'Added sign up and sign in with Google OAuth.' },
      { type: 'new', text: 'Copy Signup URL — copy your public volunteer signup link directly from the signups page.' },
      { type: 'new', text: 'Edit Event — update event details, adjust volunteer spots and capacities, and add or remove spots at any time. When a filled spot is removed, affected volunteers are notified automatically.' },
      { type: 'new', text: 'Export List — generate a plain-text version of your full volunteer roster organized by spot, ready to copy and paste into an email or text.' },
      { type: 'new', text: 'Print — print a clean, formatted version of your signups list straight from the dashboard.' },
      { type: 'improved', text: 'NPS survey is now more compact and no longer stretches across wide screens.' },
    ],
  },
  {
    date: 'March 20, 2026',
    changes: [
      { type: 'new', text: 'Event confirmation email — checking off our first feature request! Get an email with your public signup link and a link back to your dashboard whenever you create a new signup.' },
    ],
  },
  {
    date: 'March 18, 2026',
    changes: [
      { type: 'improved', text: 'Improved security and privacy with database-level access controls (RLS) ensuring organizers only access data they are authorized to see.' },
      { type: 'new', text: 'SignupSmartly v1 is released to the public! Thanks to all the early adopters who helped us test and improve the product.' },
    ],
  },
];
