import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  TokenResponse, User, Student, Assessment, TestResult,
  InterviewSession, AuditLog, DashboardSummary, PaginatedResponse,
  PerformanceTrend, RiskDistribution, AttendanceTrend, UploadHistory,
} from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (!refreshToken) {
        // Don't hard-redirect on background/prefetch calls — let the component handle it
        const url = original.url ?? '';
        const isSilent = url.includes('/auth/me') || url.includes('/students/me');
        if (typeof window !== 'undefined' && !isSilent) window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post<TokenResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (data: { full_name: string; email: string; password: string; role: string }) =>
    api.post<User>('/auth/register', data).then((r) => r.data),
  refresh: (refresh_token: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const usersApi = {
  list: (params?: { role?: string; page?: number; size?: number }) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),
  getById: (id: number) => api.get<User>(`/users/${id}`).then((r) => r.data),
  create: (data: Partial<User> & { password: string }) =>
    api.post<User>('/users', data).then((r) => r.data),
  update: (id: number, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const studentsApi = {
  list: (params?: { department?: string; risk_level?: string; page?: number; size?: number; search?: string }) =>
    api.get<PaginatedResponse<Student>>('/students', { params }).then((r) => r.data),
  getById: (id: number) => api.get<Student>(`/students/${id}`).then((r) => r.data),
  getMe: () => api.get<Student>('/students/me').then((r) => r.data),
  getPerformance: (id: number) =>
    api.get<PerformanceTrend[]>(`/students/${id}/performance`).then((r) => r.data),
};

export const academicApi = {
  uploadCSV: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ message: string; records: number }>('/academic/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / (e.total || 1))),
    }).then((r) => r.data);
  },
  getRecords: (studentId: number) =>
    api.get(`/academic/records/${studentId}`).then((r) => r.data),
  getAttendance: (params?: { student_id?: number }) =>
    api.get<AttendanceTrend[]>('/academic/attendance', { params }).then((r) => r.data),
  getUploadHistory: () =>
    api.get<UploadHistory[]>('/academic/uploads').then((r) => r.data),
};

export const assessmentsApi = {
  list: () => api.get<Assessment[]>('/assessments').then((r) => r.data),
  getById: (id: number) => api.get<Assessment>(`/assessments/${id}`).then((r) => r.data),
  create: (data: Partial<Assessment>) =>
    api.post<Assessment>('/assessments', data).then((r) => r.data),
  submit: (id: number, answers: Record<string, string | number>) =>
    api.post<TestResult>(`/assessments/${id}/submit`, { answers }).then((r) => r.data),
  getResults: (id: number) =>
    api.get<TestResult[]>(`/assessments/${id}/results`).then((r) => r.data),
  getMyResults: () => api.get<TestResult[]>('/assessments/my-results').then((r) => r.data),
};

export const interviewsApi = {
  startSession: (type: string) =>
    api.post<InterviewSession>('/interviews/start', { type }).then((r) => r.data),
  getSession: (id: number) =>
    api.get<InterviewSession>(`/interviews/${id}`).then((r) => r.data),
  respond: (id: number, responses: string[]) =>
    api.post<InterviewSession>(`/interviews/${id}/respond`, { responses }).then((r) => r.data),
  complete: (id: number) =>
    api.post<InterviewSession>(`/interviews/${id}/complete`).then((r) => r.data),
  getMySessions: () =>
    api.get<InterviewSession[]>('/interviews/my-sessions').then((r) => r.data),
};

export const analyticsApi = {
  getDashboard: () =>
    api.get<DashboardSummary>('/analytics/dashboard').then((r) => r.data),
  getPerformance: () =>
    api.get<PerformanceTrend[]>('/analytics/performance').then((r) => r.data),
  getRiskDistribution: () =>
    api.get<RiskDistribution>('/analytics/risk-distribution').then((r) => r.data),
  getAttendanceTrends: () =>
    api.get<AttendanceTrend[]>('/analytics/attendance-trends').then((r) => r.data),
  getAuditLogs: (params?: { page?: number; size?: number; from?: string; to?: string }) =>
    api.get<PaginatedResponse<AuditLog>>('/analytics/audit-logs', { params }).then((r) => r.data),
};

export const filesApi = {
  upload: (file: File, folder?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    return api.post<{ url: string; public_id: string }>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  delete: (publicId: string) =>
    api.delete(`/files/${encodeURIComponent(publicId)}`).then((r) => r.data),
  getMine: () => api.get('/files/mine').then((r) => r.data),
};

export default api;
