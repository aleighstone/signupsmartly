import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { TrackMetaViewContent } from '@/app/providers/MetaPixelTracker';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-sand" data-page="home">
      <TrackMetaViewContent contentName="SignupSmartly home" />
      <header className="border-b border-charcoal/10 bg-surface shadow-soft">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
          <Logo className="shrink-0" />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-secondary whitespace-nowrap px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary whitespace-nowrap px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl font-display">
            Coordinate volunteers. Find dates that work.
          </h1>

          <p className="mt-6 text-lg text-muted leading-relaxed font-body">
            Create a volunteer signup or an availability poll, share one link,
            and let people respond in seconds. No account needed for
            participants. No ads. No clutter.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="btn-primary-lg w-full sm:w-auto"
            >
              Create your first signup
            </Link>
            <Link
              href="/login"
              className="btn-secondary-lg w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-16 grid gap-6 text-left sm:grid-cols-2 sm:gap-8">
            <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
              <h2 className="font-semibold text-charcoal font-heading">
                For organizers
              </h2>
              <p className="mt-2 text-sm text-muted font-body">
                Create an event or availability poll, define what you need, and
                share one link. See who&apos;s responded, find the best date or fill
                your roster, and export when you&apos;re ready.
              </p>
            </div>
            <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
              <h2 className="font-semibold text-charcoal font-heading">
                For volunteers
              </h2>
              <p className="mt-2 text-sm text-muted font-body">
                See what&apos;s open, respond in seconds, and get a confirmation
                email. No account needed — just click the link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="border-t border-charcoal/10 bg-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-charcoal font-heading sm:text-3xl">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-center text-base text-muted font-body">
            No training needed. No setup calls. Just create, share, and watch signups roll in.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white font-semibold font-heading text-lg">
                1
              </div>
              <h3 className="mt-4 font-semibold text-charcoal font-heading">Create your event or poll</h3>
              <p className="mt-2 text-sm text-muted font-body leading-relaxed">
                Add dates and roles for a volunteer signup, or proposed dates for a group availability poll. Set how many people you need, or just let everyone weigh in.
              </p>
              <div className="mt-5 w-full overflow-hidden rounded-lg border border-charcoal/10 shadow-soft">
                <Image
                  src="/marketing-content/SS_Create_scheduled.png"
                  alt="Create a scheduled signup form"
                  width={400}
                  height={500}
                  className="w-full object-top object-cover"
                  style={{ maxHeight: '220px' }}
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white font-semibold font-heading text-lg">
                2
              </div>
              <h3 className="mt-4 font-semibold text-charcoal font-heading">Share the link</h3>
              <p className="mt-2 text-sm text-muted font-body leading-relaxed">
                Copy your signup URL and share it in an email, text, or group chat. Volunteers need no account.
              </p>
              <div className="mt-5 w-full overflow-hidden rounded-lg border border-charcoal/10 shadow-soft">
                <Image
                  src="/marketing-content/SS_Signup_page_scheduled_track.png"
                  alt="Volunteer-facing signup page"
                  width={400}
                  height={500}
                  className="w-full object-top object-cover"
                  style={{ maxHeight: '220px' }}
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white font-semibold font-heading text-lg">
                3
              </div>
              <h3 className="mt-4 font-semibold text-charcoal font-heading">See who responded</h3>
              <p className="mt-2 text-sm text-muted font-body leading-relaxed">
                Watch signups fill your roster, or see which proposed date has the most availability. Export to a spreadsheet or print when you&apos;re ready.
              </p>
              <div className="mt-5 w-full overflow-hidden rounded-lg border border-charcoal/10 shadow-soft">
                <Image
                  src="/marketing-content/SS_View_My_Signups_scheduled_baseball.png"
                  alt="Organizer signups dashboard"
                  width={400}
                  height={500}
                  className="w-full object-top object-cover"
                  style={{ maxHeight: '220px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases teaser ───────────────────────────────────── */}
      <section className="border-t border-charcoal/10 bg-sand px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-charcoal font-heading sm:text-3xl">
            Works for sports teams, classrooms, clubs, and groups of all kinds
          </h2>
          <p className="mt-4 text-base text-muted font-body leading-relaxed">
            Track meets, snack duty, conference slots, potluck lists, and groups
            finding a date with an availability poll — see how organizers use
            SignupSmartly for volunteer signups and group scheduling.
          </p>
          <Link
            href="/use-cases"
            className="mt-7 inline-block btn-secondary-lg"
          >
            See use cases →
          </Link>
        </div>
      </section>

      <div className="flex-1" />

      <footer className="border-t border-charcoal/10 py-6">
        <div className="text-center text-sm text-muted space-y-1 font-body">
          <p>SignupSmartly — coordination made simple.</p>
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/privacy" className="text-charcoal hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted">·</span>
            <Link href="/terms" className="text-charcoal hover:underline">
              Terms of Service
            </Link>
            <span className="text-muted">·</span>
            <Link href="/use-cases" className="text-charcoal hover:underline">
              Use Cases
            </Link>
            <span className="text-muted">·</span>
            <Link href="/whats-new" className="text-charcoal hover:underline">
              What&apos;s New
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
