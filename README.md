# SignupSmartly

A modern, ad-free alternative to SignupGenius for coordinating volunteer roles and time slots. Mobile-first, fast, and easy for volunteers—powerful but simple for organizers.

## Features

- **No account required for volunteers** — Sign up with name and email; manage via secure links
- **Open slots first** — Volunteers see what help is needed immediately; filled roles collapsed
- **Volunteer coverage meter** — Organizers see fill percentage at a glance
- **Volunteer recap generator** — One-click copy/share for thanking volunteers
- **CSV export** — Export roster for spreadsheets

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres)
- **Email:** Resend
- **Validation:** Zod, React Hook Form
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Resend account (for confirmation emails)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20240310000001_initial_schema.sql`
3. Enable Email auth in Authentication → Providers
4. Copy your project URL and anon key

### 3. Set up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your domain (or use onboarding@resend.dev for testing)
3. Create an API key

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=SignupSmartly <noreply@yourdomain.com>

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
/app
  /event/[id]        — Public event signup page
  /signup/confirm    — Volunteer confirmation
  /signup/cancel     — Cancel signup (via email link)
  /dashboard         — Organizer dashboard
  /dashboard/event/[id]/roster — Roster + CSV + recap
  /create-event      — Create event and slots
  /login, /signup    — Organizer auth

/components
  EventHeader, SlotList, SignupForm, SignupModal, CoverageMeter, AppLayout

/lib
  supabase.ts, supabase-server.ts — DB clients
  db.ts — Data access
  email.ts — Resend
  calendar.ts — Date formatting

/types
  database.ts — Supabase types
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## License

MIT
