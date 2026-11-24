import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PANEL_HOST } from '@/lib/panel';

const isOwnerPath = (p: string) => p === '/owner' || p.startsWith('/owner/');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onPanel = request.headers.get('host') === PANEL_HOST;
  let rewriteTo: URL | null = null;

  if (onPanel && !pathname.startsWith('/auth') && !pathname.startsWith('/.well-known')) {
    if (isOwnerPath(pathname)) {
      // panel.spootme.pl/owner/menu → panel.spootme.pl/menu
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice('/owner'.length) || '/';
      return NextResponse.redirect(url, 308);
    }
    rewriteTo = request.nextUrl.clone();
    rewriteTo.pathname = `/owner${pathname === '/' ? '' : pathname}`;
  } else if (!onPanel && process.env.PANEL_LIVE === '1' && isOwnerPath(pathname)) {
    // Stary adres spootme.pl/owner → subdomena. Włączane zmienną dopiero, gdy DNS subdomeny działa.
    const path = pathname.slice('/owner'.length) || '/';
    return NextResponse.redirect(`https://${PANEL_HOST}${path}${request.nextUrl.search}`, 308);
  }

  const respond = () =>
    rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request });

  let supabaseResponse = respond();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = respond();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this line
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|bejbi|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
