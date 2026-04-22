interface CoverageMeterProps {
  filled: number;
  total: number;
  percentage: number;
  size?: 'sm' | 'md';
  signupType?: 'scheduled' | 'simple';
  /** Override the bar color (e.g. org primary_color) */
  primaryColor?: string | null;
  /** Public event page: use --theme-primary from injected signup theme */
  volunteerPageThemed?: boolean;
}

export function CoverageMeter({
  filled,
  total,
  percentage,
  size = 'md',
  signupType = 'scheduled',
  primaryColor,
  volunteerPageThemed,
}: CoverageMeterProps) {
  const remaining = Math.max(0, total - filled);
  const barHeight = size === 'sm' ? 'h-2' : 'h-3';
  const themeColorStyle = volunteerPageThemed
    ? { color: 'var(--theme-primary)' }
    : primaryColor
      ? { color: primaryColor }
      : undefined;

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
          className={`h-full rounded-full transition-all duration-300 ${
            volunteerPageThemed || primaryColor ? '' : 'bg-sage'
          }`}
          style={{
            width: `${percentage}%`,
            ...(volunteerPageThemed
              ? { backgroundColor: 'var(--theme-primary)' }
              : primaryColor
                ? { backgroundColor: primaryColor }
                : {}),
          }}
        />
      </div>
      <p className="text-sm text-charcoal font-body">
        {filled} of {total} {signupType === 'simple' ? 'items' : 'spots'} filled
        {remaining > 0 && (
          <span
            className={`ml-1 font-semibold ${volunteerPageThemed || primaryColor ? '' : 'text-sage'}`}
            style={themeColorStyle}
          >
            · {remaining} still needed
          </span>
        )}
      </p>
    </div>
  );
}
