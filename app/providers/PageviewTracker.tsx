'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { usePostHog } from '@posthog/react';

export function PageviewTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      const url = typeof window !== 'undefined' ? window.location.href : pathname;
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, posthog]);

  return null;
}
