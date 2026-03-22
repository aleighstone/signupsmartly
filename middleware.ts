import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'mail', 'smtp']);

function getSubdomain(host: string): string | null {
  const hostname = host.split(':')[0];
  // Match *.signupsmartly.com
  let match = hostname.match(/^([^.]+)\.signupsmartly\.com$/);
  if (match) {
    const subdomain = match[1];
    if (RESERVED_SUBDOMAINS.has(subdomain)) return null;
    return subdomain;
  }
  // Match *.localhost for local dev (e.g. falconstrack.localhost:3000)
  match = hostname.match(/^([^.]+)\.localhost$/);
  if (match) {
    const subdomain = match[1];
    if (RESERVED_SUBDOMAINS.has(subdomain)) return null;
    return subdomain;
  }
  return null;
}

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const slug = getSubdomain(host);
  const { pathname } = request.nextUrl;

  if (slug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-org-slug', slug);

    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = `/org/${slug}`;
      const response = NextResponse.rewrite(url, { headers: requestHeaders });
      return refreshSupabaseSession(request, response);
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return refreshSupabaseSession(request, response);
  }

  const response = NextResponse.next({ request: { headers: request.headers } });
  return refreshSupabaseSession(request, response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
