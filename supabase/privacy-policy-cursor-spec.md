# Cursor Instructions: Add Privacy Policy Page

## Task
Create a static privacy policy page at `/privacy`.

## File to create
`app/privacy/page.tsx`

This is a **server component** (no `'use client'`). It renders static content only — no hooks, no interactivity.

## Design requirements
- Match the existing app design system exactly
- Use the same layout as `/app/signup/success/page.tsx` as a structural reference (centered, `bg-sand`, card with `rounded-xl border border-charcoal/10 bg-surface shadow-soft`)
- Include the Logo at the top linking back to `/` (use the `<Logo />` component from `@/components/Logo`)
- Max width: `max-w-2xl` centered
- Prose text: `text-sm text-charcoal font-body leading-relaxed`
- Section headings: `text-base font-semibold text-charcoal font-heading mt-6 mb-2`
- Links: `text-charcoal underline hover:opacity-70`
- Footer at bottom: same as `app/page.tsx` footer — "SignupSmartly — coordination made simple." + Digitaleigh Co. link

## Also update
Add a Privacy Policy link to the footer in `app/page.tsx`. In the existing footer `<div>`, add a third line:
```tsx
<p>
  <Link href="/privacy" className="text-charcoal hover:underline">
    Privacy Policy
  </Link>
</p>
```

## Also update the Google OAuth consent screen
Once the page is live at `https://www.signupsmartly.com/privacy`, add that URL to the Privacy Policy field in the Google Cloud Console OAuth consent screen settings.

---

## Privacy policy content to render

Render the following content inside the page. Use `<h1>` for the title, `<h2>` for section headings, `<p>` for paragraphs, and `<a>` for links. Do not use a markdown renderer — write it as JSX directly.

---

**Page title (h1):** Privacy Policy

**Effective date paragraph:**
Effective: March 2026

---

**Section: What SignupSmartly is**

SignupSmartly is a free volunteer coordination tool built and operated by Digitaleigh Co. It lets organizers create sign-up events and share them with volunteers. Volunteers can claim slots without creating an account.

---

**Section: Information we collect**

*From organizers (people who create an account):*
- Name and email address
- Password, stored in hashed form by Supabase — we never see it in plain text
- If you sign in with Google: your name, email address, and profile picture as provided by Google

*From volunteers (people who sign up for a slot):*
- Name and email address
- An optional comment if you choose to leave one
- Your reminder preferences (whether you want a reminder email and when)

We do not collect payment information, phone numbers, or any government-issued identification.

---

**Section: How we use your information**

We use the information collected solely to provide the SignupSmartly service:
- To create and manage your organizer account
- To associate you with your events and signups
- To send confirmation and reminder emails to volunteers
- To send notification digest emails to organizers
- To provide basic usage analytics so we can improve the product (via PostHog — see below)

We do not sell your data. We do not use your data for advertising.

---

**Section: Third-party services**

SignupSmartly is built on the following infrastructure providers. Each has its own privacy policy.

- **Supabase** (supabase.com) — database and user authentication. Your account data and event data are stored in Supabase.
- **Vercel** (vercel.com) — website hosting and serverless functions.
- **Resend** (resend.com) — transactional email delivery (confirmations, reminders, digests).
- **PostHog** (posthog.com) — product analytics. We use PostHog to understand how people use the product (e.g. which features are used, where errors occur). PostHog does not receive volunteer names or emails.

---

**Section: Cookies and analytics**

SignupSmartly uses PostHog to collect anonymous usage data. This includes page views, feature interactions, and error events. PostHog may set a cookie or use local storage to identify a browser session. We do not use advertising cookies or third-party tracking pixels.

---

**Section: Data retention**

We retain your data for as long as your account is active or as needed to provide the service. If you'd like your data deleted, contact us at the email below and we'll remove it within 30 days.

---

**Section: Children's privacy**

SignupSmartly is not directed at children under 13. We do not knowingly collect personal information from children under 13.

---

**Section: Changes to this policy**

We may update this policy from time to time. The effective date at the top of this page reflects the most recent revision. Continued use of SignupSmartly after changes are posted constitutes acceptance of the updated policy.

---

**Section: Contact**

If you have questions about this privacy policy or want to request data deletion, contact us at:

allison@digitaleigh.com

Digitaleigh Co.
https://www.digitaleigh.com
