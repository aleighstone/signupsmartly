'use client';

import { useEffect } from 'react';

/** One fire per app user id per browser; avoids spamming Meta on every dashboard load. */
const storageKey = (userId: string) =>
  `signupsmartly_fb_CompleteRegistration_${userId}`;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires Meta Pixel standard event `CompleteRegistration` when an authenticated
 * user views the dashboard (first time per browser for that user id).
 */
export function TrackMetaCompleteRegistration({
  userId,
}: {
  userId: string | null;
}) {
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const key = storageKey(userId);
    try {
      if (window.localStorage.getItem(key)) return;
    } catch {
      /* private mode / blocked storage — still attempt one track for this mount */
    }

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'CompleteRegistration');
    }

    try {
      window.localStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }, [userId]);

  return null;
}
