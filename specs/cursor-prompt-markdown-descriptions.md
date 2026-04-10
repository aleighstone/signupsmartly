# Cursor Prompt: Markdown Descriptions

## What to build

Add markdown formatting support to event and slot description fields. Organizers
get a simple toolbar (bold, italic, link) with a preview toggle. Markdown
renders on the public signup page. All external links open in a new tab.

This is a UI-only change. No database schema changes are needed — markdown is
stored as plain text in the existing `TEXT` columns.

---

## Install dependencies

```bash
npm install react-markdown rehype-sanitize remark-gfm
```

---

## Step 1 — Create `components/MarkdownEditor.tsx`

Build a reusable controlled input component. Do NOT use `register()` — it will
be wired into React Hook Form via `Controller`.

### Props
```ts
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;  // show character counter when provided
  rows?: number;       // default 3
}
```

### Behavior

**Toolbar buttons (rendered above the textarea in Write mode):**

- **B** — bold. If text is selected in the textarea, wrap it: `**selected**`.
  If nothing is selected, insert `**bold**` at cursor position.
- **_I_** — italic. Same logic, wrap with single asterisk: `*selected*`.
- **Link** — if text is selected, call `window.prompt('URL:')` and insert
  `[selected text](url)`. If nothing is selected, insert `[link text](url)`
  literally so the organizer can fill both parts in.

Use `textareaRef` + `selectionStart`/`selectionEnd` to read selected text and
restore cursor position after insertion.

**Write / Preview toggle:**

Two tab buttons above the toolbar: "Write" and "Preview". In Write mode show
the toolbar and textarea. In Preview mode hide the textarea, show a rendered
markdown preview using `react-markdown` with `rehype-sanitize` and `remark-gfm`.
The preview div should have the same width/min-height as the textarea so the
layout doesn't jump.

**Character counter:**

Only shown when `maxLength` is provided. Display below the textarea:
`{value.length} / {maxLength}`. When within 50 characters of the limit, turn
the counter text red (`text-coral`).

**Styling:**

Match existing textarea styles exactly:
```
className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
```

Toolbar buttons should be small, use `text-xs font-medium`, and sit in a
tight row above the textarea. They do not need icons — text labels "B", "I",
"Link" are fine. Use a light border to separate the toolbar area from the
textarea visually.

---

## Step 2 — Update `components/EventHeader.tsx`

Replace the plain `<p>` tag that renders `event.description` with
`react-markdown`:

**Before:**
```tsx
{event.description && (
  <p className="text-muted text-sm leading-relaxed max-w-2xl font-body">
    {event.description}
  </p>
)}
```

**After:**
```tsx
{event.description && (
  <div className="text-muted text-sm leading-relaxed max-w-2xl font-body prose prose-sm max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
            {children}
          </a>
        ),
      }}
    >
      {event.description}
    </ReactMarkdown>
  </div>
)}
```

---

## Step 3 — Update `components/SlotList.tsx`

Replace the slot description `<p>` with `react-markdown`. Remove `line-clamp-2`
entirely — slot descriptions are shown in full.

**Before:**
```tsx
{(slot.role_description || slot.instructions) && (
  <p className="mt-1 text-sm text-muted line-clamp-2 font-body">
    {slot.role_description || slot.instructions}
  </p>
)}
```

**After:**
```tsx
{(slot.role_description || slot.instructions) && (
  <div className="mt-1 text-sm text-muted font-body prose prose-sm max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
            {children}
          </a>
        ),
      }}
    >
      {slot.role_description || slot.instructions}
    </ReactMarkdown>
  </div>
)}
```

---

## Step 4 — Update `app/create-event/CreateEventForm.tsx`

### 4a — Event description fields (scheduled + simple forms)

There are two event-level description textareas — one in the scheduled form
block and one in the simple form block (search for
`scheduledForm.register('description')` and `simpleForm.register('description')`).

Replace each bare `<textarea>` with a `<Controller>`-wrapped `<MarkdownEditor>`:

```tsx
<Controller
  control={scheduledForm.control}
  name="description"
  render={({ field }) => (
    <MarkdownEditor
      value={field.value ?? ''}
      onChange={field.onChange}
      placeholder="optional"
      rows={3}
    />
  )}
/>
```

Do the same for `simpleForm.control` / `simpleForm.register('description')`.

### 4b — Slot description fields

**Scheduled slots** use `slots.${index}.instructions`:
```tsx
<Controller
  control={scheduledForm.control}
  name={`slots.${index}.instructions`}
  render={({ field }) => (
    <MarkdownEditor
      value={field.value ?? ''}
      onChange={field.onChange}
      placeholder="Any notes for volunteers"
      maxLength={800}
      rows={2}
    />
  )}
/>
```

**Simple list slots** use `slots.${index}.role_description`:
```tsx
<Controller
  control={simpleForm.control}
  name={`slots.${index}.role_description`}
  render={({ field }) => (
    <MarkdownEditor
      value={field.value ?? ''}
      onChange={field.onChange}
      placeholder="optional"
      maxLength={800}
      rows={2}
    />
  )}
/>
```

### 4c — Add Zod validation

In `scheduledSlotSchema`:
```ts
instructions: z.string().max(800, 'Max 800 characters').optional(),
```

In `simpleSlotSchema`:
```ts
role_description: z.string().max(800, 'Max 800 characters').optional(),
```

---

## Step 5 — Update `app/dashboard/event/[id]/edit/EditEventForm.tsx`

Apply the same changes as Step 4:

- Replace event description textareas with `<Controller>`-wrapped
  `<MarkdownEditor>` (no `maxLength`)
- Replace slot description textareas with `<Controller>`-wrapped
  `<MarkdownEditor>` with `maxLength={800}`
- Add `.max(800, 'Max 800 characters')` to both slot Zod schemas in this file

Search for `form.register('description')`,
`form.register(\`slots.${index}.role_description\`)`, and
`form.register(\`slots.${index}.instructions\`)` to find all instances.

---

## Important constraints

- **All links must open in a new tab.** Always use `target="_blank" rel="noopener noreferrer"` on the custom `a` component in every `ReactMarkdown` usage. This is non-negotiable.
- **Do not add alignment controls.** Markdown does not support text alignment. Do not add any CSS or custom syntax for it.
- **Do not change the database schema.** Markdown is stored as plain text. No new columns, no type changes.
- **Do not add a character limit to the event-level description field.** Only slot descriptions are capped at 800.
- **Existing plain-text descriptions must render correctly.** Plain text is valid markdown — no migration or backfill is needed.
- **The `MarkdownEditor` component must be a client component** (`'use client'`). The forms it's used in are already client components, so no architecture change is needed.
