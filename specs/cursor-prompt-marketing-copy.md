# Cursor Prompt: Marketing Copy Updates

Reference doc: `specs/marketing-copy-suggestions.md`
Files to edit: `app/page.tsx`, `app/use-cases/page.tsx`

These are copy-only changes — no new components, no new routes, no schema changes.
Run `npm run build` after to confirm no regressions.

---

## `app/page.tsx` — 5 changes

### 1. Replace the hero h1 placeholder

**Find:**
```tsx
SignupSmartly - smarter than a genius
```

**Replace with:**
```tsx
Coordinate volunteers. Find dates that work.
```

---

### 2. Update the hero description

**Find:**
```tsx
A cleaner way to coordinate volunteer signups and group scheduling
for community events, classrooms, and sports. Create, share a
link.<br />No ads, no clutter.
```

**Replace with:**
```tsx
Create a volunteer signup or an availability poll, share one link,
and let people respond in seconds. No account needed for
participants. No ads. No clutter.
```

---

### 3. Update the "For organizers" card

**Find:**
```tsx
Create events, define what you need, and share one link. See
coverage at a glance and export rosters.
```

**Replace with:**
```tsx
Create an event or availability poll, define what you need, and
share one link. See who's responded, find the best date or fill
your roster, and export when you're ready.
```

---

### 4. Update the "For volunteers" card

The current copy mentions a "cancel link" which only applies to scheduled/simple signups, not availability polls.

**Find:**
```tsx
View open slots, sign up in seconds, and get a confirmation
email with a cancel link if plans change.
```

**Replace with:**
```tsx
See what's open, respond in seconds, and get a confirmation
email. No account needed — just click the link.
```

---

### 5. Update the "How it works" section — 3 sub-changes

**5a. Step 1 heading:**

Find: `Create your signup`
Replace with: `Create your event or poll`

**5b. Step 1 body:**

**Find:**
```tsx
Add your event details, spots, times, and how many volunteers you need for each role or item.
```

**Replace with:**
```tsx
Add dates and roles for a volunteer signup, or proposed dates for a group availability poll. Set how many people you need, or just let everyone weigh in.
```

**5c. Step 3 heading:**

Find: `Track coverage`
Replace with: `See who responded`

**5d. Step 3 body:**

**Find:**
```tsx
Watch your roster fill in from the dashboard. Export to a spreadsheet or print before your event.
```

**Replace with:**
```tsx
Watch signups fill your roster, or see which proposed date has the most availability. Export to a spreadsheet or print when you're ready.
```

---

### 6. Update the "Use cases teaser" h2

**Find:**
```tsx
Works for sports teams, classrooms, clubs, and more
```

**Replace with:**
```tsx
Works for sports teams, classrooms, clubs, and groups of all kinds
```

---

### 7. Update the footer tagline

**Find:**
```tsx
SignupSmartly — coordination made simple.
```

**Replace with:**
```tsx
SignupSmartly — coordination made simple.
```

There are two instances of this string in `app/page.tsx` — update **both**.

> ⚠️ Also update the same string in `app/use-cases/page.tsx` footer (see below).

---

## `app/use-cases/page.tsx` — 2 changes

### 1. Update the footer tagline (same change as homepage)

**Find:**
```tsx
SignupSmartly — coordination made simple.
```

**Replace with:**
```tsx
SignupSmartly — coordination made simple.
```

---

### 2. Update the availability poll screenshot

The `group-scheduling` use case entry currently has:
```tsx
screenshot: '/marketing-content/SS_Availability_poll_placeholder.png',
```

This screenshot has been captured and saved to `public/marketing-content/SS_Availability_poll_placeholder.png`.
No code change needed — just confirm the file exists before deploying.

---

## Verification

After making all changes, run:

```bash
npm run build
```

Confirm zero TypeScript or build errors. The only changes are string replacements — no logic changes.

Then deploy:

```bash
git add .
git commit -m "Update marketing copy for availability poll launch"
git push origin main
```
