'use client';

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
}: CoverageWithStillNeededProps) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-surface px-5 py-4 shadow-soft">
      <div className="flex items-center gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 text-[13px] font-semibold text-charcoal font-body">Coverage</div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-charcoal/10"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-sage" style={{ width: `${percentage}%` }} />
          </div>
          <p className="mt-[5px] text-xs text-muted font-body">
            {filled} of {total} spots filled
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[28px] font-bold leading-none text-charcoal font-body">{percentage}%</div>
          <div className="mt-0.5 text-[11px] text-muted font-body">filled</div>
        </div>
      </div>
    </div>
  );
}
