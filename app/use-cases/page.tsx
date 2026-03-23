import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';

const useCases = [
  {
    id: 'track-meet',
    badge: 'Scheduled',
    badgeColor: 'bg-sage/15 text-sage-hover',
    headline: 'Track meet volunteers',
    subhead: 'Coordinate every shift for meet day — rinse and repeat with a template.',
    description:
      'Set up roles like Setup Crew, Timers, and Announcer, each with their own time window and how many volunteers you need. Share one link with parents. They pick a shift. You get a clean roster.',
    points: [
      'Multiple roles and time windows in one signup',
      'Parents see exactly which shifts are still open',
      'Export, print, or email your roster before the meet',
    ],
    screenshot: '/marketing-content/SS_Signup_page_scheduled_track.png',
    screenshotAlt: 'Track meet volunteer signup page showing shifts and Sign Up buttons',
    flip: false,
  },
  {
    id: 'snack-duty',
    badge: 'Scheduled',
    badgeColor: 'bg-sage/15 text-sage-hover',
    headline: 'Baseball snack duty',
    subhead: 'One link handles snack rotation for the whole season.',
    description:
      'Add a slot for each home game, set capacity to one family per game, and share the link at the start of the season. Parents claim a date. The filled games are locked — no double-bookings, no chasing anyone down.',
    points: [
      'Works for any sport with a snack rotation',
      'Parents see which games are taken and which are still open',
      'Add someone manually if they tell you in person',
    ],
    screenshot: '/marketing-content/SS_Signup_page_scheduled_baseball.png',
    screenshotAlt: 'Baseball snack duty signup page showing game dates and filled roles',
    flip: true,
  },
  {
    id: 'conferences',
    badge: 'Scheduled',
    badgeColor: 'bg-sage/15 text-sage-hover',
    headline: 'Parent-teacher conferences',
    subhead: 'Let parents easily book their own time slot.',
    description:
      'Create a slot for each available time, set capacity to 1, and share the link with your class. Parents pick their own time. Filled slots are automatically locked so there are no double-bookings.',
    points: [
      'No more scheduling emails back and forth',
      'Works for conferences, office hours, or any one-on-one booking',
      'Parents get a confirmation email with a cancel link if plans change',
    ],
    screenshot: '/marketing-content/SS_Signup_page_view_filled.png',
    screenshotAlt: 'Parent-teacher conference signup showing filled and available time slots',
    flip: false,
  },
  {
    id: 'book-club',
    badge: 'Simple list',
    badgeColor: 'bg-sky-100 text-sky-700',
    headline: 'Book club & potluck signups',
    subhead: "Who's bringing what — we don't need multiple cheese platters.",
    description:
      'For gatherings where you need people to bring specific things, the simple list format is perfect. Add items like wine, appetizer, dessert, and plates. Share the link. Members claim what they want to bring.',
    points: [
      'No time slots needed — just a list of what\'s needed',
      'Works for potlucks, holiday parties, end-of-season celebrations',
      'See the whole list fill up in real time from your dashboard',
    ],
    screenshot: '/marketing-content/SS_View_my_signups_scheduled_bookclub.png',
    screenshotAlt: 'Book club signup showing who is bringing each item',
    flip: true,
  },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-sand" data-page="use-cases">

      {/* ── Header ─────────────────────────────────────────────── */}
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

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="border-b border-charcoal/10 bg-surface px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl font-heading">
            Works for any volunteer coordination
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed font-body">
            Sports teams, classrooms, clubs, neighborhood groups — if you need
            people to sign up for something, SignupSmartly handles it.<br />No account required. Just a link.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center rounded-full bg-sage/15 px-3.5 py-1.5 text-sm font-medium text-sage-hover font-body">
              Scheduled — for events with time slots
            </span>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-3.5 py-1.5 text-sm font-medium text-sky-700 font-body">
              Simple list — for &quot;who&apos;s bringing what&quot;
            </span>
          </div>
        </div>
      </section>

      {/* ── Use cases ──────────────────────────────────────────── */}
      <div className="flex-1">
        {useCases.map((uc) => (
          <section
            key={uc.id}
            id={uc.id}
            className="border-b border-charcoal/10 px-4 py-16 sm:py-20 scroll-mt-8"
          >
            <div
              className={`mx-auto flex max-w-5xl flex-col items-center gap-10 sm:gap-16 lg:flex-row ${
                uc.flip ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Text */}
              <div className="w-full lg:w-2/5 shrink-0">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium font-body ${uc.badgeColor}`}
                >
                  {uc.badge}
                </span>
                <h2 className="mt-3 text-3xl font-semibold text-charcoal font-heading">
                  {uc.headline}
                </h2>
                <p className="mt-2 text-base font-medium text-muted font-body">
                  {uc.subhead}
                </p>
                <p className="mt-4 text-base text-charcoal/80 leading-relaxed font-body">
                  {uc.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {uc.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-charcoal font-body">
                      <span className="mt-0.5 shrink-0 text-sage">✓</span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="btn-primary mt-8 inline-block px-5 py-2.5 text-sm"
                >
                  Try it now →
                </Link>
              </div>

              {/* Screenshot */}
              <div className="w-full lg:w-3/5">
                <div className="overflow-hidden rounded-xl border border-charcoal/10 shadow-soft-md">
                  <Image
                    src={uc.screenshot}
                    alt={uc.screenshotAlt}
                    width={800}
                    height={600}
                    className="w-full object-top object-cover"
                    style={{ maxHeight: '480px' }}
                  />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="bg-surface border-b border-charcoal/10 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold text-charcoal font-heading">
            Ready to try it?
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed font-body">
            Free to use. Takes about two minutes to set up your first signup.
            No app required for your volunteers — just a link.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="btn-primary-lg w-full sm:w-auto">
              Create your first signup
            </Link>
            <Link href="/login" className="btn-secondary-lg w-full sm:w-auto">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
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
            <Link href="/whats-new" className="text-charcoal hover:underline">
              What&apos;s New
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
