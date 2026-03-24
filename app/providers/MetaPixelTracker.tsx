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

    const eventId = crypto.randomUUID();

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'CompleteRegistration', {}, { eventID: eventId });
    }

    void fetch('/api/meta/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        event_name: 'CompleteRegistration',
        event_id: eventId,
        event_source_url: window.location.href,
      }),
    });

    try {
      window.localStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }, [userId]);

  return null;
}

/**
 * ViewContent for key marketing pages — pixel + CAPI with matching event_id.
 * Anonymous visitors are allowed (CAPI route does not require auth for ViewContent).
 */
export function TrackMetaViewContent({
  contentName,
}: {
  contentName: string;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eventId = crypto.randomUUID();

    if (typeof window.fbq === 'function') {
      window.fbq(
        'track',
        'ViewContent',
        { content_name: contentName },
        { eventID: eventId }
      );
    }

    void fetch('/api/meta/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        event_name: 'ViewContent',
        event_id: eventId,
        event_source_url: window.location.href,
        content_name: contentName,
      }),
    });
  }, [contentName]);

  return null;
}
