# Bug Fix: React Hydration Errors on Public Event Page

## Problem

The public event page (`/event/[id]`) throws 8 React hydration errors on every load:

- React error #425 (×6) — Text content mismatch between server and client
- React error #418 (×1) — Error while hydrating
- React error #423 (×1) — Failed to restore server-rendered data

These appear in production (`signupsmartly.com`) on every visit to a public event page.

## Root Cause

The previous attempt at a fix moved theme CSS injection into `app/event/[id]/head.tsx`.
This approach does not work in **Next.js 14 App Router**. The `head.js` special file was
deprecated in Next.js 13.2 and is not processed by the App Router in Next.js 14. As a
result `head.tsx` is dead code — the router silently ignores it — and the theme CSS
variables are never injected.

Meanwhile, whatever mechanism was originally injecting the theme CSS (before the `head.tsx`
refactor) may still be partially running in a way that causes a server/client render
discrepancy, producing the hydration mismatches.

## The Fix

### Step 1 — Delete `app/event/[id]/head.tsx`

This file does nothing in Next.js 14. Remove it entirely to eliminate confusion.

### Step 2 — Inject theme CSS directly in `app/event/[id]/page.tsx`

In the server component, call `buildVolunteerFacingThemeHead(eventData.theme)` and render
the resulting CSS as a `<style>` tag at the very top of the page JSX — before any themed
component renders. CSS `:root {}` variables work correctly from a `<style>` tag anywhere
in the document, not just inside `<head>`.

```tsx
// app/event/[id]/page.tsx
import { buildVolunteerFacingThemeHead } from '@/data/themes';

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const eventData = await getEventWithSlots(id);
  if (!eventData) notFound();

  const { themeStyleCss } = buildVolunteerFacingThemeHead(eventData.theme);

  // ... rest of existing data fetching ...

  return (
    <main className="min-h-screen bg-sand">
      {/* Inject theme CSS variables at the top — consistent on server and client */}
      <style dangerouslySetInnerHTML={{ __html: themeStyleCss }} />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* ... existing JSX unchanged ... */}
      </div>
    </main>
  );
}
```

### Step 3 — Inject Google Fonts via `generateMetadata`

Add or update `generateMetadata` in `page.tsx` to include the per-event Google Fonts
stylesheet as a link tag:

```tsx
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const eventData = await getEventWithSlots(id);
  if (!eventData) return {};

  const { fontsUrl } = buildVolunteerFacingThemeHead(eventData.theme);

  return {
    other: {
      // Preconnect hints
      'link:preconnect-googleapis': '<link rel="preconnect" href="https://fonts.googleapis.com">',
    },
    // Next.js supports injecting arbitrary link tags via metadata icons or verification fields,
    // but the cleanest way for a stylesheet is to add it in the layout or use a <link> tag
    // directly in the page JSX (acceptable since it still works outside <head> in modern browsers).
  };
}
```

**Note on fonts:** If `generateMetadata` doesn't support injecting a `<link rel="stylesheet">`
directly, place the Google Fonts `<link>` tag inline in the page JSX alongside the `<style>`
tag — same location, same approach:

```tsx
<>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href={fontsUrl} rel="stylesheet" />
  <style dangerouslySetInnerHTML={{ __html: themeStyleCss }} />
</>
```

This is the same HTML output that `head.tsx` was attempting to produce — just moved into
the page body where Next.js 14 actually renders it consistently.

## Why This Fixes Hydration

`page.tsx` is a **Server Component**. It fetches `eventData` and renders the `<style>` tag
server-side. When React hydrates on the client, it walks the same server-rendered DOM and
finds the same `<style>` tag with the same content — no mismatch. There is no client-side
dynamic injection involved.

## Verification

1. Deploy and hard-refresh `/event/a4b2bbc8-48cc-4452-b415-9a05c5242bb6`
2. Open browser DevTools → Console — should show **zero** React errors
3. Confirm themed text (custom font, colored "Sign up" buttons) still renders correctly
4. Confirm no visual regressions on the public event page for default-theme events
