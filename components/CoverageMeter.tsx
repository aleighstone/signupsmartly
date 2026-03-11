interface CoverageMeterProps {
  filled: number;
  total: number;
  percentage: number;
  size?: 'sm' | 'md';
}

export function CoverageMeter({
  filled,
  total,
  percentage,
  size = 'md',
}: CoverageMeterProps) {
  const remaining = Math.max(0, total - filled);
  const barHeight = size === 'sm' ? 'h-2' : 'h-3';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">Volunteer Coverage</span>
        <span className="text-neutral-500 tabular-nums">{percentage}%</span>
      </div>
      <div
        className={`w-full bg-neutral-200 rounded-full overflow-hidden ${barHeight}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-neutral-500">
        {filled} of {total} roles filled
        {remaining > 0 && (
          <span className="ml-1 text-neutral-600 font-medium">
            · {remaining} still needed
          </span>
        )}
      </p>
    </div>
  );
}
