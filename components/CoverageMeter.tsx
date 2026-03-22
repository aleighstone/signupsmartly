interface CoverageMeterProps {
  filled: number;
  total: number;
  percentage: number;
  size?: 'sm' | 'md';
  signupType?: 'scheduled' | 'simple';
  /** Override the bar color (e.g. org primary_color) */
  primaryColor?: string | null;
}

export function CoverageMeter({
  filled,
  total,
  percentage,
  size = 'md',
  signupType = 'scheduled',
  primaryColor,
}: CoverageMeterProps) {
  const remaining = Math.max(0, total - filled);
  const barHeight = size === 'sm' ? 'h-2' : 'h-3';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-body">
        <span className="font-medium text-charcoal">Coverage</span>
        <span className="text-muted tabular-nums">{percentage}%</span>
      </div>
      <div
        className={`w-full bg-charcoal/10 rounded-full overflow-hidden ${barHeight}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${!primaryColor ? 'bg-sage' : ''}`}
          style={{ width: `${percentage}%`, ...(primaryColor ? { backgroundColor: primaryColor } : {}) }}
        />
      </div>
      <p className="text-sm text-muted font-body">
        {filled} of {total} {signupType === 'simple' ? 'items' : 'spots'} filled
        {remaining > 0 && (
          <span className="ml-1 text-charcoal font-medium">
            · {remaining} still needed
          </span>
        )}
      </p>
    </div>
  );
}
