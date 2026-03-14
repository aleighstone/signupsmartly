'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePostHog } from '@posthog/react';

type NpsStep = 'score' | 'comment' | 'thankyou';

export function NpsBanner() {
  const [step, setStep] = useState<NpsStep>('score');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const posthog = usePostHog();

  const track = useCallback(
    (event: string, props?: Record<string, unknown>) => {
      if (posthog) posthog.capture(event, props);
    },
    [posthog]
  );

  useEffect(() => {
    if (step === 'score') track('nps_banner_shown');
  }, [step, track]);

  useEffect(() => {
    if (step !== 'thankyou') return;
    const timer = setTimeout(() => {
      setIsDismissed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [step]);

  const handleScoreClick = (n: number) => {
    setScore(n);
    track('nps_score_selected', { score: n });
    setStep('comment');
  };

  const handleDismiss = async () => {
    track('nps_dismissed', { step });
    setIsSubmitting(true);
    try {
      await fetch('/api/nps/dismiss', { method: 'POST' });
      setIsDismissed(true);
    } catch {
      // Still dismiss locally on error
      setIsDismissed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (withComment: boolean) => {
    if (score === null) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/nps/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          comment: withComment ? comment.trim() || null : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');
      if (withComment) {
        track('nps_comment_submitted', { score, has_comment: !!comment.trim() });
      } else {
        track('nps_score_only_submitted', { score });
      }
      setStep('thankyou');
    } catch {
      // Could show error toast - spec doesn't require it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendFeedback = () => handleSubmit(true);
  const handleSkip = () => handleSubmit(false);

  if (isDismissed) return null;

  if (step === 'thankyou') {
    return (
      <div
        className="rounded-xl border border-sage/20 bg-sage/10 p-5 shadow-soft"
        role="status"
        aria-live="polite"
      >
        <p className="font-semibold text-charcoal font-heading text-[1.1rem]">
          Thanks for the feedback! 🙏
        </p>
        <p className="mt-1 text-muted font-body">
          It really helps us make SignupSmartly better.
        </p>
      </div>
    );
  }

  if (step === 'score') {
    return (
      <div
        className="rounded-xl border border-sage/20 bg-sage/10 p-5 shadow-soft"
        role="region"
        aria-label="NPS Survey"
      >
        <div className="flex items-start justify-between gap-4">
          <h4 className="font-semibold text-charcoal font-heading text-[1.1rem] leading-tight">
            How likely are you to recommend SignupSmartly to a friend or colleague?
          </h4>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="shrink-0 text-muted hover:text-charcoal transition-colors p-0.5 leading-none text-xl"
            aria-label="Close survey"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 justify-between">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleScoreClick(n)}
              className="nps-btn h-[42px] w-[42px] shrink-0 rounded-full border border-[#E4E4E7] bg-surface text-charcoal font-medium text-base font-body flex items-center justify-center shadow-sm hover:bg-sage hover:text-white hover:border-sage hover:-translate-y-0.5 transition-all"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[0.85rem] text-muted font-body">
          <span>Not likely at all</span>
          <span>Extremely likely</span>
        </div>
      </div>
    );
  }

  // step === 'comment'
  return (
    <div
      className="rounded-xl border border-sage/20 bg-sage/10 p-5 shadow-soft"
      role="region"
      aria-label="NPS Survey"
    >
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-semibold text-charcoal font-heading text-[1.1rem] leading-tight">
          What&apos;s the main reason for your score?
        </h4>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isSubmitting}
          className="shrink-0 text-muted hover:text-charcoal transition-colors p-0.5 leading-none text-xl"
          aria-label="Close survey"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-muted font-body text-sm">You selected: {score}</p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us what you think..."
        rows={3}
        className="mt-3 w-full min-h-[80px] rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body resize-none"
        disabled={isSubmitting}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-muted text-[0.9rem] font-body hover:text-charcoal transition-colors no-underline"
        >
          Skip, just submit my score
        </button>
        <button
          type="button"
          onClick={handleSendFeedback}
          disabled={isSubmitting}
          className="btn-primary"
        >
          Send feedback
        </button>
      </div>
    </div>
  );
}
