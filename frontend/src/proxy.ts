import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an API, avatars, or chore-images request
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/avatars/') ||
    pathname.startsWith('/chore-images/')
  ) {
    // Determine backend URL
    let backendUrl: string;

    if (process.env.NEXT_PUBLIC_API_URL) {
      // Use explicitly configured backend
      backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${pathname}${request.nextUrl.search}`;
    } else {
      // Default to host-based routing
      // Use BACKEND_PORT env var (defaults to 5000 for Docker, 5197 for dev)
      const host = request.headers.get('host') || 'localhost:3000';
      const hostname = host.split(':')[0];
      const backendPort = process.env.BACKEND_PORT || '5000';
      backendUrl = `http://${hostname}:${backendPort}${pathname}${request.nextUrl.search}`;
    }

    // Rewrite to the backend
    return NextResponse.rewrite(new URL(backendUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/avatars/:path*', '/chore-images/:path*'],
};
