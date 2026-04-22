# SignupSmartly – Agent Notes

## Clarifying questions

- **When the user says something contradictory or confusing**, ask a clarifying question before making changes. Do not assume intent — e.g. if they mix up terms like "privacy" vs "terms" or give conflicting instructions, pause and confirm what they mean before proceeding.

## Front-end standards

- Act as a **professional front-end engineer** on all UI work.
- Always respect the **design system**: colors (charcoal, muted, sage, coral, surface, sand), typography (font-heading, font-body), spacing (consistent padding, gaps), borders (charcoal/10, charcoal/20), shadows (shadow-soft, shadow-soft-md).
- Ensure **A+ UI and UX**: consistent sizing, alignment, focus states, and clear visual hierarchy. Form fields, buttons, and interactive elements should feel cohesive and polished.

## Date and time display (mandatory)

**Never violate this.** Organizer-entered dates and times must display **exactly as stored**. No timezone conversion.

The app stores two shapes of values:

1. **Calendar dates** — `YYYY-MM-DD` strings (e.g. `"2026-05-01"`). These express **organizer intent**, not UTC instants. When displaying, parse **year, month, and day as integers** from the string and build the label from those parts. **Do not** use `new Date("2026-05-01")` for display: that parses as UTC midnight and can show as the **previous calendar day** in US timezones.
2. **Slot timestamps** — ISO strings in UTC (e.g. `"2026-05-01T14:30:00Z"`). For display, use `Intl.DateTimeFormat` with **`timeZone: 'UTC'`** so volunteers see the stored clock time as-is, with no local-timezone shift.

## Project context

- **SignupSmartly is an independent project.** It has nothing to do with `digitaleigh-dev`.
- **Project path:** `/Users/allisonstone/Documents/signupsmartly`
- SignupSmartly has its **own git repository** and deploys from this repo, not from digitaleigh-dev.

## Deployment

- **Always share the deploy commands** after making changes so the user can push to production.
- **Setup:** GitHub + Vercel. Pushing to `main` triggers auto-deploy. Remote is `origin`.
- **Commands to give after changes** (with a suggested commit message tailored to the work):

  ```
  npm run build
  git add .
  git commit -m "Your suggested message here"
  git push origin main
  ```

## Shell and Git (zsh)

- **Bracket segments in paths are globs.** In zsh, a path like `app/dashboard/event/[id]/edit/EditEventForm.tsx` treats `[id]` as a character class; if it doesn’t match files, the shell errors **`zsh: no matches found`** before `git` runs — nothing gets staged and `git push` may look “up to date” with no deploy.
- **Fix:** Quote the path (`git add 'app/dashboard/event/[id]/edit/EditEventForm.tsx'`), escape the brackets, use **`git add -u`** / **`git add .`** from the repo root, or **`noglob git add ...`** when listing paths literally.

## Running Playwright tests

Before giving any `npm run test:e2e` command, always remind the user to have both of these running first:
1. `supabase start` (Terminal 1)
2. `npm run dev` (Terminal 2)

Then run tests in a third terminal. Never give the test command without this reminder.

## Production database migrations (Supabase SQL Editor)

**Typical workflow:** schema changes for **production** are applied in the **Supabase Dashboard → SQL Editor**, not via `supabase db push` to the linked remote.

**Why:** the project’s `schema_migrations` history on the hosted project can be **out of sync** with the files under `supabase/migrations/` (older changes may have been applied manually or before migration tracking). A bulk CLI push can try to replay migrations that are already live and fail or cause confusion.

**Going forward — for agents and humans:**

1. **Still add a migration file** in `supabase/migrations/` for every schema change (timestamp prefix, descriptive name). Commit it with the app code so the repo stays the **source of truth** for *what* changed, and local `supabase db reset` / teammates can replay history when needed.
2. **Production:** open that new `.sql` file, copy its contents, run in **Supabase → SQL Editor** on the **production** project, and confirm success (no errors).
3. **Do not** tell the user to run `supabase db push` against **production** unless they have explicitly verified migration history matches and want to use the CLI for prod (unusual here).
4. **Optional check after running SQL:** confirm the change (e.g. new column, constraint, or enum values) in **Table Editor** or with a quick `SELECT` / `\d`-style inspection in SQL Editor.

**Local:** continue using `supabase db reset`, `supabase migration up`, or seed scripts as documented elsewhere in this file; local CLI history may differ from hosted prod—that’s expected with this workflow.

## Local development environment

- **Local Supabase is running** via the Supabase CLI and Docker Desktop. Do not hardcode `https://www.signupsmartly.com` or any Supabase production URL in scripts or seed files — always read from `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_APP_URL`.
- **Local app URL** is `http://localhost:3000` (Next.js may use 3001 if 3000 is busy — use whatever port `npm run dev` prints).
- **Local Supabase Studio** (DB browser) is at `http://127.0.0.1:54323`.
- **Mailpit** (catches auth emails locally) is at `http://127.0.0.1:54324`. Auth emails do not send for real locally.
- **Resend emails** (confirmations, NPS, notifications) will fail silently in local dev — this is expected and acceptable.
- To reset the local DB to a clean state: `supabase db reset && npm run seed-demo`.

## Auth / signup changes

- **When modifying any code related to new user creation or sign-in** (e.g. signup flow, login, auth callback, sync-user, ensure-user-org), remind the user to run automated smoke tests with Claude QA before deploying.

## Learned User Preferences

- User expects deploy/build commands to be provided after making code changes, often explicitly asking for them.
- User prefers polished, professional front-end UI with careful spacing/alignment and consistency with the design system.
- User does not want timezone translation in signup scheduling; see **Date and time display (mandatory)** above.

## Learned Workspace Facts

- Always work in the main repo at `/Users/allisonstone/Documents/signupsmartly`. Do not use or create worktrees; all edits must go to main.
- Project uses a Vercel Hobby plan, so scheduled functions/cron jobs can only run once per day; reminder and background processing requirements must respect this limit.
- Project uses a free Resend plan; when writing new email-related requirements, keep email volume modest and avoid designs that assume high-frequency or bulk email sending.

## Dev Log

- A running session log lives at `DEV_LOG.md` in the project root.
- **At the end of every session**, append a new dated entry summarizing: what was completed, any bugs fixed, and backlog items carried forward.
- Format: `## YYYY-MM-DD` heading, `### Completed` and `### Backlog` sections.

## History

- SignupSmartly was originally created as a subfolder under `digitaleigh-dev`.
- That structure caused deploy issues (e.g. deploys seeing "no changes" because production was wired to the wrong repo).
- It has since been moved out and is now a standalone project. Do not assume or treat it as part of digitaleigh-dev.
