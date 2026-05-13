'use client';

import { useEffect } from 'react';
import { usePostHog } from '@posthog/react';

export function TrackSignupsPageView({
  signupType,
  totalSignups,
  coveragePct,
}: {
  signupType: 'scheduled' | 'simple' | 'availability';
  totalSignups: number;
  coveragePct: number;
}) {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      posthog.capture('signups_page_viewed', {
        signup_type: signupType,
        total_signups: totalSignups,
        coverage_pct: coveragePct,
      });
    }
  }, [posthog, signupType, totalSignups, coveragePct]);
  return null;
}

export function TrackDashboardView({ eventCount }: { eventCount: number }) {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      posthog.capture('dashboard_viewed', { event_count: eventCount });
    }
  }, [posthog, eventCount]);
  return null;
}

export function TrackEventPageView({
  signupType,
  coveragePct,
  openSlots,
}: {
  signupType: 'scheduled' | 'simple' | 'availability';
  coveragePct: number;
  openSlots: number;
}) {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      posthog.capture('event_page_viewed', {
        signup_type: signupType,
        coverage_pct: coveragePct,
        open_slots: openSlots,
      });
    }
  }, [posthog, signupType, coveragePct, openSlots]);
  return null;
}

export function TrackSignupSubmitted({
  signupType,
  hasComment,
}: {
  signupType: 'scheduled' | 'simple' | 'availability';
  hasComment: boolean;
}) {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      posthog.capture('signup_submitted', {
        signup_type: signupType,
        has_comment: hasComment,
      });
    }
  }, [posthog, signupType, hasComment]);
  return null;
}
