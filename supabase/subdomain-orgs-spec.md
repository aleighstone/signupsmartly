# Subdomain-Based Org Tenancy — Implementation Spec
**Feature:** White-labeled org subdomains (e.g. `falconstrack.signupsmartly.com`)
**First use case:** Falcons track team (internal test + dogfood)
**Date:** 2026-03-19

---

## Product Vision: Three-Tier Model

| Tier | URL pattern | Branding | Target |
|------|-------------|----------|--------|
| Free (current) | `signupsmartly.com/event/{id}` | SignupSmartly | Individual organizers |
| Org (new) | `{slug}.signupsmartly.com` | Org name + colors + logo | Teams, schools, clubs |
| Premium (future) | `signup.theirschool.org` | Fully white-labeled | Districts, large orgs |

This spec implements the Org tier. The Premium custom domain tier is designed for but not built here.

---

## Architecture Approach

**Subdomain detection happens in middleware.** When a request arrives at `falconstrack.signupsmartly.com/anything`, middleware reads the host header, extracts the slug (`falconstrack`), and injects it as a request header (`x-org-slug`). Pages that need org context read that header server-side.

**URL rewrites for the org home page only.** Requests to `falconstrack.signupsmartly.com/` are rewritten internally to `/org/falconstrack` so the App Router can serve a dedicated org home page. All other paths (`/event/[id]`, `/signup/confirm`, etc.) route to their existing pages — they just pick up the org branding from the `x-org-slug` header.

**No route duplication.** Existing event pages, signup flows, and confirm pages are reused. Org branding is an additive layer on top, not a parallel copy of the routes.

---

## Step 0: Vercel Setup (do this first)

In your Vercel project settings → Domains:
- Add `*.signupsmartly.com` as a wildcard domain
- This requires the **Vercel Pro plan** — check if you're already on it
- Once added, any subdomain automatically routes to your Next.js app

No DNS changes needed on your domain registrar — Vercel handles wildcard routing automatically once the domain is configured.

---

## Step 1: Database Migration

Create migration file: `supabase/migrations/20260319000000_org_subdomain.sql`

```sql
-- Add subdomain slug and branding fields to organizations
ALTER TABLE organizations
  ADD COLUMN slug TEXT UNIQUE,
  ADD COLUMN primary_color TEXT,
  ADD COLUMN custom_domain TEXT UNIQUE;

-- Index for fast slug lookups (middleware will query this on every subdomain request)
CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_organizations_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;

-- Seed the Falcons track team org
-- First find your org ID, then run:
-- UPDATE organizations SET slug = 'falconstrack', primary_color = '#8C0000' WHERE name = 'Allison Stone''s Organization';
-- (or whatever org name was created for your account — check the organizations table)
```

**Column definitions:**
- `slug` — URL-safe identifier, lowercase, no spaces (e.g. `falconstrack`). Must be unique. Null = no subdomain for this org (free tier).
- `primary_color` — hex color string (e.g. `#1a3a6b`) used to override the default sage green on buttons, coverage meters, and accents within subdomain pages. Null = use default sage green.
- `custom_domain` — future Premium tier field (e.g. `signup.falconstrack.org`). Null for now.

**To find your org ID and set the slug**, run in Supabase SQL editor:
```sql
SELECT o.id, o.name, om.user_id
FROM organizations o
JOIN organization_members om ON om.organization_id = o.id
WHERE om.role = 'owner';
-- Then:
UPDATE organizations SET slug = 'falconstrack', primary_color = '#8C0000'
WHERE id = '{your-org-id}';
```

---

## Step 2: New Type — OrgBranding

Create `lib/org-branding.ts`:

```typescript
export type OrgBranding = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
};

// Look up org by subdomain slug — used by middleware-aware pages
export async function getOrgBySlug(slug: string): Promise<OrgBranding | null> {
  // Uses serviceSupabase (bypasses RLS — slug lookup is public info)
  const { data } = await serviceSupabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color')
    .eq('slug', slug)
    .maybeSingle();
  return data ?? null;
}

// Look up org by custom domain — for future Premium tier
export async function getOrgByCustomDomain(domain: string): Promise<OrgBranding | null> {
  const { data } = await serviceSupabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color')
    .eq('custom_domain', domain)
    .maybeSingle();
  return data ?? null;
}
```

