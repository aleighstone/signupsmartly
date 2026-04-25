export type ChangeType = 'new' | 'improved' | 'fixed';

export type Change = {
  type: ChangeType;
  /** Markdown: start with **Feature name**: description (links, *italic*, **bold**, line breaks). */
  text: string;
};

export type Release = {
  /** Real calendar date the changes went live (not a placeholder). Format: "Month D, YYYY" — newest releases first in the array. */
  date: string;
  changes: Change[];
};

export const changelog: Release[] = [
  {
    date: 'April 24, 2026',
    changes: [
      {
        type: 'new',
        text: '**Jump to future spots**: Multi-day signups now include a quick “Go to future spots” link, so volunteers can skip past earlier dates and get straight to the upcoming needs without losing access to past spots.',
      },
      {
        type: 'new',
        text: '**Archive signups**: Keep your dashboard tidy by archiving completed or retired signups. Archived signups move out of the Active view, can be restored anytime, and their public signup links are no longer accessible.',
      },
      {
        type: 'new',
        text: '**Dashboard shortcut on signup pages**: When you’re signed in, public signup pages now show a quick “My Dashboard” link so you can get back to managing your signups faster.',
      },
      {
        type: 'improved',
        text: '**Faster volunteer signups**: SignupSmartly now remembers the last name and email a volunteer used on the same device, so repeat signups can be filled in faster.',
      },
    ],
  },
  {
    date: 'April 22, 2026',
    changes: [
      {
        type: 'improved',
        text: '**Volunteer signup page**: Clearer hierarchy on themed signups—shift time stands out first, role name sits beneath it, and how many spots are open matches your theme color (same as the signup button and coverage bar). Section labels use crisp icons instead of emoji, filled slots are slightly softened so open needs stay the focus, and the “still needed” line on the coverage meter follows the same accent color.',
      },
      {
        type: 'improved',
        text: '**Confirmation and reminder emails**: The volunteer confirmation email now links the event name to the public signup page so people can reopen or share it easily. Reminder timing adds *1 week before* and *3 days before*, alongside *1 day before* and *morning of the event*; you can update your choice anytime from the reminder preferences link in the email.',
      },
    ],
  },
  {
    date: 'April 15, 2026',
    changes: [
      {
        type: 'new',
        text: '**Remove a signup**: Organizers can remove a volunteer from the View My Signups page by clicking the trash icon and confirming. You could already add signups there; now you have full control to add and remove signups from the dashboard.',
      },
    ],
  },
  {
    date: 'April 13, 2026',
    changes: [
      {
        type: 'new',
        text: '**Copy Signup**: Duplicate any of your signups with one click. The copy opens in draft mode so you can review and adjust before publishing.',
      },
      {
        type: 'improved',
        text: '**Organizer signup view**: Dates now display correctly across all signup types, including simple list signups with no date set.',
      },
      {
        type: 'improved',
        text: '**Spot and item order**: Rearrange how slots appear on the public page using the up and down arrows when you edit an event. Scheduled signups still default to chronological order by date and time; simple lists default to the order you added items, and you can fine-tune either anytime.',
      },
    ],
  },
  {
    date: 'April 10, 2026',
    changes: [
      {
        type: 'improved',
        text: '**Public signup descriptions**: Event descriptions and spot instructions on the volunteer signup page now render *italics*, **bold**, links, and line breaks, matching what you use in the editor.',
      },
    ],
  },
  {
    date: 'April 6, 2026',
    changes: [
      {
        type: 'new',
        text: '**Themes**: Customize your signup page with a color theme and font. Choose from 42 color themes (including school colors, team colors, and whimsical palettes) and 21 Google Fonts across sans-serif, serif, and script styles.',
      },
      {
        type: 'new',
        text: "**See who's signed up**: Volunteers can tap a slot to see who has already claimed a spot. Shown by default; organizers can turn it off for anonymous signups.",
      },
      {
        type: 'new',
        text: '**Per-spot volunteer notes**: Set a custom label (e.g. “Potluck dish”) and optionally require volunteers to fill it in when they sign up. Works on create, edit, the public signup form, organizer manual add, exports, and the signups table.',
      },
    ],
  },
  {
    date: 'April 2, 2026',
    changes: [
      {
        type: 'improved',
        text: "**Scheduled spot sorting**: Scheduled spots now sort automatically by date and time when you save, so you can enter spots in any order and they'll always appear chronologically.",
      },
    ],
  },
  {
    date: 'March 27, 2026',
    changes: [
      {
        type: 'fixed',
        text: '**Volunteer signup page**: Scheduled spots now show the date as well as the time (including in the sign-up modal), so it is clear which day each shift is for.',
      },
      {
        type: 'fixed',
        text: '**Edit signup**: Slot dates and times now load reliably into the edit form with your saved values, instead of sometimes appearing empty.',
      },
    ],
  },
  {
    date: 'March 22, 2026',
    changes: [
      {
        type: 'fixed',
        text: '**Fixed scheduled signup times**: The app no longer converts timezones; volunteers now see the same time as organizers with no timezone translation logic.',
      },
      { type: 'new', text: '**Google sign-in**: Added sign up and sign in with Google OAuth.' },
      {
        type: 'new',
        text: '**Copy Signup URL**: Copy your public volunteer signup link directly from the signups page.',
      },
      {
        type: 'new',
        text: '**Edit Event**: Update event details, adjust volunteer spots and capacities, and add or remove spots at any time. When a filled spot is removed, affected volunteers are notified automatically.',
      },
      {
        type: 'new',
        text: '**Export List**: Generate a plain-text version of your full volunteer roster organized by spot, ready to copy and paste into an email or text.',
      },
      {
        type: 'new',
        text: '**Print**: Print a clean, formatted version of your signups list straight from the dashboard.',
      },
      {
        type: 'improved',
        text: '**NPS survey**: Now more compact and no longer stretches across wide screens.',
      },
    ],
  },
  {
    date: 'March 20, 2026',
    changes: [
      {
        type: 'new',
        text: '**Event confirmation email**: Checking off our first feature request! Get an email with your public signup link and a link back to your dashboard whenever you create a new signup.',
      },
    ],
  },
  {
    date: 'March 18, 2026',
    changes: [
      {
        type: 'improved',
        text: '**Security and privacy**: Improved with database-level access controls (RLS) ensuring organizers only access data they are authorized to see.',
      },
      {
        type: 'new',
        text: '**SignupSmartly v1**: Released to the public! Thanks to all the early adopters who helped us test and improve the product.',
      },
    ],
  },
];
