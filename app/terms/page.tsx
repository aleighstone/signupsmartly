import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-sand" data-page="terms">
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
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted font-body">Effective: March 2026</p>

          <div className="mt-8 space-y-6 text-sm text-charcoal font-body leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2 first:mt-0">
                Agreement to these terms
              </h2>
              <p>
                By creating an account or using SignupSmartly, you agree to these
                Terms of Service. If you don&apos;t agree, please don&apos;t use the
                service. These terms apply to all users of signupsmartly.com,
                including organizers who create accounts and volunteers who sign
                up for events.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                What SignupSmartly is
              </h2>
              <p>
                SignupSmartly is a free volunteer coordination tool operated by
                Digitaleigh Co. It lets organizers create sign-up events and
                share them with volunteers. Volunteers can claim slots without
                creating an account. The service is provided as-is and free of
                charge.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Your account
              </h2>
              <p>
                You are responsible for keeping your account credentials secure.
                You must provide accurate information when creating your
                account. You may not share your account with others or use
                another person&apos;s account without permission. You must be at
                least 13 years old to create an account.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Acceptable use
              </h2>
              <p>
                You agree not to use SignupSmartly to:
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Post false, misleading, or fraudulent event information</li>
                <li>
                  Collect personal information from volunteers for purposes
                  other than organizing legitimate events
                </li>
                <li>Send spam or unsolicited communications to volunteers</li>
                <li>
                  Attempt to gain unauthorized access to SignupSmartly&apos;s
                  systems or another user&apos;s account
                </li>
                <li>
                  Use the service in any way that violates applicable laws or
                  regulations
                </li>
              </ul>
              <p className="mt-2">
                We reserve the right to suspend or terminate accounts that
                violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Content you provide
              </h2>
              <p>
                You own the content you create on SignupSmartly (your events,
                slot descriptions, and so on). By using the service, you grant
                Digitaleigh Co. a limited license to store and display your
                content solely for the purpose of operating the service. We do
                not claim ownership of your content and will not use it for any
                other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Volunteer data
              </h2>
              <p>
                As an organizer, you collect personal information from
                volunteers (their name and email) on their behalf. You agree to
                use that information only for the purposes of organizing and
                communicating about your event, and not to share it with third
                parties or use it for marketing.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Service availability
              </h2>
              <p>
                We aim to keep SignupSmartly available and reliable, but we
                don&apos;t guarantee uninterrupted access. The service may be
                updated, changed, or temporarily unavailable from time to time.
                We&apos;ll try to give notice of significant changes when
                possible.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Disclaimer of warranties
              </h2>
              <p>
                SignupSmartly is provided &quot;as is&quot; without warranties of
                any kind, express or implied. Digitaleigh Co. does not warrant
                that the service will be error-free, uninterrupted, or free of
                security vulnerabilities. Your use of the service is at your own
                risk.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Limitation of liability
              </h2>
              <p>
                To the fullest extent permitted by law, Digitaleigh Co. shall
                not be liable for any indirect, incidental, special, or
                consequential damages arising from your use of SignupSmartly,
                including but not limited to loss of data or business
                interruption.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Changes to these terms
              </h2>
              <p>
                We may update these terms from time to time. The effective date
                at the top of this page reflects the most recent revision.
                Continued use of SignupSmartly after changes are posted means
                you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Governing law
              </h2>
              <p>
                These terms are governed by the laws of the State of California,
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-charcoal font-heading mt-6 mb-2">
                Contact
              </h2>
              <p>Questions about these terms? Contact us at:</p>
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
          <p>SignupSmartly — organize volunteers smartly.</p>
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
