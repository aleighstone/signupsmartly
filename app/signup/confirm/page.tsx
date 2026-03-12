import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { generateAddToCalendarUrl } from '@/lib/calendar';
import { formatTimeRange } from '@/lib/calendar';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  if (!id) notFound();

  const { data: signup, error } = await supabase
    .from('signups')
    .select(`
      *,
      slots (
        *,
        events (*)
      )
    `)
    .eq('id', id)
    .eq('cancelled', false)
    .single();

  if (error || !signup) notFound();

  type SignupWithRelations = {
    name: string;
    cancel_token: string;
    slots?: unknown;
  };
  const signupTyped = signup as SignupWithRelations;
  const slotData = signupTyped.slots;
  const slot = Array.isArray(slotData) ? slotData[0] : slotData;
  const eventData = slot && (slot as { events?: unknown }).events;
  const event = Array.isArray(eventData) ? eventData[0] : eventData;

  if (!slot || !event) notFound();

  const calendarUrl = generateAddToCalendarUrl({
    event,
    slot,
    volunteerName: signupTyped.name,
  });
  const cancelUrl = `/signup/cancel?token=${signupTyped.cancel_token}`;
  const timeRange = formatTimeRange(slot.start_time, slot.end_time);

  return (
    <main className="min-h-screen bg-sand flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-semibold text-charcoal font-heading">
          You&apos;re signed up!
        </h1>

        <div className="rounded-xl border border-charcoal/10 bg-surface p-6 text-left space-y-4 shadow-soft">
          <div>
            <p className="text-sm text-muted font-body">Role</p>
            <p className="font-medium text-charcoal font-body">{slot.role_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted font-body">Time</p>
            <p className="font-medium text-charcoal font-body">{timeRange}</p>
          </div>
          <div>
            <p className="text-sm text-muted font-body">Event</p>
            <p className="font-medium text-charcoal font-body">{event.title}</p>
          </div>
          <div>
            <p className="text-sm text-muted font-body">Location</p>
            <p className="font-medium text-charcoal font-body">
              {event.location || 'TBD'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-sage px-4 py-3 text-sm font-medium text-white hover:bg-sage-hover focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 min-h-[44px] transition-colors font-body"
          >
            Add to Calendar
          </a>
          <Link
            href={cancelUrl}
            className="inline-flex items-center justify-center rounded-xl border-2 border-charcoal bg-transparent px-4 py-3 text-sm font-medium text-charcoal hover:bg-charcoal/5 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2 min-h-[44px] transition-colors font-body"
          >
            Cancel signup
          </Link>
        </div>

        <p className="text-sm text-muted font-body">
          Organized with{' '}
          <Link href="/" className="hover:text-charcoal transition-colors">
            SignupSmartly
          </Link>
        </p>
      </div>
    </main>
  );
}
