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
    <main className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          You&apos;re signed up!
        </h1>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left space-y-4">
          <div>
            <p className="text-sm text-neutral-500">Role</p>
            <p className="font-medium text-neutral-900">{slot.role_name}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Time</p>
            <p className="font-medium text-neutral-900">{timeRange}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Event</p>
            <p className="font-medium text-neutral-900">{event.title}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Location</p>
            <p className="font-medium text-neutral-900">
              {event.location || 'TBD'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 min-h-[44px]"
          >
            Add to Calendar
          </a>
          <Link
            href={cancelUrl}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 min-h-[44px]"
          >
            Cancel signup
          </Link>
        </div>

        <p className="text-sm text-neutral-400">
          Organized with{' '}
          <Link href="/" className="hover:text-neutral-600">
            SignupSmartly
          </Link>
        </p>
      </div>
    </main>
  );
}