---

## Step 3: Update Middleware

Replace `middleware.ts` with the following. The existing auth session refresh logic is preserved — subdomain detection is added on top.

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Subdomains that are part of the app itself — never treated as org slugs
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'mail', 'smtp']);

function getSubdomain(host: string): string | null {
  // Remove port if present (localhost:3000)
  const hostname = host.split(':')[0];
  // Match *.signupsmartly.com — extract the subdomain part
  const match = hostname.match(/^([^.]+)\.signupsmartly\.com$/);
  if (!match) return null;
  const subdomain = match[1];
  if (RESERVED_SUBDOMAINS.has(subdomain)) return null;
  return subdomain;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const slug = getSubdomain(host);
  const { pathname } = request.nextUrl;

  // --- Subdomain routing ---
  if (slug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-org-slug', slug);

    // Rewrite the root path to the org home page
    // e.g. falconstrack.signupsmartly.com/ → /org/falconstrack
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = `/org/${slug}`;
      return NextResponse.rewrite(url, { headers: requestHeaders });
    }

    // For all other paths, pass through with org slug header injected
    // e.g. falconstrack.signupsmartly.com/event/abc → /event/abc + x-org-slug header
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return refreshSupabaseSession(request, response);
  }

  // --- Standard (non-subdomain) routing ---
  let response = NextResponse.next({ request: { headers: request.headers } });
  return refreshSupabaseSession(request, response);
}

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## Step 4: Org Home Page

Create `app/org/[slug]/page.tsx`:

This is the page volunteers land on when they visit `falconstrack.signupsmartly.com/`. It shows the org's name, logo, and all their upcoming published events.

**Behavior:**
- Look up org by `slug` param — if not found, `notFound()`
- Query all published events for that org, ordered by `start_date` ascending
- Show events as cards with title, date, coverage meter, and a "Sign Up" link to `/event/{id}`
- No auth required — fully public page

**Page structure:**
```
[Logo or Org Name — large, centered]
[Org tagline if set, or "Volunteer sign-ups for {org name}"]

[Event Card]
  Title
  Date/time (or "Ongoing" if no date)
  Coverage meter (sm size)
  [Sign Up →] button

[Event Card]
  ...

[Footer: "Organized with SignupSmartly" link]
```

**Design notes:**
- If `org.primary_color` is set, use it as the button background color via inline style (`style={{ backgroundColor: org.primary_color }}`) rather than the Tailwind `bg-sage` class — this is the simplest way to apply dynamic colors without a runtime Tailwind configuration
- If `org.logo_url` is set, show it above the org name (`<img>` with `max-h-16 object-contain`)
- Otherwise, show the org name in the same heading style as the marketing home page
- Coverage meter: use the existing `<CoverageMeter>` component at `size="sm"`
- If no published events: show "No sign-ups are available yet. Check back soon."

**Data fetching — add this function to `lib/db.ts`:**
```typescript
export async function getPublishedEventsForOrg(organizationId: string) {
  const { data } = await serviceSupabase
    .from('events')
    .select('id, title, start_date, end_date, signup_type')
    .eq('organization_id', organizationId)
    .eq('published', true)
    .order('start_date', { ascending: true });
  return data ?? [];
}
```

---

## Step 5: Add Org Branding to Event Pages

Update `app/event/[id]/page.tsx` to read the `x-org-slug` header and apply org branding if present.

**What changes:**
- Import `headers` from `next/headers`
- At the top of the page component, read `const slug = (await headers()).get('x-org-slug')`
- If slug is set, call `getOrgBySlug(slug)` to get branding
- Pass `org` to a new `<OrgEventHeader>` component (or conditionally render the existing header differently)

**Branding applied on event pages when visited via subdomain:**
- Primary color on the "Sign Up" button (inline style override)
- If org has a logo, show it small in the top-left instead of the SignupSmartly logo
- Footer changes from "Organized with SignupSmartly" to "{Org Name}" (still links to signupsmartly.com)

**When visited via signupsmartly.com/event/{id} directly** (no subdomain), `x-org-slug` is null — page renders exactly as it does today. No change to existing behavior.

---

## Step 6: Update Signup and Confirm Pages

