import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSignupByCancelToken } from '@/lib/db';
import { getOrgBySlug } from '@/lib/org-branding';
import { CancelForm } from './CancelForm';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CancelPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) notFound();

  const data = await getSignupByCancelToken(token);
  if (!data) notFound();

  const signup = data as {
    id: string;
    name: string;
    slot_id: string;
    cancelled: boolean;
    slots: {
      role_name: string;
      start_time: string;
      end_time: string;
      event?: { title: string; location: string | null; signup_type?: 'scheduled' | 'simple' } | null;
    };
  };

  const slug = (await headers()).get('x-org-slug');
  const org = slug ? await getOrgBySlug(slug) : null;

  if (signup.cancelled) {
    return (
      <main className="min-h-screen bg-sand flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-2xl font-semibold text-charcoal font-heading">
            Signup cancelled 👌
          </h1>
          <p className="text-muted font-body">
            Your signup has been cancelled.
          </p>
          <Link
            href="/"
            className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors font-body ${!org?.primary_color ? 'bg-sage hover:bg-sage-hover' : 'hover:opacity-90'}`}
            style={org?.primary_color ? { backgroundColor: org.primary_color } : undefined}
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const slot = signup.slots;
  const event = slot?.event;

  return (
    <main className="min-h-screen bg-sand flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-charcoal font-heading">
            Cancel signup?
          </h1>
          <p className="mt-2 text-muted font-body">
            You&apos;re cancelling your spot as <strong>{slot?.role_name}</strong>{' '}
            for {event?.title}.
          </p>
        </div>

        <CancelForm cancelToken={token} signupType={event?.signup_type ?? 'scheduled'} />
      </div>
    </main>
  );
}
