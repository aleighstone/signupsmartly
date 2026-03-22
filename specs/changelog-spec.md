# Spec: Changelog / Release Notes Page

## Overview

A public-facing `/changelog` page that shows what's new in SignupSmartly.
The key design principle is **easy to update** — all content lives in a single
typed data file. Adding a new release means adding one object to the top of
that array, nothing else.

---

## Files to create / modify

| Action   | File                          | Purpose                              |
|----------|-------------------------------|--------------------------------------|
| Create   | `data/changelog.ts`           | All release data lives here          |
| Create   | `app/whats-new/page.tsx`      | The rendered page (server component) |
| Modify   | `app/page.tsx`                | Add "What's New" link to footer      |

---

## 1. Data file: `data/changelog.ts`

```ts
export type ChangeType = 'new' | 'improved' | 'fixed';

export type Change = {
  type: ChangeType;
  text: string;
};

export type Release = {
  date: string;       // Display string, e.g. "March 22, 2026"
  changes: Change[];
};

export const changelog: Release[] = [
  {
    date: 'March 22, 2026',
    changes: [
      { type: 'new',      text: 'Sign up and sign in with Google — one click, no password needed.' },
      { type: 'new',      text: 'Event created confirmation email — get an email with your public signup link and a link back to your dashboard whenever you create a new signup.' },
      { type: 'new',      text: 'Copy Signup URL — copy your public volunteer signup link directly from the signups page.' },
      { type: 'new',      text: 'Print — print a clean, formatted version of your signups list straight from the dashboard.' },
      { type: 'improved', text: 'NPS survey is now more compact and no longer stretches awkwardly across wide screens.' },
    ],
  },
];
```

**To add a new release:** prepend a new `Release` object to the top of the
`changelog` array. Newest entries always go first.

---

## 2. Page: `app/whats-new/page.tsx`

Server component. No `'use client'` needed — this is static content.

### Layout

Use the same standalone page pattern as `app/privacy/page.tsx` and
`app/terms/page.tsx` (check those for reference — they share a header/footer
without using `AppLayout`).

- Max content width: `max-w-2xl mx-auto px-4`
- Same `bg-sand` background as the rest of the marketing pages
- Same header as `app/page.tsx` (Logo + Sign in / Get started buttons)
- Same footer as `app/page.tsx` (Privacy · Terms · Digitaleigh, plus the new Changelog link)

### Page heading

```tsx
<h1 className="text-3xl font-semibold text-charcoal font-heading">
  What's new
</h1>
<p className="mt-2 text-muted font-body">
  The latest updates and improvements to SignupSmartly.
</p>
```

### Release entry

Each `Release` renders as:

```tsx
<section className="mt-10 border-t border-charcoal/10 pt-8 first:border-0 first:pt-0">
  <time className="text-sm font-medium text-muted font-body">{release.date}</time>
  <ul className="mt-4 space-y-3">
    {release.changes.map((change, i) => (
      <li key={i} className="flex items-start gap-3">
        <ChangeTag type={change.type} />
        <span className="text-charcoal font-body leading-relaxed">{change.text}</span>
      </li>
    ))}
  </ul>
</section>
```

### `ChangeTag` component (inline in the same file)

A small pill badge. Define it as a local function component inside
`changelog/page.tsx`:

```tsx
function ChangeTag({ type }: { type: ChangeType }) {
  const styles: Record<ChangeType, string> = {
    new:      'bg-sage/15 text-sage',
    improved: 'bg-sky-100 text-sky-700',
    fixed:    'bg-amber-100 text-amber-700',
  };
  const labels: Record<ChangeType, string> = {
    new:      'New',
    improved: 'Improved',
    fixed:    'Fixed',
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium font-body ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}
```

---

## 3. Footer update: `app/page.tsx`

In the footer's link row (currently `Privacy Policy · Terms of Service`), add
`· Changelog` after Terms:

```tsx
<span className="text-muted">·</span>
<Link href="/whats-new" className="text-charcoal hover:underline">
  What's New
</Link>
```

---

## Notes

- No database, no CMS, no API calls — pure static data
- The page requires no auth — it's public
- Do not use `AppLayout` — use the same self-contained header/footer pattern as the privacy/terms pages
- `first:border-0 first:pt-0` removes the top border/padding on the very first release entry so it doesn't float away from the heading
