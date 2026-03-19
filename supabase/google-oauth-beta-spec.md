# Google OAuth — Beta Implementation Spec
**Feature:** Sign in / Sign up with Google
**Approach:** Parallel beta pages (`/signup-beta`, `/login-beta`) — no changes to production paths until tested and promoted
**Date:** 2026-03-19

---

## Overview

Add "Continue with Google" to the organizer account creation and sign-in flows. The implementation runs as a parallel beta at `/signup-beta` and `/login-beta` so production paths (`/signup`, `/login`) are completely untouched until the feature is verified end-to-end and manually promoted.

---

## Current Auth Architecture (for context)

### Sign-up flow (email/password)
1. `/signup` — collects name, email, password → calls `supabase.auth.signUp()` → sends confirmation email
2. Redirects to `/signup/success` ("Check your email")
3. User clicks email link → `/auth/callback?token_hash=...&type=signup` → `supabase.auth.verifyOtp()` → `/dashboard`
4. Inline in step 1: `POST /api/auth/sync-user` creates records in `users`, `organizations`, `organization_members`

### Login flow (email/password)
1. `/login` — collects email, password → `supabase.auth.signInWithPassword()` → `/dashboard`

### Auth callback (`/auth/callback`)
Handles two paths:
- `token_hash` + `type` → `verifyOtp()` (email confirmation, magic links)
- `code` → `exchangeCodeForSession(code)` ← **OAuth uses this path — already implemented**

### sync-user (`/api/auth/sync-user`)
Idempotent. Creates `users`, `organizations`, `organization_members` rows for a new organizer. Safe to call multiple times (ignores `23505` duplicate key). Currently only called during email/password signup, **not** during OAuth callback.

---

## Supabase Configuration

The Google provider is already configured in the Supabase dashboard (Client ID + Client Secret set). Before testing:

1. **Enable the toggle** — In Supabase Auth → Providers → Google, flip "Enable Sign in with Google" ON and Save.
2. **Add the callback URL** to your Google OAuth app's Authorized redirect URIs:
   `https://jpblsgltrfqcpdtdoydn.supabase.co/auth/v1/callback`
3. No new environment variables required — Supabase handles the OAuth credential exchange server-side.

---

## Files to Create

### 1. `app/signup-beta/page.tsx`

**Client component.** Mirrors the existing `/signup` page layout and design system, with two additions:

**Google button (primary, top of form card):**
```
[ G  Continue with Google ]
```
- Full-width, white background, `border border-charcoal/20`, `rounded-xl`, `py-2.5`
- Google "G" logo SVG inline (see UI notes below)
- `font-body text-sm font-medium text-charcoal`
- Hover: `bg-charcoal/5`
- Loading state: `opacity-60`, button disabled

**Divider between Google and email/password section:**
```
─────────── or ───────────
```
- `text-xs text-muted font-body`

**Email/password form (secondary, below divider):**
- Identical to existing `/signup` form: Name, Email, Password fields, "Create account" button
- Same validation, same error display (`bg-coral` banner)

**Footer links:**
```
Already have an account? Sign in  →  /login-beta
```

**Google button behavior:**
```typescript
const handleGoogleSignUp = async () => {
  setIsLoading(true);
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    setError(error.message);
    setIsLoading(false);
  }
  // On success: browser redirects to Google → Supabase → /auth/callback → /dashboard
  // No further client-side code runs
};
```

**Email/password form behavior:** Identical to existing `/signup` — calls `supabase.auth.signUp()`, then `POST /api/auth/sync-user`, then redirects to `/signup/success`.

**PostHog events:**
- Google button click: `posthog.capture('organizer_signed_up', { method: 'google' })`
- Email/password submit (existing): `posthog.capture('organizer_signed_up', { method: 'email' })`

---

### 2. `app/login-beta/page.tsx`

**Client component.** Mirrors the existing `/login` page, with Google button added.

**Google button (primary, top of form card):**
Same design as signup-beta — `Continue with Google`.

**Divider:** Same `─── or ───` pattern.

**Email/password form:** Identical to existing `/login` — email, password, "Sign in" button.

**Footer links:**
```
Forgot password?  Request a sign in link  →  /login/request-link
Don't have an account?  Sign up  →  /signup-beta
```

**Google button behavior:**
```typescript
const handleGoogleLogin = async () => {
  setIsLoading(true);
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    setError(error.message);
    setIsLoading(false);
  }
};
```

**PostHog events:**
- Google button click: `posthog.capture('organizer_logged_in', { method: 'google' })`
- Email/password (existing): `posthog.capture('organizer_logged_in', { method: 'email' })`

---

## Files to Modify

### 3. `app/auth/callback/route.ts` — Add sync-user call for OAuth

The existing `code` branch handles session exchange but doesn't call `sync-user`. Google OAuth users will never go through `/signup`, so their `users` / `organizations` / `organization_members` rows will never be created unless we do it here.

**Updated `code` branch:**
```typescript
} else if (code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error && data.user) {
    // Sync user to DB (idempotent — safe for repeat calls, handles 23505)
    const user = data.user;
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Organizer';

    await fetch(`${origin}/api/auth/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Must pass a valid session — create a short-lived request with the new session cookie
      // Use the same pattern as existing server-side fetches in the codebase
      body: JSON.stringify({ id: user.id, email: user.email, name }),
    });

    return NextResponse.redirect(redirectUrl);
  }
}
```

> **Implementation note for Cursor:** The `fetch` to `/api/auth/sync-user` requires an authenticated request context. The cleanest approach for a server-side route handler is to call the sync logic directly (import and call the same DB operations inline) rather than fetching the API route — this avoids the auth header complexity. Alternatively, use `serviceSupabase` to call the DB operations directly if you prefer to avoid the import. The key requirement is that the `users`, `organizations`, and `organization_members` rows exist before the redirect to `/dashboard` completes.

**Why this is safe for existing flows:**
- The `code` branch is only reached during OAuth (PKCE) callbacks — email/password users never hit it
- `sync-user` is idempotent — calling it for an existing user is harmless (ignores `23505`)
- No changes to the `token_hash` branch, so email confirmation flows are untouched

---

## UI Spec: Google Button

Use an inline SVG for the Google "G" logo — do not use an external CDN or image file. Standard Google brand colors:

```tsx
<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
  <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
