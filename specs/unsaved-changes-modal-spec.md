# Unsaved Changes Modal — Product Spec

## Problem

When an organizer is filling out the create form or editing a signup, clicking "← Back to signups"
(edit) or navigating away (create) loses their work silently. We need a guard modal that gives them
a chance to save before leaving.

## Trigger Condition

Show the modal when **all three** are true:
1. The user clicks the "back" link/button in the form
2. The active form has `formState.isDirty === true` (React Hook Form tracks this automatically —
   it compares current values against `defaultValues`)
3. The form has not just been successfully submitted

If `isDirty` is false (form is pristine), navigate immediately with no modal.

---

## Modal Content

### Edit form — event is already published (`event.published === true`)

```
Title:   You have unsaved changes
Body:    Your edits haven't been saved yet.

[  Publish  ]   [  Discard changes  ]
```

"Publish" = submit the edit form (save changes to the live event), then navigate back.
"Discard changes" = navigate back without saving.

### Edit form — event is a draft (`event.published === false`)

```
Title:   You have unsaved changes
Body:    Your draft hasn't been saved yet.

[  Save  ]   [  Discard changes  ]
```

"Save" = submit the edit form (persist the draft as-is), then navigate back.
"Discard changes" = navigate back without saving.

### Create form — new event (no event in DB yet)

```
Title:   You have unsaved changes
Body:    Your signup hasn't been saved yet.

[  Publish  ]   [  Save as Draft  ]   [  Discard  ]
```

Three options because both save paths are valid from the create form.
"Publish" = submit the form with `published: true`, then navigate to dashboard.
"Save as Draft" = submit the form with `published: false`, then navigate to dashboard.
"Discard" = navigate to dashboard without saving.

---

## Implementation

### Shared `UnsavedChangesModal` component

Create `components/UnsavedChangesModal.tsx`. This is a pure presentational modal — it receives
callbacks for each action. It does not know about forms or routing.

```tsx
// components/UnsavedChangesModal.tsx
'use client';

type UnsavedChangesModalProps = {
  isOpen: boolean;
  variant: 'published' | 'draft' | 'create';
  isSaving: boolean;
  onPrimary: () => void;      // "Publish" or "Save"
  onSaveAsDraft?: () => void; // create variant only
  onDiscard: () => void;
  onCancel: () => void;       // closes modal, stays on page
};
```

