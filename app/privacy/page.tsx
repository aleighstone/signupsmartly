import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-sand" data-page="privacy">
      <header className="border-b border-charcoal/10 bg-surface shadow-soft">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
          <Logo className="shrink-0" />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="btn-secondary whitespace-nowrap px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary whitespace-nowrap px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <article className="flex-1 mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold text-charcoal font-heading">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted font-body">Effective: March 2026</p>

          <div className="mt-8 space-y-6 text-sm text-charcoal font-body leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2 first:mt-0">
                What SignupSmartly is
              </h2>
              <p>
                SignupSmartly is a free volunteer coordination tool built and
                operated by Digitaleigh Co. It lets organizers create signup
                events and share them with volunteers. Volunteers can claim
                slots without creating an account.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Information we collect
              </h2>
              <p className="font-medium">From organizers (people who create an account):</p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Name and email address</li>
                <li>Password, stored in hashed form by Supabase — we never see it in plain text</li>
                <li>If you sign in with Google: your name, email address, and profile picture as provided by Google</li>
              </ul>
              <p className="mt-4 font-medium">From volunteers (people who sign up for a slot):</p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Name and email address</li>
                <li>An optional comment if you choose to leave one</li>
                <li>Your reminder preferences (whether you want a reminder email and when)</li>
              </ul>
              <p className="mt-2">
                We do not collect payment information, phone numbers, or any
                government-issued identification.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                How we use your information
              </h2>
              <p>
                We use the information collected solely to provide the
                SignupSmartly service:
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>To create and manage your organizer account</li>
                <li>To associate you with your events and signups</li>
                <li>To send confirmation and reminder emails to volunteers</li>
                <li>To send notification digest emails to organizers</li>
                <li>To provide basic usage analytics so we can improve the product (via PostHog — see below)</li>
              </ul>
              <p className="mt-2">
                We do not sell your data. We do not use your data for
                advertising.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Third-party services
              </h2>
              <p>
                SignupSmartly is built on the following infrastructure
                providers. Each has its own privacy policy.
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li><strong>Supabase</strong> (supabase.com) — database and user authentication. Your account data and event data are stored in Supabase.</li>
                <li><strong>Vercel</strong> (vercel.com) — website hosting and serverless functions.</li>
                <li><strong>Resend</strong> (resend.com) — transactional email delivery (confirmations, reminders, digests).</li>
                <li><strong>PostHog</strong> (posthog.com) — product analytics. We use PostHog to understand how people use the product (e.g. which features are used, where errors occur). PostHog does not receive volunteer names or emails.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Cookies and analytics
              </h2>
              <p>
                SignupSmartly uses PostHog to collect anonymous usage data. This
                includes page views, feature interactions, and error events.
                PostHog may set a cookie or use local storage to identify a
                browser session. We do not use advertising cookies or third-party
                tracking pixels.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Data retention
              </h2>
              <p>
                We retain your data for as long as your account is active or as
                needed to provide the service. If you&apos;d like your data deleted,
                contact us at the email below and we&apos;ll remove it within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Children&apos;s privacy
              </h2>
              <p>
                SignupSmartly is not directed at children under 13. We do not
                knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Changes to this policy
              </h2>
              <p>
                We may update this policy from time to time. The effective date
                at the top of this page reflects the most recent revision.
                Continued use of SignupSmartly after changes are posted
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Contact
              </h2>
              <p>
                If you have questions about this privacy policy or want to
                request data deletion, contact us at:
              </p>
              <p className="mt-2">
                <a
                  href="mailto:allison@digitaleigh.com"
                  className="text-charcoal underline hover:opacity-70"
                >
                  allison@digitaleigh.com
                </a>
              </p>
              <p className="mt-2">
                Digitaleigh Co.
                <br />
                <a
                  href="https://www.digitaleigh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-charcoal underline hover:opacity-70"
                >
                  https://www.digitaleigh.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </article>

      <footer className="border-t border-charcoal/10 py-6">
        <div className="text-center text-sm text-muted space-y-1 font-body">
          <p>SignupSmartly — coordination made simple.</p>
          <p className="flex items-center justify-center gap-3">
            <Link href="/privacy" className="text-charcoal hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted">·</span>
            <Link href="/terms" className="text-charcoal hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
