import Link from 'next/link';
import Image from 'next/image';

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-charcoal font-heading hover:opacity-90 transition-opacity"
          >
            <Image
              src="/smartly-icon.png"
              alt=""
              width={32}
              height={32}
              className="shrink-0"
              aria-hidden
            />
            SignupSmartly
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-charcoal font-heading">
            You&apos;re in!
          </h1>
          <p className="mt-1 text-sm text-muted font-body">
            Check your email to confirm your account and come back to sign in.
          </p>
        </div>

        <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
          <Link
            href="/login"
            className="btn-primary w-full flex items-center justify-center"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