Modal styles should match the existing modals in the app (centered, backdrop blur, rounded-xl card).
The backdrop click and Escape key should call `onCancel` (stay on page — don't discard).

Primary button: `btn-primary` (sage green)
Secondary buttons: `btn-secondary` (bordered)
Discard button: text in `text-coral` or `text-red-600` to signal destructive action

---

### Edit form changes (`app/dashboard/event/[id]/edit/EditEventForm.tsx`)

**1. Move the back link into EditEventForm.**

Remove the `← Back to signups` `<Link>` from `page.tsx`. Replace with a prop or move it entirely
into `EditEventForm` as a `<button>` that intercepts navigation:

```tsx
// Inside EditEventForm — replaces the <Link> that was in page.tsx
const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
const [isSavingFromModal, setIsSavingFromModal] = useState(false);

const handleBackClick = () => {
  const isDirty = simple
    ? simpleForm.formState.isDirty
    : scheduledForm.formState.isDirty;

  if (!isDirty) {
    router.push(`/dashboard/event/${event.id}/signups`);
    return;
  }
  setUnsavedModalOpen(true);
};
```

Render in the form JSX (at top, where the back link was):
```tsx
<button
  type="button"
  onClick={handleBackClick}
  className="text-sm text-muted hover:text-charcoal transition-colors font-body"
>
  ← Back to signups
</button>
```

**2. Modal action handlers.**

```tsx
const handleModalSave = async () => {
  setIsSavingFromModal(true);
  try {
    if (simple) {
      await simpleForm.handleSubmit(onSubmitSimple)();
    } else {
      await scheduledForm.handleSubmit(onSubmitScheduled)();
    }
    // onSubmitSimple / onSubmitScheduled already call router.push on success
  } finally {
    setIsSavingFromModal(false);
    setUnsavedModalOpen(false);
  }
};

const handleModalDiscard = () => {
  setUnsavedModalOpen(false);
  router.push(`/dashboard/event/${event.id}/signups`);
};
```

**3. Render the modal.**

```tsx
<UnsavedChangesModal
  isOpen={unsavedModalOpen}
  variant={event.published ? 'published' : 'draft'}
  isSaving={isSavingFromModal}
  onPrimary={handleModalSave}
  onDiscard={handleModalDiscard}
  onCancel={() => setUnsavedModalOpen(false)}
/>
```

**4. Update `page.tsx`.**

Remove the `<Link href=".../signups">← Back to signups</Link>` block entirely from `page.tsx`.
`EditEventForm` renders its own back button now.

---

### Create form changes (`app/create-event/CreateEventForm.tsx`)

**1. Add an explicit "← Back to Dashboard" back link/button.**

The create form currently has no back link. Add one at the top of the form's rendered output
(just above the "I want to…" signup type selector):

```tsx
<button
  type="button"
  onClick={handleBackClick}
  className="text-sm text-muted hover:text-charcoal transition-colors font-body"
>
  ← Back to Dashboard
</button>
```

**2. Dirty state detection in create form.**

The create form has two active forms depending on `signupType`. Use whichever is active:

```tsx
const handleBackClick = () => {
  const isDirty = signupType === 'scheduled'
    ? scheduledForm.formState.isDirty
    : simpleForm.formState.isDirty;

  if (!isDirty) {
    router.push('/dashboard');
    return;
  }
  setUnsavedModalOpen(true);
};
```

Note: `signupType === 'template'` — if the template picker is showing and no form is dirty,
just navigate away (no modal needed).

**3. Modal state.**

```tsx
const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
const [isSavingFromModal, setIsSavingFromModal] = useState(false);
const [modalSaveIntent, setModalSaveIntent] = useState<'publish' | 'draft'>('publish');
```

**4. Modal action handlers.**

```tsx
const handleModalPublish = async () => {
  setModalSaveIntent('publish');
  setIsSavingFromModal(true);
  setSubmitIntent('publish');
  try {
    if (signupType === 'scheduled') {
      await scheduledForm.handleSubmit(onSubmitScheduled)();
    } else {
      await simpleForm.handleSubmit(onSubmitSimple)();
    }
    // onSubmit handlers call setSaveModalOpen(true) on success; 
    // the SaveAsTemplate modal will fire and then goToDashboard()
  } finally {
    setIsSavingFromModal(false);
    setUnsavedModalOpen(false);
  }
};

const handleModalSaveAsDraft = async () => {
  setSubmitIntent('draft');
  setIsSavingFromModal(true);
  try {
    if (signupType === 'scheduled') {
      await scheduledForm.handleSubmit(onSubmitScheduled)();
    } else {
      await simpleForm.handleSubmit(onSubmitSimple)();
    }
  } finally {
    setIsSavingFromModal(false);
    setUnsavedModalOpen(false);
  }
};

const handleModalDiscard = () => {
  setUnsavedModalOpen(false);
  router.push('/dashboard');
};
```

**5. Render the modal.**

```tsx
<UnsavedChangesModal
  isOpen={unsavedModalOpen}
  variant="create"
  isSaving={isSavingFromModal}
  onPrimary={handleModalPublish}
  onSaveAsDraft={handleModalSaveAsDraft}
  onDiscard={handleModalDiscard}
  onCancel={() => setUnsavedModalOpen(false)}
/>
```

---

## What is NOT in scope

- Intercepting browser back button / `popstate` events — this requires `useEffect` + `beforeunload`
  and Next.js App Router doesn't expose router guards natively. Can be added later if needed.
- Intercepting the Logo link in AppNav — global state across components is complex. Users navigating
  via the logo are making an intentional decision and browser's built-in "Leave site?" prompt is an
  acceptable fallback.
- Auto-saving / saving on interval

### Optional: browser `beforeunload` guard

If the team wants to also catch browser tab closes / hard navigation, add this effect to both forms:

```tsx
useEffect(() => {
  const isDirty = simple ? simpleForm.formState.isDirty : scheduledForm.formState.isDirty;
  if (!isDirty) return;

  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [simple, simpleForm.formState.isDirty, scheduledForm.formState.isDirty]);
```

This triggers the browser's native "Leave site? Changes you made may not be saved." prompt.
It doesn't replace the custom modal — it's an additional catch for tab close / hard refresh.

---

## Files to Change

| File | Change |
|------|--------|
| `components/UnsavedChangesModal.tsx` | **New file** — shared modal component |
| `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Add `handleBackClick`, modal state, render `UnsavedChangesModal` with `← Back to signups` button |
| `app/dashboard/event/[id]/edit/page.tsx` | Remove `← Back to signups` Link (EditEventForm owns it now) |
| `app/create-event/CreateEventForm.tsx` | Add `← Back to Dashboard` button, `handleBackClick`, modal state, render `UnsavedChangesModal` |

---

## QA Scenarios

1. **Edit, pristine form → back**: Click back with no changes → navigates immediately, no modal
2. **Edit, dirty form, published → back**: Change title, click back → modal with "Publish" / "Discard"
3. **Edit, dirty form, published → Publish**: Modal "Publish" → saves changes, navigates back
4. **Edit, dirty form, published → Discard**: Modal "Discard changes" → navigates back, changes lost
5. **Edit, dirty form, published → Cancel (backdrop/Escape)**: Modal closes, stays on edit page
6. **Edit, dirty form, draft → back**: Change title, click back → modal with "Save" / "Discard"
7. **Edit, dirty form, draft → Save**: Modal "Save" → saves draft, navigates back
8. **Create, pristine form → back**: Click back with nothing typed → navigates immediately, no modal
9. **Create, dirty form → back**: Type a title, click back → modal with "Publish" / "Save as Draft" / "Discard"
10. **Create, dirty form → Publish**: Modal "Publish" → creates event as published, SaveAsTemplate modal fires
11. **Create, dirty form → Save as Draft**: Modal "Save as Draft" → creates draft, SaveAsTemplate modal fires
12. **Create, dirty form → Discard**: Modal "Discard" → navigates to dashboard, no event created
