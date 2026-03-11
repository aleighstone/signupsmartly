import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#fafafa]">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold text-neutral-900">
            SignupSmartly
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
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
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Volunteer signups,
            <br />
            <span className="text-neutral-600">without the noise</span>
          </h1>

          <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
            A cleaner way to coordinate volunteers for sports teams, schools,
            and community events. Create events, add slots, share a link.
            No ads, no clutter.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-neutral-900 px-6 py-3.5 text-base font-medium text-white hover:bg-neutral-800 sm:w-auto"
            >
              Create your first event
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-neutral-300 bg-white px-6 py-3.5 text-base font-medium text-neutral-700 hover:bg-neutral-50 sm:w-auto"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-16 grid gap-6 text-left sm:grid-cols-2 sm:gap-8">
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="font-semibold text-neutral-900">
                For organizers
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Create events, define time slots and roles, and share one link.
                See coverage at a glance and export rosters.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="font-semibold text-neutral-900">
                For volunteers
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                View open slots, sign up in seconds, and get a confirmation
                email with a cancel link if plans change.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-6">
        <div className="text-center text-sm text-neutral-500 space-y-1">
          <p>SignupSmartly — organize volunteers simply.</p>
          <p>
            Brought to you by{' '}
            <a
              href="https://www.digitaleigh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:underline"
            >
              Digitaleigh Co.
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
