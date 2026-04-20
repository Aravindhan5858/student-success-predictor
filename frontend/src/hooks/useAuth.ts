'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/auth';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push(getDashboardPath(data.user.role));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { full_name: string; email: string; password: string; role: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(data);
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push('/login');
  };

  return { login, logout, register, isLoading, error, user, isAuthenticated };
}
