# Maintenance Banner — Mini Spec

## What it does
A dismissible yellow banner that appears at the top of every page when a single
environment variable is set. Turning it on = add the env var + redeploy.
Turning it off = remove the env var + redeploy. No code changes ever needed.

---

## Environment variable

```
NEXT_PUBLIC_MAINTENANCE_MESSAGE="We're making some updates — things might be
a little wonky. Thanks for your patience! 🙏"
```

- Prefixed with `NEXT_PUBLIC_` so it's available client-side
- If the variable is unset or empty, the banner does not render at all
- The message text is configurable — change it in Vercel env vars per deploy

---

## Files to create

### `components/MaintenanceBanner.tsx`

Client component (`'use client'`). Reads the env var and renders a dismissible
banner if set.

**Behavior:**
- Reads `process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE`
- If empty/undefined: renders nothing (`return null`)
- If set: renders the banner
- Dismiss button (×) hides the banner for the current session only
  (use `useState` — does not persist across page reloads, intentionally)
- No localStorage, no cookies — keep it simple

**Design:**
- Full-width, sits above everything else on the page
- Background: `bg-amber-50 border-b border-amber-200`
- Text: `text-amber-900 text-sm font-body`
- Dismiss button: `text-amber-600 hover:text-amber-900`
- Layout: `flex items-center justify-between px-4 py-2.5`
- Left side: ⚠️ icon + message text
- Right side: × dismiss button

```tsx
'use client';
import { useState } from 'react';

export function MaintenanceBanner() {
  const message = process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE;
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-4 px-4 py-2.5">
        <p className="text-sm text-amber-900 font-body">
          ⚠️ {message}
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 text-amber-600 hover:text-amber-900 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

---

## File to update

### `app/layout.tsx`

Import `MaintenanceBanner` and render it as the very first child inside `<body>`,
before `<PostHogProvider>` and everything else:

```tsx
import { MaintenanceBanner } from '@/components/MaintenanceBanner';

// Inside the body:
<body className="antialiased font-body text-charcoal bg-sand">
  <MaintenanceBanner />
  <PostHogProvider>
    ...
  </PostHogProvider>
</body>
```

Because it's in the root layout it automatically appears on every page —
dashboard, event pages, signup flows, everywhere.

---

## How to use it

**Turn on:**
1. Go to Vercel → project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_MAINTENANCE_MESSAGE` with your message text
3. Redeploy (or promote an existing build)

**Turn off:**
1. Delete or clear the env var in Vercel
2. Redeploy

**Change the message:**
1. Edit the env var value in Vercel
2. Redeploy

---

## On staging vs. production

This banner is a band-aid, not a substitute for a real staging setup. It's
appropriate for now while the site is small and you're the only deployer.

For staging, the right long-term solution is a Vercel Preview branch:
- All Vercel deployments already get a unique preview URL
  (e.g. `signupsmartly-new-git-main-allisons-projects.vercel.app`)
- Create a `staging` branch in git — push feature work there first
- Vercel automatically deploys it to a preview URL
- Test there before merging to `main` (which deploys to production)
- Add a separate `NEXT_PUBLIC_SUPABASE_URL` pointing to a Supabase staging
  project so you're not testing against live data

That's a separate (also small) piece of work when you're ready for it.
