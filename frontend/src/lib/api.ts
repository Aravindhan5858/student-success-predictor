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
  login: (identifier: string, password: string) => api.post("/auth/login", { identifier, password }),
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
  update: (id: string, payload: any) => api.put(`/campus-interviews/${id}`, payload),
  close: (id: string) => api.post(`/campus-interviews/${id}/close`),
  updateApplicationStatus: (applicationId: string, status: string) =>
    api.patch(`/campus-interviews/applications/${applicationId}/status`, { status }),
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
  suspendUser: (userId: string, reason: string, hours = 24) =>
    api.post(`/admin/users/${userId}/suspend`, { reason, hours }),
  unsuspendUser: (userId: string) =>
    api.post(`/admin/users/${userId}/unsuspend`),
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
  downloadSampleTemplate: () => api.get("/professor/sample-template", { responseType: "blob" }),
  downloadAcademicTemplate: () => api.get("/professor/sample-academic-template", { responseType: "blob" }),
  getStudentMatrix: async (params?: { department?: string; risk_level?: string; page?: number; size?: number; search?: string }) => {
    const { data } = await api.get("/professor/student-matrix", { params });
    return data;
  },
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
    const { data } = await api.get("/analytics/audit-logs", { params });
    return data;
  },
};

// ── Assessments ───────────────────────────────────────────────────────────────
export const assessmentsApi = {
  list: async () => {
    const { data } = await api.get("/assessments");
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/assessments/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post("/assessments", payload);
    return data;
  },
  submit: async (id: string, answers: Record<string, string | number>) => {
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
    const { data } = await api.get("/professor/student-matrix", { params: filters });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },
  getMe: async () => {
    const { data } = await api.get("/students/me");
    return data;
  },
  getPerformance: async (id: string) => {
    const { data } = await api.get(`/students/${id}/performance`);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/students/${id}`, payload);
    return data;
  },
};

// ── Academic / CSV Upload ─────────────────────────────────────────────────────
export const academicApi = {
  uploadCSV: async (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/academic/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return data;
  },
  getUploadHistory: async () => {
    const { data } = await api.get("/academic/uploads");
    return data;
  },
  listRecords: async (studentId?: string) => {
    const { data } = await api.get("/academic/records", { params: { student_id: studentId } });
    return data;
  },
  createRecord: async (payload: any) => {
    const { data } = await api.post("/academic/records", payload);
    return data;
  },
  updateRecord: async (id: string, payload: any) => {
    const { data } = await api.put(`/academic/records/${id}`, payload);
    return data;
  },
  deleteRecord: async (id: string) => {
    const { data } = await api.delete(`/academic/records/${id}`);
    return data;
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: async (params?: { role?: string }) => {
    const { data } = await api.get("/users", { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  get: async () => {
    const { data } = await api.get("/profile");
    return data;
  },
  update: async (payload: any) => {
    const { data } = await api.put("/profile", payload);
    return data;
  },
  uploadResume: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/profile/resume", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  analyzeResume: async () => {
    const { data } = await api.post("/profile/resume/analyze");
    return data;
  },
  setPublicVisibility: async (isPublic: boolean) => {
    const { data } = await api.patch("/profile/public-visibility", { is_public: isPublic });
    return data;
  },
  regeneratePublicSlug: async () => {
    const { data } = await api.post("/profile/public-slug/regenerate");
    return data;
  },
  getPublicProfile: async (slug: string) => {
    const { data } = await api.get(`/public/profile/${slug}`);
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
  respond: async (sessionId: string, responses: string[]) => {
    const { data } = await api.post(`/interviews/${sessionId}/respond`, { responses });
    return data;
  },
  complete: async (sessionId: string) => {
    const { data } = await api.post(`/interviews/${sessionId}/complete`);
    return data;
  },
};

// ── MCQ Testing ───────────────────────────────────────────────────────────────
export const mcqApi = {
  start: async (domain: string, numQuestions = 10) => {
    const { data } = await api.post("/mcq/start", { domain, num_questions: numQuestions });
    return data;
  },
  submitAnswer: async (attemptId: string, questionId: string, answer: string) => {
    const { data } = await api.post("/mcq/submit", { attempt_id: attemptId, question_id: questionId, answer });
    return data;
  },
  complete: async (attemptId: string) => {
    const { data } = await api.post(`/mcq/complete/${attemptId}`);
    return data;
  },
  listAttempts: async () => {
    const { data } = await api.get("/mcq/attempts");
    return data;
  },
  getAnalytics: async (attemptId: string) => {
    const { data } = await api.get(`/mcq/analytics/${attemptId}`);
    return data;
  },
  logWarning: async (attemptId: string, warningType: string, severity = "medium", details?: string) => {
    const { data } = await api.post("/mcq/proctoring/warning", {
      attempt_id: attemptId,
      warning_type: warningType,
      severity,
      details,
    });
    return data;
  },
  logEmotion: async (
    attemptId: string,
    emotion: string,
    confidence: number,
    faceDetected: boolean,
    faceCount: number
  ) => {
    const { data } = await api.post("/mcq/proctoring/emotion", {
      attempt_id: attemptId,
      emotion,
      confidence,
      face_detected: faceDetected,
      face_count: faceCount,
    });
    return data;
  },
  getProctoringReport: async (attemptId: string) => {
    const { data } = await api.get(`/mcq/proctoring/${attemptId}`);
    return data;
  },
};

// ── Billing ───────────────────────────────────────────────────────────────────
export const billingApi = {
  createSubscription: async (planName: string, amount: number, durationDays: number) => {
    const { data } = await api.post("/billing/subscriptions", { plan_name: planName, amount, duration_days: durationDays });
    return data;
  },
  listSubscriptions: async () => {
    const { data } = await api.get("/billing/subscriptions");
    return data;
  },
  createPayment: async (amount: number, paymentMethod: string, subscriptionId?: string) => {
    const { data } = await api.post("/billing/payments", { amount, payment_method: paymentMethod, subscription_id: subscriptionId });
    return data;
  },
  listPayments: async () => {
    const { data } = await api.get("/billing/payments");
    return data;
  },
  listDues: async () => {
    const { data } = await api.get("/billing/dues");
    return data;
  },
  getRevenue: async () => {
    const { data } = await api.get("/billing/revenue");
    return data;
  },
};

// ── Super Admin ───────────────────────────────────────────────────────────────
export const superAdminApi = {
  getStats: async () => {
    const { data } = await api.get("/admin/stats");
    return data;
  },
  listColleges: async () => {
    const { data } = await api.get("/admin/colleges");
    return data;
  },
  createCollege: async (payload: any) => {
    const { data } = await api.post("/admin/colleges", payload);
    return data;
  },
  getAuditLogs: async (params?: { page?: number; size?: number }) => {
    const { data } = await api.get("/admin/audit-logs", { params });
    return data;
  },
  suspendUser: async (userId: string, reason: string, hours = 24) => {
    const { data } = await api.post(`/admin/users/${userId}/suspend`, { reason, hours });
    return data;
  },
};

export default api;
