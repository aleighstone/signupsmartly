import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { reportProductionError } from '@/lib/error-reporter';

const META_GRAPH_VERSION = 'v21.0';

const bodySchema = z.discriminatedUnion('event_name', [
  z.object({
    event_name: z.literal('CompleteRegistration'),
    event_id: z.string().uuid(),
    event_source_url: z.string().url().max(2048).optional(),
  }),
  z.object({
    event_name: z.literal('ViewContent'),
    event_id: z.string().uuid(),
    event_source_url: z.string().url().max(2048).optional(),
    content_name: z.string().max(200).optional(),
  }),
]);

function pixelId(): string {
  return (
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    process.env.META_PIXEL_ID ||
    '943508228261211'
  );
}

/** Reject CAPI payloads that don’t match our site (mitigate open relay abuse). */
function isAllowedEventSourceUrl(urlStr: string): boolean {
  let host: string;
  try {
    host = new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
  const allowed = new Set([
    'signupsmartly.com',
    'www.signupsmartly.com',
    'localhost',
    '127.0.0.1',
  ]);
  if (allowed.has(host)) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const h = new URL(appUrl).hostname.replace(/^www\./, '');
      return h === host || host.endsWith('.vercel.app');
    } catch {
      /* ignore */
    }
  }
  return host.endsWith('.vercel.app');
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  if (body.event_name === 'CompleteRegistration' && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event_name, event_id, event_source_url } = body;
  const viewContentName =
    body.event_name === 'ViewContent' ? body.content_name : undefined;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://www.signupsmartly.com';
  const sourceUrl =
    event_source_url ||
    (event_name === 'CompleteRegistration'
      ? `${appUrl.replace(/\/$/, '')}/dashboard`
      : `${appUrl.replace(/\/$/, '')}/`);

  if (!isAllowedEventSourceUrl(sourceUrl)) {
    return NextResponse.json({ error: 'Invalid event_source_url' }, { status: 400 });
  }

  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!accessToken) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[meta/capi] META_CAPI_ACCESS_TOKEN is not set; skipping server event'
      );
    }
    return NextResponse.json({ ok: true, sent: false, reason: 'no_token' });
  }

  const event_time = Math.floor(Date.now() / 1000);

  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined;
  const clientUa = request.headers.get('user-agent') || undefined;

  const user_data: Record<string, string> = {};
  if (clientIp) user_data.client_ip_address = clientIp;
  if (clientUa) user_data.client_user_agent = clientUa;

  const graphUrl = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId()}/events`
  );
  graphUrl.searchParams.set('access_token', accessToken);

  const eventPayload: Record<string, unknown> = {
    event_name,
    event_time,
    event_id,
    action_source: 'website',
    event_source_url: sourceUrl,
  };
  if (event_name === 'ViewContent' && viewContentName) {
    eventPayload.custom_data = { content_name: viewContentName };
  }
  if (Object.keys(user_data).length > 0) {
    eventPayload.user_data = user_data;
  }

  const payload = { data: [eventPayload] };

  try {
    const fbRes = await fetch(graphUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const fbJson = (await fbRes.json()) as {
      events_received?: number;
      error?: { message?: string; code?: number };
    };

    if (!fbRes.ok || fbJson.error) {
      const msg =
        fbJson.error?.message || `Meta CAPI HTTP ${fbRes.status}`;
      await reportProductionError({
        error: new Error(msg),
        extra: { event_name, event_id, code: fbJson.error?.code },
      });
      return NextResponse.json(
        { ok: false, error: 'Upstream error' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      events_received: fbJson.events_received ?? 0,
    });
  } catch (e) {
    await reportProductionError({
      error: e instanceof Error ? e : new Error(String(e)),
      extra: { event_name, event_id },
    });
    return NextResponse.json(
      { ok: false, error: 'Request failed' },
      { status: 502 }
    );
  }
}
