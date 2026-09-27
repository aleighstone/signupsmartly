# Wizard Implementation TODOs

Tracked items to address when building out the creation wizard.

---

## 1. Poll draft support

Availability polls currently skip the draft flow entirely — on submit they redirect straight to the dashboard/signups view, and the template-save modal is also skipped.

**What to do:** When implementing the wizard, add draft support for availability polls so they behave consistently with simple list and scheduled signups. This requires:
- Allowing polls to be saved in `draft` status
- Ensuring the publish step works the same way (wizard saves draft silently, user hits "Publish poll" to make it live)
- The "Save as draft" link on step 4 should work for polls just like it does for the other two types

---

## 2. Playwright tests for the creation wizard

Write end-to-end Playwright tests covering the full wizard flow for all three signup types.

**Suggested test cases per type:**
- Happy path: fill all required fields, publish, verify event appears in dashboard
- Required field validation: try to advance with missing required fields, verify errors
- Step navigation: back/forward, verify fields persist between steps
- Duplicate spot/date: use the copy button, verify card appears with same values
- Appearance: change color + font, verify they're reflected on the published event page
- Save as draft: verify event is created in draft state and not publicly visible
- Preview: verify preview opens the correct event page

**Scheduled-specific:**
- Both spot labeling modes ("Schedule + Spot name" vs "Schedule only")
- Date pre-fill behavior when adding a second spot on the same date

**Availability poll-specific:**
- Duplicate date+time combo validation (currently only checked on submit — consider real-time)

---

## 3. Remove the star from "Default" color

In `data/themes.ts` line 44, change:
```ts
{ key: 'default', name: 'Default ★', ... }
```
to:
```ts
{ key: 'default', name: 'Default', ... }
```

Small cosmetic fix agreed on during wizard design session.
