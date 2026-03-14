import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-sand" data-page="home">
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
          <h1 className="text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl font-heading">
            Create smart signups, without the noise
          </h1>

          <p className="mt-6 text-lg text-muted leading-relaxed font-body">
            A cleaner way to coordinate volunteer and sign up lists for community
            events, classrooms, and sports. Create events, add slots, share a
            link. No ads, no clutter.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="btn-primary-lg w-full sm:w-auto"
            >
              Create your first sign up
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

      <footer className="border-t border-charcoal/10 py-6">
        <div className="text-center text-sm text-muted space-y-1 font-body">
          <p>SignupSmartly — organize volunteers smartly.</p>
          <p>
            Brought to you by{' '}
            <a
              href="https://www.digitaleigh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-charcoal hover:underline"
            >
              Digitaleigh Co.
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