</svg>
```

Button full markup pattern:
```tsx
<button
  type="button"
  onClick={handleGoogleSignUp}
  disabled={isLoading}
  className="flex w-full items-center justify-center gap-3 rounded-xl border border-charcoal/20 bg-surface px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-60 transition-colors font-body"
>
  {/* Google G SVG here */}
  Continue with Google
</button>
```

---

## Behavior Details

### New user via Google (first time)
1. Clicks "Continue with Google" on `/signup-beta` or `/login-beta`
2. Redirected to Google consent screen
3. Approves → Supabase receives token → redirects to `/auth/callback?code=...`
4. Callback calls `exchangeCodeForSession(code)` — session cookie set
5. Callback calls sync-user inline — creates `users`, `organizations`, `organization_members` rows
6. Redirected to `/dashboard` — shows empty state "Nothing to see here. Create your first signup."

### Returning user via Google
1. Clicks "Continue with Google" — same flow
2. Callback calls `exchangeCodeForSession` — refreshes session
3. sync-user call is idempotent — no-ops on existing rows
4. Redirected to `/dashboard` — shows existing events

### Error states
- If Google OAuth errors: `supabase.auth.signInWithOAuth` returns an error immediately (before redirect) — display in the `bg-coral` error banner, same as email/password errors
- If callback fails (e.g. state mismatch, expired code): existing callback already redirects to `/login?error=auth` — no change needed
- If sync-user fails after successful OAuth: user is authenticated but has no DB records — dashboard will show empty/broken state. Log error to console; consider a retry or fallback message on the dashboard

### No email confirmation required
Google OAuth users are pre-verified by Google. They never see the "check your email" step (`/signup/success`). The OAuth flow goes directly to `/dashboard`.

### Name handling
Google provides `user.user_metadata.full_name` or `user.user_metadata.name`. Use `full_name` first, then `name`, then fall back to the email prefix. Pass this to `sync-user` as the `name` field so their organization is named correctly (e.g. "Allison Stone's Organization").

---

## Testing Checklist (before promoting to production)

### Setup
- [ ] Google provider toggled ON in Supabase dashboard
- [ ] Callback URL registered in Google OAuth app
- [ ] Deployed to Vercel (env vars already set)

### New user via Google (`/signup-beta`)
- [ ] "Continue with Google" button renders correctly with G logo
- [ ] Clicking initiates redirect to Google consent screen
- [ ] After approval: redirects to `/dashboard` (not `/signup/success`)
- [ ] User appears in Supabase Auth → Users (email confirmed automatically)
- [ ] `users` row created in DB with correct name from Google metadata
- [ ] `organizations` row created
- [ ] `organization_members` row created with `role: 'owner'`
- [ ] PostHog event `organizer_signed_up` fires with `{ method: 'google' }`
- [ ] Dashboard shows empty "Create your first signup" state
- [ ] Can create a new event and see it on dashboard

### Returning user via Google (`/login-beta`)
- [ ] "Continue with Google" signs in and lands on `/dashboard` with existing events
- [ ] PostHog event `organizer_logged_in` fires with `{ method: 'google' }`
- [ ] No duplicate DB rows created on second sign-in

### Email/password flows still work
- [ ] `/signup-beta` email/password form → `/signup/success` → email confirmation → `/dashboard`
- [ ] `/login-beta` email/password form → `/dashboard`
- [ ] `/signup` (production) completely unchanged
- [ ] `/login` (production) completely unchanged
- [ ] `/auth/callback` token_hash path (email confirmations) still works

### Edge cases
- [ ] User with existing email/password account clicks "Continue with Google" with same email — Supabase behavior: links accounts or returns error. Verify no duplicate user created.
- [ ] Error state: revoke app access in Google account settings → re-attempt OAuth → graceful error shown
- [ ] Back button after Google redirect does not leave user in broken state

---

## Rollout: Promoting Beta to Production

Once all checklist items pass:

1. **Copy** `app/signup-beta/page.tsx` → `app/signup/page.tsx` (replacing existing)
2. **Copy** `app/login-beta/page.tsx` → `app/login/page.tsx` (replacing existing)
3. **Update footer links** in the new production pages: `Sign in` → `/login`, `Sign up` → `/signup` (remove `-beta` suffixes)
4. **Keep** `app/signup-beta/` and `app/login-beta/` in place temporarily as fallback (or delete after one week of stable production traffic)
5. **Update** the marketing homepage (`app/page.tsx`) — "Get started" CTA currently goes to `/signup`; no change needed
6. Optionally: update Supabase email templates to change "Confirm your email" redirect from `/signup/success` to `/dashboard` for a cleaner new-user flow (separate task)

---

## Out of Scope for This Spec

- Apple Sign In (separate provider, separate spec)
- Linking multiple OAuth providers to a single account
- Migrating existing email/password users to Google accounts
- Changes to the volunteer-facing signup flow (volunteers don't create accounts)
