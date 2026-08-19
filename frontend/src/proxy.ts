import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy to forward API requests to the backend server
 *
 * Target resolution order: BACKEND_ORIGIN, NEXT_PUBLIC_API_URL, then
 * http://127.0.0.1:${BACKEND_PORT ?? 5000}. Set BACKEND_ORIGIN when the backend
 * is not loopback-reachable from the Next server (e.g. a separate host).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle API and backend-served image requests
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/avatars/') ||
    pathname.startsWith('/chore-images/') ||
    // Backend writes job images under /job-images (JobsController); /chore-images
    // is the legacy path still present in older data.
    pathname.startsWith('/job-images/')
  ) {
    // Never derive the target from the request Host header: in a container that
    // resolves to the published frontend, not the backend, and every proxied
    // request 500s.
    const backendOrigin =
      process.env.BACKEND_ORIGIN ||
      process.env.NEXT_PUBLIC_API_URL ||
      `http://127.0.0.1:${process.env.BACKEND_PORT || '5000'}`;

    const backendUrl = `${backendOrigin}${pathname}${request.nextUrl.search}`;

    // Rewrite the request to the backend
    return NextResponse.rewrite(new URL(backendUrl));
  }

  // Let all other requests pass through to Next.js routing
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/avatars/:path*',
    '/chore-images/:path*',
    '/job-images/:path*',
  ],
};
