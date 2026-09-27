export default function EventLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      {/* Event header skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-9 w-2/3 rounded-lg bg-charcoal/10" />
        <div className="h-5 w-40 rounded bg-charcoal/10" />
        <div className="h-4 w-32 rounded bg-charcoal/8" />
      </div>
      {/* Coverage meter skeleton */}
      <div className="mb-8 rounded-xl border border-charcoal/10 bg-surface p-5">
        <div className="h-4 w-24 rounded bg-charcoal/10 mb-3" />
        <div className="h-3 w-full rounded-full bg-charcoal/10" />
        <div className="h-4 w-36 rounded bg-charcoal/8 mt-2" />
      </div>
      {/* Slot card skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-charcoal/10 bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-36 rounded bg-charcoal/10" />
                <div className="h-4 w-24 rounded bg-charcoal/8" />
              </div>
              <div className="h-10 w-20 rounded-xl bg-charcoal/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
