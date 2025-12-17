'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'kiosk';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requireRole && role !== requireRole) {
      // User is authenticated but doesn't have the required role
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/kiosk');
      }
    }
  }, [isAuthenticated, isLoading, role, requireRole, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render until authentication is confirmed
  if (!isAuthenticated || (requireRole && role !== requireRole)) {
    return null;
  }

  return <>{children}</>;
}
