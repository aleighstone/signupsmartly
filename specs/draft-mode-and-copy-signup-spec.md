# Draft Mode & Copy Signup — Product Spec

## Background

The `events` table has a `published` boolean. Today:
- The create form always sets `published: true`
- `duplicateEventAsDraft()` already sets `published: false` on copies — the copy backend is done
- `getEventsForUser()` already returns drafts alongside published events
- The dashboard `EventCard` component does not receive `published` and has no draft UI
- No "Publish" affordance exists anywhere in the UI
- The copy feature has no UI entry point yet

This spec hardens draft mode end-to-end so the copy feature can be safely released.

---

## Draft UX Principles

- A signup is a **draft** only when it has never been published. `published: false` → draft.
- Once published (`published: true`), it stays published. No "unpublish" in v1.
- The only two ways a draft is created:
  1. The organizer clicks "Save as Draft" on the create form
  2. The system creates a copy (always starts as draft)

---

## Scope of Changes

### 1. Dashboard — EventCard (`components/EventCard.tsx`)

**Pass `published` to EventCard.** The `EventCardProps` type and the dashboard page must pass the field through.

**Draft pill.** When `!event.published`, render a "Draft" pill inline with the event title, styled to match the "high priority" pill on the style guide page (`/styleguide`).

```tsx
// Draft pill — place immediately after the <h2> title
{!event.published && (
  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 font-body">
    Draft
  </span>
)}
```

**Button row changes for drafts.** The bottom two-button row currently shows:
- `[View My Signups]` `[Signup Page]`

For drafts, replace with:
- `[View My Signups]` `[Publish]`

"Signup Page" is hidden (not disabled) for drafts — there is no live page to link to.

"Publish" is a new button that calls `PATCH /api/events/[id]` with `{ published: true }`, then refreshes the page (`router.refresh()`).

```tsx
// Draft button row
<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
  <Link href={`/dashboard/event/${event.id}/signups`} className="btn-primary w-full text-center">
    View My Signups
  </Link>
  <button
    type="button"
    onClick={handlePublish}
    disabled={isPublishing}
    className="btn-secondary w-full text-center disabled:opacity-60"
  >
    {isPublishing ? 'Publishing…' : 'Publish'}
  </button>
</div>

// Published button row (unchanged)
<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
  <Link href={`/dashboard/event/${event.id}/signups`} className="btn-primary w-full text-center">
    View My Signups
  </Link>
  <a href={signupPageUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full text-center">
    Signup Page
  </a>
</div>
```

**Three-dot menu.** For drafts, add a "Publish" option at the top of the dropdown menu (above "Edit signup"). Clicking it triggers the same `handlePublish` logic. For published events the menu is unchanged.

**`handlePublish` implementation** (inside EventCard, which must become a client component — it already is):

```tsx
const [isPublishing, setIsPublishing] = useState(false);

const handlePublish = async () => {
  setIsPublishing(true);
  try {
    const res = await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: true }),
    });
    if (!res.ok) throw new Error('Failed to publish');
    router.refresh();
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Something went wrong');
  } finally {
    setIsPublishing(false);
  }
};
```

`useRouter` is already available since EventCard is a client component.

---

### 2. Dashboard Page (`app/dashboard/page.tsx`)

Pass `published` through to `EventCard`. The `event` object returned by `getEventsForUser` already includes `published` (it selects `*`). Update:

```tsx
// EventCardProps update: add published
event: {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  signup_type: 'scheduled' | 'simple';
  published: boolean;   // ← add this
};
```

In `dashboard/page.tsx`, `event` is already the full DB row — no query change needed.

---

### 3. API — Publish endpoint (`app/api/events/[id]/route.ts`)

`PATCH /api/events/[id]` already exists and updates the event. Verify it accepts `{ published: true }` and passes it through to Supabase. If `published` is not in the PATCH allowlist, add it.

No new route needed.

---

### 4. Create Form — "Save as Draft" option (`app/create-event/CreateEventForm.tsx`)

Replace the single "Create Signup" submit button with two buttons:

```tsx
<div className="flex flex-wrap gap-3">
  <button
    type="submit"
    disabled={isSubmitting}
    className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
  >
    {isSubmitting && submitIntent === 'publish' ? 'Publishing…' : 'Publish'}
  </button>
  <button
    type="button"
    disabled={isSubmitting}
    onClick={() => {
      setSubmitIntent('draft');
      scheduledForm.handleSubmit(onSubmitScheduled)(); // or simpleForm for simple type
    }}
    className="rounded-xl border border-charcoal/20 bg-surface px-6 py-3 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-60 transition-colors font-body"
  >
    {isSubmitting && submitIntent === 'draft' ? 'Saving…' : 'Save as Draft'}
  </button>
</div>
```

