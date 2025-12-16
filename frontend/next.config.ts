import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5197';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/avatars/:path*',
        destination: `${backend}/avatars/:path*`,
      },
      {
        source: '/chore-images/:path*',
        destination: `${backend}/chore-images/:path*`,
      },
    ];
  },
};

export default nextConfig;
