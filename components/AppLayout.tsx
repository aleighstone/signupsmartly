import Link from 'next/link';
import { Logo } from '@/components/Logo';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-sand font-body">
      <nav className="border-b border-charcoal/10 bg-surface shadow-soft">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
          <Logo href="/dashboard" className="shrink-0 hover:text-muted" />
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/logout"
              className="text-sm font-medium text-muted hover:text-charcoal transition-colors whitespace-nowrap"
            >
              Sign out
            </Link>
            <Link
              href="/create-event"
              className="btn-primary shrink-0 whitespace-nowrap px-3 py-2 text-sm sm:px-4 sm:py-2.5"
            >
              <span className="sm:hidden">Create</span>
              <span className="hidden sm:inline">Create Signup</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
