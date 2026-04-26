import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};
// lowercase alias used by useAuth hook
export const authApi = authAPI;

// ── Corrections ───────────────────────────────────────────────────────────────
export const correctionsAPI = {
  create: (data: any) => api.post("/corrections", data),
  list: () => api.get("/corrections"),
  review: (id: string, status: string, note?: string) =>
    api.patch(`/corrections/${id}/review`, { status, review_note: note }),
};

// ── Campus Interviews ─────────────────────────────────────────────────────────
export const campusInterviewsAPI = {
  create: (data: any) => api.post("/campus-interviews", data),
  list: (department?: string) => api.get("/campus-interviews", { params: { department } }),
  apply: (id: string, resume?: File) => {
    const formData = new FormData();
    if (resume) formData.append("resume", resume);
    return api.post(`/campus-interviews/${id}/apply`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getApplications: (id: string) => api.get(`/campus-interviews/${id}/applications`),
};

// ── Proctoring ────────────────────────────────────────────────────────────────
export const proctoringAPI = {
  logViolation: (sessionId: string, type: string, details?: string) =>
    api.post("/proctoring/violations", { session_id: sessionId, violation_type: type, details }),
  getViolations: (sessionId: string) => api.get(`/proctoring/violations/${sessionId}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  createCollege: (data: any) => api.post("/admin/colleges", data),
  listColleges: () => api.get("/admin/colleges"),
  getStats: () => api.get("/admin/stats"),
  getAuditLogs: (limit = 100) => api.get("/admin/audit-logs", { params: { limit } }),
  suspendUser: (userId: string, reason: string) =>
    api.patch(`/admin/users/${userId}/suspend`, { reason }),
};

// ── Professor ─────────────────────────────────────────────────────────────────
export const professorAPI = {
  uploadStudents: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/professor/upload-students", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getSampleCSV: () => api.get("/professor/sample-csv", { responseType: "text" }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: async () => {
    const { data } = await api.get("/analytics/dashboard");
    return data;
  },
  getRiskDistribution: async () => {
    const { data } = await api.get("/analytics/risk-distribution");
    return data;
  },
  getPerformance: async () => {
    const { data } = await api.get("/analytics/performance");
    return data;
  },
  getAttendanceTrends: async () => {
    const { data } = await api.get("/analytics/attendance-trends");
    return data;
  },
  getAuditLogs: async (params?: { page?: number; size?: number; from?: string; to?: string }) => {
    const { data } = await api.get("/audit-logs", { params });
    return data;
  },
};

// ── Assessments ───────────────────────────────────────────────────────────────
export const assessmentsApi = {
  list: async () => {
    const { data } = await api.get("/assessments");
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/assessments/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post("/assessments", payload);
    return data;
  },
  submit: async (id: number, answers: Record<string, string | number>) => {
    const { data } = await api.post(`/assessments/${id}/submit`, { answers });
    return data;
  },
  getMyResults: async () => {
    const { data } = await api.get("/assessments/my-results");
    return data;
  },
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  list: async (filters?: { department?: string; risk_level?: string; page?: number; size?: number; search?: string }) => {
    const { data } = await api.get("/students", { params: filters });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },
  getMe: async () => {
    const { data } = await api.get("/students/me");
    return data;
  },
  getPerformance: async (id: number) => {
    const { data } = await api.get(`/students/${id}/performance`);
    return data;
  },
};

// ── Academic / CSV Upload ─────────────────────────────────────────────────────
export const academicApi = {
  uploadCSV: async (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/academic/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return data;
  },
  getUploadHistory: async () => {
    const { data } = await api.get("/academic/upload-history");
    return data;
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: async (params?: { role?: string }) => {
    const { data } = await api.get("/users", { params });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

// ── Interviews ────────────────────────────────────────────────────────────────
export const interviewsApi = {
  getMySessions: async () => {
    const { data } = await api.get("/interviews/my-sessions");
    return data;
  },
  startSession: async (type: string) => {
    const { data } = await api.post("/interviews/start", { type });
    return data;
  },
  respond: async (sessionId: number, responses: string[]) => {
    const { data } = await api.post(`/interviews/${sessionId}/respond`, { responses });
    return data;
  },
  complete: async (sessionId: number) => {
    const { data } = await api.post(`/interviews/${sessionId}/complete`);
    return data;
  },
};

export default api;
