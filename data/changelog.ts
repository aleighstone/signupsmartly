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
    date: 'March 22, 2026',
    changes: [
      { type: 'fixed', text: 'Fixed scheduled signup times — the app no longer converts timezones; organizers enter times and volunteers see the same times.' },
      { type: 'new', text: 'Sign up and sign in with Google — one click, no password needed.' },
      { type: 'new', text: 'Event created confirmation email — get an email with your public signup link and a link back to your dashboard whenever you create a new signup.' },
      { type: 'new', text: 'Copy Signup URL — copy your public volunteer signup link directly from the signups page.' },
      { type: 'new', text: 'Edit Event — update event details, adjust volunteer spots and capacities, and add or remove spots at any time. When a filled spot is removed, affected volunteers are notified automatically.' },
      { type: 'new', text: 'Export List — generate a plain-text version of your full volunteer roster organized by spot, ready to copy and paste into an email or text.' },
      { type: 'new', text: 'Print — print a clean, formatted version of your signups list straight from the dashboard.' },
      { type: 'improved', text: 'NPS survey is now more compact and no longer stretches awkwardly across wide screens.' },
    ],
  },
];
