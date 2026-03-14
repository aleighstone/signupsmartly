'use client';

import { useState } from 'react';
import { usePostHog } from '@posthog/react';

interface SlotNeedingFill {
  role_name: string;
  needed: number;
}

interface CoverageWithStillNeededProps {
  filled: number;
  total: number;
  percentage: number;
  signupType: 'scheduled' | 'simple';
  slotsNeedingFill: SlotNeedingFill[];
}

export function CoverageWithStillNeeded({
  filled,
  total,
  percentage,
  signupType,
  slotsNeedingFill,
}: CoverageWithStillNeededProps) {
  const posthog = usePostHog();
  const [modalOpen, setModalOpen] = useState(false);
  const remaining = Math.max(0, total - filled);
  const label = signupType === 'simple' ? 'items' : 'spots';

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm font-body">
          <span className="font-medium text-charcoal">Coverage</span>
          <span className="text-muted tabular-nums">{percentage}%</span>
        </div>
        <div
          className="w-full h-2 bg-charcoal/10 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-sage rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-muted font-body">
          {filled} of {total} {label} filled
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => {
                if (posthog) {
                  posthog.capture('coverage_modal_opened', {
                    signup_type: signupType,
                    slots_still_needed: slotsNeedingFill.length,
                  });
                }
                setModalOpen(true);
              }}
              className="ml-1 text-charcoal font-medium hover:underline focus:outline-none focus:underline"
            >
              · {remaining} still needed
            </button>
          )}
        </p>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="still-needed-title"
        >
          <div
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
            <div className="flex items-start justify-between gap-4">
              <h2 id="still-needed-title" className="text-lg font-semibold text-charcoal font-heading">
                {label.charAt(0).toUpperCase() + label.slice(1)} still needed
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="shrink-0 rounded-full p-1 text-muted hover:text-charcoal hover:bg-charcoal/5 transition-colors"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-charcoal font-body">
              {slotsNeedingFill.map((slot, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{slot.role_name}</span>
                  <span className="text-muted tabular-nums">{slot.needed} needed</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
