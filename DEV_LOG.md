# Dev Log

---

## 2026-04-20

### ✅ Features Completed & Shipped

- **Playwright E2E smoke test suite** (`e2e/`) — `staged, uncommitted`
  - `playwright.config.ts` — 3 projects (setup, chromium, volunteer), dotenv loading, auto dev server
  - `e2e/auth.setup.ts` — UI login → saves session to `e2e/.auth/organizer.json`
  - `e2e/organizer.smoke.ts` — dashboard, create/edit forms, back-button guard, signups table
  - `e2e/volunteer.smoke.ts` — public event page, draft 404, full signup flow, confirmation page
  - All tests passing ✅
- **`scripts/setup-local-user.ts`** — one-time local setup: upserts org + user + org_members — `untracked`
- **`LOCAL_DEV_GUIDE.docx`** — printable 1-page local dev cheat sheet — `untracked`
- **`AGENTS.md`** — added Dev Log section for auto-append on future sessions — `unstaged`

### 🤔 What Did I Learn?

- Local Supabase auth is a separate identity from production — user row can exist without org membership, causing silent failures that look like auth bugs
- Playwright doesn't auto-load `.env.local` — needs explicit `dotenv` call in `playwright.config.ts`
- Modal backdrop intercepts pointer events — always scope Playwright selectors to `getByRole('dialog')` before querying buttons inside modals

### 🧪 Tests: Written vs. Needed

**Written:** Full volunteer + organizer smoke suites (see above)

**Still needed:**
1. Slot availability decrements after signup
2. Duplicate email signup rejection
3. Published vs. draft visibility on public page
4. Cancel signup from organizer table
5. Cancel link on confirmation page works end-to-end

### 🔧 Work In Progress

- Playwright files staged but not committed — needs `git commit + push`
- Draft mode / copy signup — spec written, ship status unconfirmed
- Unsaved changes modal — spec written, ship status unconfirmed
- `FOUNDER_DIGEST_EMAIL` missing from Vercel env vars

### 📍 Resume Here

> **Open terminal in `/Users/allisonstone/Documents/signupsmartly`** and run:
> ```
> git add .
> git commit -m "Add Playwright E2E smoke test suite"
> git push origin main
> ```
> Then run `git log --oneline -10` to confirm whether draft mode + unsaved changes modal shipped in a prior session.

---
