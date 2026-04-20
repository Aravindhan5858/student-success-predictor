'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/auth';
import type { Role } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  // Hydration guard: don't evaluate auth state until client has mounted
  // (Zustand persist rehydrates from localStorage only on client)
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardPath(user.role));
    }
  }, [hydrated, isAuthenticated, user, allowedRoles, router]);

  // Show spinner during hydration or while redirecting
  if (!hydrated) return <LoadingSpinner />;
  if (!isAuthenticated || !user) return <LoadingSpinner />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <LoadingSpinner />;

  return <>{children}</>;
}