The volunteer signup flow (`/signup/confirm`, `/signup/preferences`, `/signup/cancel`) should also carry the org branding if the volunteer arrived via subdomain. Apply the same pattern:
- Read `x-org-slug` from headers
- Look up org branding
- Apply primary color and logo where present

This ensures the full volunteer experience feels branded to the org, not SignupSmartly, when accessed via the org's subdomain.

---

## Step 7: Admin — Creating a New Org Subdomain

There is no self-serve UI for this yet (that's a future feature). To create a new org subdomain:

1. Find the org's ID in the Supabase dashboard (Table Editor → organizations)
2. Set `slug` to the desired subdomain (lowercase, letters/numbers/hyphens only)
3. Optionally set `primary_color` (hex) and `logo_url` (public URL to an image)
4. The subdomain is immediately live — no deploy required

**Slug validation rules (enforce in SQL CHECK constraint):**
```sql
ALTER TABLE organizations
  ADD CONSTRAINT org_slug_format
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$');
```

---

## What Does NOT Change

- The organizer dashboard (`/dashboard`) — organizers always use `www.signupsmartly.com/dashboard` regardless of which org they belong to. The subdomain is for volunteers and public-facing pages only.
- Auth flows (`/login`, `/signup`, `/login-beta`, `/signup-beta`) — always on the main domain
- The API routes — always on the main domain; subdomain requests that hit API routes work fine because `x-org-slug` is just an informational header

---

## Testing Checklist

### Local testing (before deploying)
Subdomains don't work on `localhost` by default. Two options:
- **Option A:** Add `127.0.0.1 falconstrack.localhost` to `/etc/hosts` and test at `falconstrack.localhost:3000`. The middleware `getSubdomain()` function will need a small tweak to also match `*.localhost` for local dev.
- **Option B:** Deploy to Vercel preview and test on the real subdomain (simpler, recommended for a small team)

### Deployed testing
- [ ] `falconstrack.signupsmartly.com/` loads org home page showing Falcons events
- [ ] Org name renders correctly; logo shows if set
- [ ] Primary color applied to buttons and accents
- [ ] Each event card links to correct event URL
- [ ] `falconstrack.signupsmartly.com/event/{id}` shows event page with Falcons branding
- [ ] Signup flow completes correctly (POST /api/signup still returns 200)
- [ ] Confirm page and preferences page show org branding
- [ ] `www.signupsmartly.com/event/{id}` (same event, no subdomain) shows default SignupSmartly branding — no regression
- [ ] Unknown subdomain (e.g. `doesnotexist.signupsmartly.com/`) returns 404
- [ ] `www.signupsmartly.com` marketing home page completely unchanged
- [ ] Organizer dashboard at `www.signupsmartly.com/dashboard` unchanged

---

## Future: Custom Domain (Premium Tier)

When a school or org wants `signup.theirschool.org` pointing to their SignupSmartly instance:

1. They add a CNAME record: `signup.theirschool.org → cname.vercel-dns.com`
2. You add `signup.theirschool.org` to the Vercel project domains
3. You set `custom_domain = 'signup.theirschool.org'` on their org row
4. Middleware checks custom domain: if `host` matches no SignupSmartly subdomain pattern, look it up in `organizations.custom_domain`
5. Same slug-based routing applies — root path rewrites to org home page

The `getOrgByCustomDomain()` function in `lib/org-branding.ts` is already stubbed for this.

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/migrations/20260319000000_org_subdomain.sql` | Create — adds slug, primary_color, custom_domain to organizations |
| `lib/org-branding.ts` | Create — OrgBranding type + getOrgBySlug + getOrgByCustomDomain |
| `middleware.ts` | Update — subdomain detection, x-org-slug header injection, root rewrite |
| `app/org/[slug]/page.tsx` | Create — org home page listing published events |
| `lib/db.ts` | Update — add getPublishedEventsForOrg() |
| `app/event/[id]/page.tsx` | Update — read x-org-slug, apply org branding |
| `app/signup/confirm/page.tsx` | Update — read x-org-slug, apply org branding |
| `app/signup/preferences/page.tsx` | Update — read x-org-slug, apply org branding |
| `app/signup/cancel/page.tsx` | Update — read x-org-slug, apply org branding |
