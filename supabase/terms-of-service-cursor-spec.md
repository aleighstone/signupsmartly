# Cursor Instructions: Add Terms of Service Page

## Task
Create a static terms of service page at `/terms`.

## File to create
`app/terms/page.tsx`

Server component (no `'use client'`). Static content only.

## Design requirements
Identical pattern to `app/privacy/page.tsx` — same layout, same design tokens, same Logo header, same footer. If you've already built the privacy page, copy its structure exactly and swap the content below.

## Also update
In `app/page.tsx`, update the footer to include both Privacy Policy and Terms of Service links side by side:

```tsx
<p className="flex items-center justify-center gap-3">
  <Link href="/privacy" className="text-charcoal hover:underline">
    Privacy Policy
  </Link>
  <span className="text-muted">·</span>
  <Link href="/terms" className="text-charcoal hover:underline">
    Terms of Service
  </Link>
</p>
```

## Also update the Google OAuth consent screen
Once the page is live at `https://www.signupsmartly.com/terms`, add that URL to the Terms of Service field in the Google Cloud Console OAuth consent screen settings.

---

## Terms of service content to render

**Page title (h1):** Terms of Service

**Effective date paragraph:**
Effective: March 2026

---

**Section: Agreement to these terms**

By creating an account or using SignupSmartly, you agree to these Terms of Service. If you don't agree, please don't use the service. These terms apply to all users of signupsmartly.com, including organizers who create accounts and volunteers who sign up for events.

---

**Section: What SignupSmartly is**

SignupSmartly is a free volunteer coordination tool operated by Digitaleigh Co. It lets organizers create sign-up events and share them with volunteers. Volunteers can claim slots without creating an account. The service is provided as-is and free of charge.

---

**Section: Your account**

You are responsible for keeping your account credentials secure. You must provide accurate information when creating your account. You may not share your account with others or use another person's account without permission. You must be at least 13 years old to create an account.

---

**Section: Acceptable use**

You agree not to use SignupSmartly to:

- Post false, misleading, or fraudulent event information
- Collect personal information from volunteers for purposes other than organizing legitimate events
- Send spam or unsolicited communications to volunteers
- Attempt to gain unauthorized access to SignupSmartly's systems or another user's account
- Use the service in any way that violates applicable laws or regulations

We reserve the right to suspend or terminate accounts that violate these terms.

---

**Section: Content you provide**

You own the content you create on SignupSmartly (your events, slot descriptions, and so on). By using the service, you grant Digitaleigh Co. a limited license to store and display your content solely for the purpose of operating the service. We do not claim ownership of your content and will not use it for any other purpose.

---

**Section: Volunteer data**

As an organizer, you collect personal information from volunteers (their name and email) on their behalf. You agree to use that information only for the purposes of organizing and communicating about your event, and not to share it with third parties or use it for marketing.

---

**Section: Service availability**

We aim to keep SignupSmartly available and reliable, but we don't guarantee uninterrupted access. The service may be updated, changed, or temporarily unavailable from time to time. We'll try to give notice of significant changes when possible.

---

**Section: Disclaimer of warranties**

SignupSmartly is provided "as is" without warranties of any kind, express or implied. Digitaleigh Co. does not warrant that the service will be error-free, uninterrupted, or free of security vulnerabilities. Your use of the service is at your own risk.

---

**Section: Limitation of liability**

To the fullest extent permitted by law, Digitaleigh Co. shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of SignupSmartly, including but not limited to loss of data or business interruption.

---

**Section: Changes to these terms**

We may update these terms from time to time. The effective date at the top of this page reflects the most recent revision. Continued use of SignupSmartly after changes are posted means you accept the updated terms.

---

**Section: Governing law**

These terms are governed by the laws of the State of California, without regard to conflict of law principles.

---

**Section: Contact**

Questions about these terms? Contact us at:

allison@digitaleigh.com

Digitaleigh Co.
https://www.digitaleigh.com
