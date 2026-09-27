import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getSignupByCancelToken } from '@/lib/db';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CancelPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) notFound();

  const data = await getSignupByCancelToken(token);
  if (!data) notFound();

  const signup = data as unknown as { slots: { event_id: string } };
  const eventId = signup.slots.event_id;
  if (!eventId) notFound();

  redirect(`/event/${eventId}?cancel=${token}`);
}
