import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { changelog } from '@/data/changelog';
import type { ChangeType } from '@/data/changelog';

function ChangeTag({ type }: { type: ChangeType }) {
  const styles: Record<ChangeType, string> = {
    new: 'bg-sage/15 text-sage',
    improved: 'bg-sky-100 text-sky-700',
    fixed: 'bg-amber-100 text-amber-700',
  };
  const labels: Record<ChangeType, string> = {
    new: 'New',
    improved: 'Improved',
    fixed: 'Fixed',
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium font-body ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

export default function WhatsNewPage() {
  return (
    <main className="min-h-screen flex flex-col bg-sand" data-page="whats-new">
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
          <h1 className="text-3xl font-semibold text-charcoal font-heading">
            What&apos;s new
          </h1>
          <p className="mt-2 text-muted font-body">
            The latest updates and improvements to SignupSmartly.
          </p>

          {changelog.map((release, idx) => (
            <section
              key={idx}
              className="mt-10 border-t border-charcoal/10 pt-8 first:border-0 first:mt-0 first:pt-0"
            >
              <time className="text-sm font-medium text-muted font-body">
                {release.date}
              </time>
              <ul className="mt-4 space-y-3">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0">
                      <ChangeTag type={change.type} />
                    </span>
                    <span className="text-charcoal font-body leading-relaxed flex-1 min-w-0">
                      {change.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>

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
