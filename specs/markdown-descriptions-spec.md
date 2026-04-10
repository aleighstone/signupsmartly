# Spec: Markdown Descriptions

## Overview

Organizers can format event and slot descriptions using a simple markdown
toolbar. This replaces the current plain `<textarea>` for both the event-level
description and the per-slot description/instructions field.

Formatting is stored as plain markdown text in the existing `TEXT` columns —
no schema changes required. Markdown is rendered safely on the public signup
page using `react-markdown` + `rehype-sanitize`.

---

## Motivation

- Organizers want line breaks, bold, and italics to make descriptions more
  readable (e.g. multi-item instructions, event logistics)
- Organizers want to link to external resources — Amazon wishlists, school
  supply lists, registration forms, etc. — without pasting raw URLs into the
  description

---

## Scope

### Event description
The top-level description field on the create and edit forms. Shown below the
event title/date/location on the public signup page.

- Markdown toolbar: bold, italic, link
- Live preview toggle
- No character limit

### Slot/item description
The "Instructions" field (scheduled events) and "Description" field (simple
list events). Shown below the slot name on the public signup page.

- Same markdown toolbar: bold, italic, link
- Live preview toggle
- **800 character limit**, enforced at the Zod validation layer with a
  visible character counter in the editor

---

## Editor component (`MarkdownEditor`)

A reusable component that wraps a `<textarea>` with a toolbar and optional
preview tab. Used in place of all plain `<textarea>` elements for description
fields.

### Toolbar buttons
- **B** — wraps selected text in `**...**` (bold). If no text is selected,
  inserts `**bold**` at cursor.
- **_I_** — wraps selected text in `*...*` (italic). If no text is selected,
  inserts `*italic*` at cursor.
- **Link** — if text is selected, prompts for a URL and inserts
  `[selected text](url)`. If no text is selected, inserts `[link text](url)`
  with both fields as placeholders.

### Preview tab
A toggle switches between "Write" (the textarea) and "Preview" (the rendered
markdown output). Preview renders using `react-markdown` with the same
configuration as the public signup page.

### Character counter
Shown when `maxLength` is provided. Displays `n / 800` below the textarea.
Counter text turns red when the organizer is within 50 characters of the limit.

### Props
```ts
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}
```

The component is a controlled input — it does not use `register()` directly.
Integrate with React Hook Form via `Controller`.

---

## Rendering on the public signup page

### Library stack
- `react-markdown` — renders markdown to React elements
- `rehype-sanitize` — strips disallowed HTML; prevents XSS via `javascript:`
  links or injected tags
- `remark-gfm` — enables GitHub Flavored Markdown (line breaks, etc.)

### All links open in a new tab
The `ReactMarkdown` component uses a custom `a` renderer:
```tsx
components={{
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}}
```

### Event description rendering (`EventHeader.tsx`)
Replace:
```tsx
<p className="text-muted text-sm leading-relaxed max-w-2xl font-body">
  {event.description}
</p>
```
With a `<ReactMarkdown>` block using the same prose classes, scoped with a
wrapper `<div>` so block elements render correctly.

### Slot description rendering (`SlotList.tsx`)
Replace:
```tsx
<p className="mt-1 text-sm text-muted line-clamp-2 font-body">
  {slot.role_description || slot.instructions}
</p>
```
With a `<ReactMarkdown>` block. **Remove `line-clamp-2`** — slot descriptions
are now shown in full. The 800-character limit keeps them from becoming walls
of text.

---

## Validation

Add `.max(800, 'Max 800 characters')` to the following Zod fields:

- `scheduledSlotSchema.instructions`
- `simpleSlotSchema.role_description`
- `EditEventForm` equivalents of both

The event-level `description` field has no character limit and does not change.

---

## Files to change

| File | Change |
|---|---|
| `package.json` | Add `react-markdown`, `rehype-sanitize`, `remark-gfm` |
| `components/MarkdownEditor.tsx` | **New file** — reusable editor component |
| `components/EventHeader.tsx` | Replace `<p>` with `<ReactMarkdown>` |
| `components/SlotList.tsx` | Replace `<p line-clamp-2>` with `<ReactMarkdown>` |
| `app/create-event/CreateEventForm.tsx` | Replace description + slot textareas with `<MarkdownEditor>` via `Controller`; add `.max(800)` to slot Zod schemas |
| `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Same replacements as create form |

---

## What is NOT changing

- Database schema — `description`, `instructions`, and `role_description` remain
  plain `TEXT` columns. Markdown is just a text convention.
- Existing plain-text descriptions — valid markdown, will render as-is.
  No migration needed.
- Volunteer-facing input fields — the comment/notes field volunteers fill out
  when signing up is not affected.
- Alignment choices — not supported in this version. Markdown does not have
  native text alignment. Can be revisited if demand warrants it.
