export type Role = 'admin' | 'professor' | 'student';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: number;
  user_id: number;
  student_id: string;
  department: string;
  year: number;
  semester: number;
  cgpa: number;
  attendance_pct: number;
  risk_level: RiskLevel;
  full_name?: string;
  email?: string;
}

export interface AcademicRecord {
  id: number;
  student_id: number;
  course_id: string;
  semester: number;
  marks: number;
  grade: string;
  attendance: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text';
  options?: string[];
  correct_option?: number;
}

export interface Assessment {
  id: number;
  title: string;
  type: 'mcq' | 'aptitude' | 'coding';
  questions: Question[];
  duration_mins: number;
  created_at: string;
}

export interface TestResult {
  id: number;
  student_id: number;
  assessment_id: number;
  score: number;
  max_score: number;
  completed_at: string;
  assessment?: Assessment;
}

export interface InterviewSession {
  id: number;
  student_id: number;
  type: 'technical' | 'hr' | 'behavioral';
  questions: string[];
  responses: string[];
  feedback: string;
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: User;
}

export interface DashboardSummary {
  total_students: number;
  total_professors: number;
  at_risk_count: number;
  avg_cgpa: number;
  recent_uploads: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface PerformanceTrend {
  semester: string;
  cgpa: number;
  attendance: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface AttendanceTrend {
  month: string;
  attendance: number;
  course?: string;
}

export interface UploadHistory {
  id: number;
  filename: string;
  uploaded_at: string;
  records_count: number;
  status: 'success' | 'failed' | 'processing';
}