Add state to track intent:
```tsx
const [submitIntent, setSubmitIntent] = useState<'publish' | 'draft'>('publish');
```

When the form's type="submit" button is clicked, `submitIntent` defaults to `'publish'`. "Save as Draft" sets it to `'draft'` and triggers submit programmatically.

In `onSubmitScheduled` and `onSubmitSimple`, read `submitIntent`:
```tsx
published: submitIntent === 'publish',
```

**Post-save modal behavior:** After saving as draft, the existing `SaveAsTemplateModal` flow still fires. The only change is the created event will be a draft. The modal buttons ("View My Signups", "Go to Dashboard") remain the same — both work for drafts.

---

### 5. Copy Signup — UI entry point (`components/EventCard.tsx`)

Add "Copy signup" to the three-dot menu for **all events** (both published and drafts).

```tsx
<button
  type="button"
  role="menuitem"
  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
  onClick={handleCopy}
>
  Copy signup
</button>
```

`handleCopy` calls the existing copy API route (confirm route with Cursor — likely `POST /api/events/[id]/copy` or similar), then redirects to the edit page of the new draft:

```tsx
const handleCopy = async () => {
  setMenuOpen(false);
  try {
    const res = await fetch(`/api/events/${event.id}/copy`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to copy signup');
    const { eventId } = await res.json();
    router.push(`/dashboard/event/${eventId}/edit`);
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Could not copy signup');
  }
};
```

The copy lands on the **edit page** (not dashboard) so the organizer can immediately review and adjust before publishing. This is the right UX — don't dump them on the dashboard wondering where their copy went.

---

### 6. Edit Page — Draft banner (`app/dashboard/event/[id]/edit/page.tsx` + `EditEventForm.tsx`)

When the event being edited is a draft, show a banner at the top of the edit form:

```tsx
{!event.published && (
  <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 font-body">
        Draft
      </span>
      <p className="text-sm text-amber-800 font-body">
        This signup is not live yet. Publish it when you&apos;re ready.
      </p>
    </div>
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPublishing}
      className="ml-4 rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body shrink-0"
    >
      {isPublishing ? 'Publishing…' : 'Publish'}
    </button>
  </div>
)}
```

`handlePublish` in `EditEventForm` follows the same pattern as in `EventCard` — `PATCH /api/events/[id]` with `{ published: true }`, then `router.refresh()`.

---

### 7. Public Signup Page — Guard against draft access

Currently, if someone navigates directly to `/event/[id]` for a draft, `getEventWithSlots` (called with `publishedOnly: true` by default) returns null and the page returns 404 — which is correct behavior. **No change needed here** — verify this is the case and leave it.

---

## What is NOT in scope (v1)

- Unpublishing a live event (no "revert to draft")
- Draft preview link (shareable private URL to review before publishing)
- Auto-save / autosave draft
- Draft expiry or cleanup

---

## Files to Change

| File | Change |
|------|--------|
| `components/EventCard.tsx` | Add `published` prop, draft pill, conditional button row, Publish button, Copy menu item |
| `app/dashboard/page.tsx` | Pass `published` field to EventCard |
| `app/create-event/CreateEventForm.tsx` | Add "Save as Draft" button, `submitIntent` state |
| `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Add draft banner with inline Publish button |
| `app/api/events/[id]/route.ts` | Verify PATCH accepts `published: true` |
| (Confirm with Cursor) Copy API route | Ensure it exists and returns `{ eventId }` |

---

## QA Scenarios to Test After Implementation

1. **Create → Publish**: Create a signup, click Publish → goes live → public page loads
2. **Create → Save as Draft**: Create a signup, click Save as Draft → dashboard shows Draft pill → "Signup Page" button is hidden → "Publish" button is shown
3. **Draft → Publish from dashboard**: Click Publish on a draft card → card updates, "Signup Page" button appears
4. **Draft → Publish from edit page**: Open draft in edit, click Publish in banner → banner disappears, event goes live
5. **Copy a published event**: Three-dot menu → Copy signup → lands on edit page of draft copy with "Copy of [title]" title → Draft banner shown
6. **Copy a draft**: Same flow — works correctly
7. **Direct URL to draft**: Navigate to `/event/[draft-id]` while not signed in → 404 (not visible to public)
8. **Published event card**: No Draft pill, "Signup Page" button visible, no Publish button
