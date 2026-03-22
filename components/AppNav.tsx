'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase-browser';

const menuItems = [
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/whats-new', label: "What's New" },
  { href: '/contact', label: 'Submit Feedback' },
  { href: '/logout', label: 'Sign Out' },
] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </>
      )}
    </svg>
  );
}

export function AppNav() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      const name =
        (userRow as { name?: string } | null)?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        null;
      setUserName(name);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <nav className="border-b border-charcoal/10 bg-surface shadow-soft">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
        <Logo href="/dashboard" className="shrink-0 hover:text-muted" />
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/create-event"
            className="btn-primary shrink-0 whitespace-nowrap px-3 py-2 text-sm sm:px-4 sm:py-2.5"
          >
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create Signup</span>
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-charcoal/20 text-charcoal hover:bg-charcoal/5 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 transition-colors"
              aria-expanded={open}
              aria-haspopup="true"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <HamburgerIcon open={open} />
            </button>
            {open && (
              <div
                className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-charcoal/10 bg-surface py-2 shadow-soft-md"
                role="menu"
              >
                {userName && (
                  <>
                    <div className="px-4 py-3 text-sm font-medium text-muted font-body">
                      {userName}
                    </div>
                    <div className="border-t border-charcoal/10" />
                  </>
                )}
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block min-h-[44px] px-4 py-3 text-sm font-medium text-charcoal hover:bg-charcoal/5 font-body"
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
