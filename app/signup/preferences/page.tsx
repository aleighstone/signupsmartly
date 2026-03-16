import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSignupByCancelToken } from '@/lib/db';
import { PreferencesForm } from './PreferencesForm';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function PreferencesPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) notFound();

  const data = await getSignupByCancelToken(token);
  if (!data) notFound();

  const signup = data as {
    id: string;
    cancelled: boolean;
    reminder_opt_in: boolean;
    reminder_offset: '1_day' | 'morning_of';
    slots: {
      role_name: string;
      event?: {
        title: string;
        signup_type?: 'scheduled' | 'simple';
        start_date: string | null;
      } | null;
    };
  };

  if (signup.cancelled) {
    notFound();
  }

  const slot = signup.slots;
  const event = slot?.event;
  const isSimple = event?.signup_type === 'simple';

  return (
    <main className="min-h-screen bg-sand flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-charcoal font-heading">
            Reminder preferences
          </h1>
          <p className="mt-2 text-sm text-muted font-body">
            Update when you&apos;d like to be reminded about your{' '}
            <span className="font-medium text-charcoal">
              {isSimple ? 'item' : 'spot'}
            </span>{' '}
            for {event?.title}.
          </p>
        </div>

        <PreferencesForm
          token={token}
          initialOptIn={signup.reminder_opt_in}
          initialOffset={signup.reminder_offset}
          slotName={slot?.role_name}
          hasDate={!!event?.start_date}
        />

        <p className="text-center text-xs text-muted font-body">
          Organized with{' '}
          <Link
            href="/"
            className="font-medium text-charcoal hover:text-charcoal hover:underline"
          >
            SignupSmartly
          </Link>
        </p>
      </div>
    </main>
  );
}

