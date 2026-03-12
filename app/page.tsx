import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-sand">
      <header className="border-b border-charcoal/10 bg-surface shadow-soft">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-charcoal font-body"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover transition-colors font-body"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-2xl text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/under-construction.png"
              alt="Under construction"
              width={600}
              height={120}
              className="max-w-full h-auto"
              priority
            />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl font-heading">
            Volunteer signups,
            <br />
            <span className="text-muted">without the noise</span>
          </h1>

          <p className="mt-6 text-lg text-muted leading-relaxed font-body">
            A cleaner way to coordinate volunteers for sports teams, schools,
            and community events. Create events, add slots, share a link.
            No ads, no clutter.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-sage px-6 py-3.5 text-base font-medium text-white hover:bg-sage-hover transition-colors sm:w-auto font-body"
            >
              Create your first event
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border-2 border-charcoal bg-transparent px-6 py-3.5 text-base font-medium text-charcoal hover:bg-charcoal/5 transition-colors sm:w-auto font-body"
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
                Create events, define time slots and roles, and share one link.
                See coverage at a glance and export rosters.
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
          <p>SignupSmartly — organize volunteers simply.</p>
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
