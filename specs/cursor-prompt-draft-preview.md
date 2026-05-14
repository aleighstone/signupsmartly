# Cursor Prompt: Draft Preview

## What we're building

Organizers can preview their own draft signup page before publishing — seeing exactly what a volunteer will see. The preview surfaces in two places: the edit form and after saving a draft in the create form.

**No new routes. No new DB queries.** The existing `/event/[id]` page already renders the full event UI. We're adding an auth check so organizers can see their own drafts there, a "Draft Preview" banner so the context is clear, and two "Preview ↗" buttons to reach it.

---

## Step 1 — Make `/event/[id]` serve drafts to the organizer

**File: `app/event/[id]/page.tsx`**

### 1a. Get the authenticated user

At the top of the server component, import and call the Supabase server client to get the session:

```ts
import { createClient } from '@/lib/supabase-server';

// inside the component:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### 1b. Fetch with draft awareness

Replace the current `getEventWithSlots(id)` call with logic that allows the organizer to see their own draft:

```ts
// Try fetching published-only first (the normal path)
let eventData = await getEventWithSlots(id);

// If not found (could be a draft), check if the viewer is the organizer
if (!eventData && user) {
  const draft = await getEventWithSlots(id, { publishedOnly: false });
  if (draft && draft.organizer_id === user.id) {
    eventData = draft;
  }
}

if (!eventData) return notFound();
```

This keeps the default behavior unchanged for all non-organizer visitors.

### 1c. Pass `isDraftPreview` to the client component

Add a prop to `EventPageClient`:

```ts
const isDraftPreview = !!eventData && !eventData.published;

// in the JSX:
<EventPageClient event={eventData} isDraftPreview={isDraftPreview} ... />
```

---

## Step 2 — Add the Draft Preview banner

**File: `app/event/[id]/EventPageClient.tsx`**

Add `isDraftPreview?: boolean` to the component's props.

When `isDraftPreview` is true, render a sticky banner **above** the `<EventHeader>`:

```tsx
{isDraftPreview && (
  <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-body">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Draft
      </span>
      <span className="text-amber-800">
        This is a preview — volunteers can't see this yet.
      </span>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <a
        href={`/dashboard/event/${event.id}/edit`}
        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
      >
        ← Edit
      </a>
    </div>
  </div>
)}
```

**Rules:**
- Banner is sticky so it stays visible when the volunteer scrolls through the form
- "← Edit" navigates back to the edit form
- Do NOT show a Publish button here — the organizer should publish from the edit form, not the preview
- The rest of the page renders exactly as a volunteer would see it — no other changes

---

## Step 3 — Add "Preview ↗" to the edit form draft banner

**File: `app/dashboard/event/[id]/edit/EditEventForm.tsx`**

The draft banner (around line 531–549) currently shows "Publish" and the "not live yet" message. Add a "Preview ↗" link next to the Publish button:

Find the existing Publish button inside the draft banner and add the Preview link alongside it:

```tsx
<div className="flex items-center gap-2">
  {/* existing Publish button — unchanged */}
  <button onClick={handlePublish} ...>
    Publish
  </button>
  {/* NEW: Preview link */}
  <a
    href={`/event/${event.id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 rounded-lg border border-charcoal/20 bg-white px-3 py-1.5 text-sm font-medium text-charcoal hover:bg-sand font-body"
  >
    Preview ↗
  </a>
</div>
```

Opens the event page in a new tab. Since the organizer is authenticated, Step 1 will serve the draft with the preview banner.

---

## Step 4 — Add "Preview draft ↗" to the create form success flow

**File: `app/create-event/CreateEventForm.tsx`**

After saving as a draft, the form shows `SaveAsTemplateModal` (or for availability polls, redirects directly). The redirect in `goToDashboard` currently goes to `/dashboard`.

**Change: after saving as a draft**, redirect to the edit page instead of the dashboard. This naturally surfaces the Preview button we added in Step 3.

Find where `goToDashboard` is called after a draft save. The save handlers set `setSaveModalOpen(true)` and then `goToDashboard` runs after the modal is dismissed. The event ID comes from the API response.

**4a.** Store the new event ID from the API response in a ref:

```ts
const newEventIdRef = useRef<string | null>(null);
```

**4b.** In each form submit handler, after the API call succeeds and before `setSaveModalOpen(true)`, set:

```ts
newEventIdRef.current = json.id;
```

**4c.** Modify `goToDashboard` to go to the edit page after a draft save:

```ts
const goToDashboard = () => {
  if (submitIntentRef.current === 'draft' && newEventIdRef.current) {
    router.push(`/dashboard/event/${newEventIdRef.current}/edit`);
  } else {
    router.push('/dashboard');
  }
};
```

**Result:** Save as Draft → SaveAsTemplateModal → dismiss → land on edit form → amber draft banner with "Preview ↗" and "Publish" → preview opens in new tab with the preview banner.

**Note for availability polls:** The availability poll flow already redirects to `/dashboard/event/${json.id}/signups` instead of going through SaveAsTemplateModal. For drafts, change that redirect to `/dashboard/event/${json.id}/edit` as well.

---

## What does NOT change

- Published events are not affected — no banner, same experience for volunteers
- Archived events still 404 (archived check happens before the draft check)
- The reminder system, email flow, and all other features are untouched
- Non-organizer visitors to a draft URL still get 404

---

## Constraints

- Do not add a "Publish" button to the preview banner on the event page — keep publishing in the edit form only. The preview is read-only.
- The preview banner must be sticky so the organizer doesn't lose context while scrolling through the form.
- Do not modify `SlotList.tsx`, `SignupModal.tsx`, or any volunteer-facing components — the preview should render them exactly as they are.

---

## Running tests

After implementing:

```bash
npm run build
```

Then before running Playwright, remind user:
1. `supabase start` (Terminal 1)
2. `npm run dev` (Terminal 2)

Then:
```bash
npx playwright test --project=chromium
```

All existing tests must still pass. Consider adding a manual smoke test:
1. Create a new draft event
2. Confirm you land on the edit form
3. Click "Preview ↗" — confirm it opens the event page with the amber banner
4. Confirm a logged-out user visiting the same URL gets 404
5. Publish from the edit form — confirm the banner disappears for the published event
