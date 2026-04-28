import type { Role } from '@/types';

export function getDashboardPath(role: Role): string {
  switch (role) {
    case 'super_admin': return '/super-admin';
    case 'admin': return '/admin';
    case 'professor': return '/professor';
    case 'student': return '/student';
    default: return '/student';
  }
}

export function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
