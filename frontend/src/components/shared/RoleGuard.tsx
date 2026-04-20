'use client';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!isAuthenticated || !user) return <LoadingSpinner />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <LoadingSpinner />;

  return <>{children}</>;
}
