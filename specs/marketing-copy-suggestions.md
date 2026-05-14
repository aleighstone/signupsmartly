# Marketing Copy Suggestions
_For: `app/page.tsx` (homepage) and `app/use-cases/page.tsx`_
_Context: availability poll (3rd signup type) is coming. Copy should reflect that SignupSmartly handles both volunteer coordination AND group scheduling._

---

## Homepage (`app/page.tsx`)

### Hero h1 — replace the placeholder

**Current:**
> SignupSmartly - smarter than a genius

This is clearly a test/placeholder. Needs a real headline. Options ranked by feel:

| Option | Notes |
|---|---|
| **Coordinate volunteers. Find dates that work.** | Clean two-part value prop. Reads fast. Covers both use cases explicitly. ✅ Recommended |
| The simple way to organize volunteers and schedule your group | Slightly longer, more conversational |
| Signups and scheduling — without the group chat chaos | Punchier, leans into the pain point |
| Organize signups and find dates that work for everyone | Solid but a bit plain |

**Recommended:**
```
Coordinate volunteers. Find dates that work.
```

---

### Hero description — minor refresh

**Current:**
> A cleaner way to coordinate volunteer signups and group scheduling for community events, classrooms, and sports. Create, share a link.
> No ads, no clutter.

Good shape, a few tweaks to tighten and make the two use cases parallel:

**Suggested:**
> Create a volunteer signup or an availability poll, share one link, and let people respond in seconds. No account needed for participants. No ads. No clutter.

_Why: "volunteer signup or availability poll" makes both product types explicit from the first sentence. "Participants" is more accurate than "volunteers" for availability polls._

---

### Hero CTA — primary button

**Current:** "Create your first signup"

For scheduled/simple this is perfect. For an availability poll, "signup" is the product name, not just the concept — so it still works. **Leave as-is.**

---

### "For organizers" card

**Current:**
> Create events, define what you need, and share one link. See coverage at a glance and export rosters.

"Coverage" and "export rosters" don't apply to availability polls (you're not tracking a roster, you're finding the best date). Suggested version covers both:

**Suggested:**
> Create an event or availability poll, define what you need, and share one link. See who's responded, find the best date or fill your roster, and export when you're ready.

---

### "For volunteers" card

**Current:**
> View open slots, sign up in seconds, and get a confirmation email with a cancel link if plans change.

"Cancel link" only applies to scheduled/simple signups, not availability polls. "Open slots" doesn't apply to availability polls either. Make it generic enough to work for both:

**Suggested:**
> See what's open, respond in seconds, and get a confirmation email. No account needed — just click the link.

_Note: "cancel link" can stay mentioned on the specific use-cases page for scheduled/conference entries where it's a real feature._

---

### "How it works" section

**Current steps:**
1. **Create your signup** — "Add your event details, spots, times, and how many volunteers you need for each role or item."
2. **Share the link** — fine as-is
3. **Track coverage** — "Watch your roster fill in from the dashboard. Export to a spreadsheet or print before your event."

Steps 1 and 3 are scheduled-centric. The underlying flow (create → share → see results) applies to both. Suggested edits:

**Step 1 heading:** "Create your event or poll" _(was: "Create your signup")_

**Step 1 body:**
> Add dates and roles for a volunteer signup, or proposed dates for a group availability poll. Set how many people you need, or just let everyone weigh in.

**Step 2 heading:** "Share the link" _(unchanged)_

**Step 2 body:** _(unchanged — already generic)_

**Step 3 heading:** "See who responded" _(was: "Track coverage")_

**Step 3 body:**
> Watch signups fill your roster, or see which proposed date has the most availability. Export to a spreadsheet or print when you're ready.

---

### Use cases teaser section

**Current h2:**
> Works for sports teams, classrooms, clubs, and more

**Suggested:**
> Works for sports teams, classrooms, clubs, and groups of all kinds

_(adds "groups of all kinds" which covers the recurring-group/game-night use case)_

**Current body:** Already good — mentions "recurring group scheduling." No changes needed.

---

### Footer tagline

**Current:**
> SignupSmartly — coordination made simple.

This only mentions volunteers. Now that the product also handles group scheduling:

**Suggested:**
> SignupSmartly — coordinate signups and find dates that work.

Or, shorter:
> SignupSmartly — coordination made simple. ✅ **Preferred**

---

## Use Cases page (`app/use-cases/page.tsx`)

### Hero h1 — already good ✅

> Works for any volunteer coordination or group scheduling

No changes needed.

### Hero description — already good ✅

> Sports teams, classrooms, clubs, neighborhood groups — if you need people to sign up for something or find a date that works, SignupSmartly handles it. No account required. Just a link.

No changes needed.

### Hero badges — already good ✅

All three signup types represented with correct colors. No changes needed.

### Use case entries — status

| Entry | Status |
|---|---|
| Track meet volunteers | ✅ Good |
| Baseball snack duty | ✅ Good |
| Parent-teacher conferences | ✅ Good — mentions cancel link, which is accurate for this type |
| Book club & potluck | ✅ Good |
| Availability poll / mahjong | ✅ Copy good — **needs real screenshot** to replace placeholder |

### Bottom CTA

**Current:**
> Create your first signup

**Suggested** (to be more inclusive of availability polls):
> Get started free →

Or keep "Create your first signup" — the word "signup" refers to the product, not just the concept, so it arguably still works. Either is fine.

---

## Summary — changes by priority

| Priority | Page | Change |
|---|---|---|
| 🔴 Must fix | Homepage | h1 — replace "smarter than a genius" placeholder |
| 🔴 Must fix | Homepage | "For organizers" card — remove coverage/roster-only framing |
| 🟡 Should fix | Homepage | "For volunteers" card — remove cancel-link mention |
| 🟡 Should fix | Homepage | "How it works" — generalize steps 1 and 3 |
| 🟡 Should fix | Homepage | Hero description — make both use cases explicit |
| 🟢 Nice to have | Homepage | Footer tagline — update from volunteers-only |
| 🟢 Nice to have | Use cases | Bottom CTA — "Get started free →" vs "Create your first signup" |
| ⏳ Blocked | Use cases | Availability poll entry — replace placeholder screenshot after feature ships |
