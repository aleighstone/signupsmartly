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

## History

- SignupSmartly was originally created as a subfolder under `digitaleigh-dev`.
- That structure caused deploy issues (e.g. deploys seeing "no changes" because production was wired to the wrong repo).
- It has since been moved out and is now a standalone project. Do not assume or treat it as part of digitaleigh-dev.
