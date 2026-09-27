import { AppLayout } from '@/components/AppLayout';

export default function DashboardLoading() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-7 w-36 rounded-lg bg-charcoal/10" />
          <div className="h-10 w-32 rounded-xl bg-charcoal/10" />
        </div>
        {/* Card skeletons */}
        <ul className="space-y-4">
          {[1, 2, 3].map((i) => (
            <li key={i} className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 rounded bg-charcoal/10" />
                  <div className="h-4 w-32 rounded bg-charcoal/8" />
                </div>
                <div className="h-8 w-8 rounded-xl bg-charcoal/10" />
              </div>
              <div className="mt-4 h-3 w-full rounded-full bg-charcoal/10" />
              <div className="mt-5 flex justify-end gap-3">
                <div className="h-10 w-28 rounded-xl bg-charcoal/10" />
                <div className="h-10 w-28 rounded-xl bg-charcoal/10" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
}
