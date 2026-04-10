# Cursor Prompt: Widen Public Event Page on Desktop

## What to change

The public volunteer-facing event page (`/event/[id]`) is currently constrained
to `max-w-2xl` (672px), which looks like a phone screen on desktop and laptop
viewports. Widen it to `max-w-4xl` (896px) so the page uses available screen
space on larger screens.

This is a small, targeted change. Do not touch layout, structure, or styling
beyond what is described here.

---

## Step 1 — `app/event/[id]/page.tsx`

Find this div (it is the only outer wrapper in the file):

```tsx
<div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
```

Change `max-w-2xl` to `max-w-4xl`:

```tsx
<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
```

That is the only change in this file.

---

## Step 2 — `components/EventHeader.tsx`

The description paragraph has its own inner `max-w-2xl`:

```tsx
<p className="text-muted text-sm leading-relaxed max-w-2xl font-body">
  {event.description}
</p>
```

**Leave this `max-w-2xl` as-is.** Now that the outer container is wider,
this inner constraint correctly limits prose line length to a comfortable
reading width (~65–70 characters). Long lines of text are hard to read at
full container width. Do not remove or change it.

**Note:** If the markdown descriptions feature has already been implemented
and this `<p>` tag has been replaced with a `<ReactMarkdown>` block, the
same logic applies — keep whatever max-width constraint exists on the wrapper
div around the markdown output. If there is no max-width on the markdown
wrapper, add `max-w-2xl` to it.

---

## What NOT to change

- Do not change mobile layout — the page should look identical to today on
  small screens. The `max-w-4xl` container will simply be full-width on
  viewports narrower than 896px, same as before.
- Do not change `components/SlotList.tsx` — slot cards already use
  `sm:flex-row` and handle the extra width naturally. No slot layout changes.
- Do not change `components/CoverageMeter.tsx` — the coverage meter fills
  its container and will naturally benefit from the extra width.
- Do not change `AppLayout.tsx` — this only affects the public event page,
  not the organizer dashboard.
- Do not add a two-column slot grid — slots must remain in a single ordered
  column.
- Do not change any other pages — `/signup/*`, `/dashboard/*`, and other
  routes are not affected by this change.
