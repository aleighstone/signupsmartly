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
            SignupSmartly - smarter than a genius
          </h1>

          <p className="mt-6 text-lg text-muted leading-relaxed font-body">
            A cleaner way to coordinate volunteer signups and group scheduling
            for community events, classrooms, and sports. Create, share a
            link.<br />No ads, no clutter.
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
                Create events, define what you need, and share one link. See
                coverage at a glance and export rosters.
              </p>
            </div>
            <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
              <h2 className="font-semibold text-charcoal font-heading">
                For volunteers
              </h2>
              <p className="mt-2 text-sm text-muted font-body">
                View open slots, sign up in seconds, and get a confirmation
                email with a cancel link if plans change.
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
              <h3 className="mt-4 font-semibold text-charcoal font-heading">Create your signup</h3>
              <p className="mt-2 text-sm text-muted font-body leading-relaxed">
                Add your event details, spots, times, and how many volunteers you need for each role or item.
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
              <h3 className="mt-4 font-semibold text-charcoal font-heading">Track coverage</h3>
              <p className="mt-2 text-sm text-muted font-body leading-relaxed">
                Watch your roster fill in from the dashboard. Export to a spreadsheet or print before your event.
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
            Works for sports teams, classrooms, clubs, and more
          </h2>
          <p className="mt-4 text-base text-muted font-body leading-relaxed">
            Track meet volunteers, snack duty rotations, parent-teacher
            conference booking, book club potlucks, recurring group scheduling
            — see how organizers use SignupSmartly for every kind of coordination.
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
          <p>SignupSmartly — organize volunteers smartly.</p>
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
