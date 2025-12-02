'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AdminGuard component that protects content for admin users only.
 * Non-admin users will see the fallback content or be redirected.
 */
export function AdminGuard({
  children,
  fallback,
  redirectTo,
}: AdminGuardProps) {
  const { isAdmin, isLoading, user } = useAuth();
  const router = useRouter();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please sign in to access this content.
          </p>
        </div>
      )
    );
  }

  // If user is not an admin
  if (!isAdmin) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground">
            You do not have permission to access this content.
          </p>
        </div>
      )
    );
  }

  // User is an admin, render children
  return <>{children}</>;
}

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}
