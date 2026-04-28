export type Role = 'super_admin' | 'admin' | 'professor' | 'student';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  student_id: string;
  department: string;
  year: number;
  semester: number;
  cgpa: number;
  attendance_pct: number;
  risk_level: RiskLevel;
  full_name?: string;
  email?: string;
  request_status?: 'pending' | 'accepted' | 'none';
}

export interface AcademicRecord {
  id: string;
  student_id: string;
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
  id: string;
  title: string;
  type: 'mcq' | 'aptitude' | 'coding';
  questions: Question[];
  duration_mins: number;
  created_at: string;
}

export interface TestResult {
  id: string;
  student_id: string;
  assessment_id: string;
  score: number;
  max_score: number;
  completed_at: string;
  assessment?: Assessment;
}

export interface InterviewSession {
  id: string;
  student_id: string;
  type: 'technical' | 'hr' | 'behavioral';
  questions: string[];
  responses: string[];
  feedback: string;
  score: number;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
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
  id: string;
  filename: string;
  uploaded_at: string;
  records_count: number;
  status: 'success' | 'failed' | 'processing';
}

// ── MCQ Types ───────────────────────────────────────────────────────────────
export interface MCQQuestion {
  id: string;
  question_text: string;
  options: Record<string, string>;
  difficulty: string;
  domain: string;
}

export interface MCQAttempt {
  id: string;
  domain: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  completed: boolean;
  answers: Record<string, { answer: string; correct: boolean }>;
  started_at: string;
  completed_at: string | null;
}

export interface MCQStartResponse {
  attempt_id: string;
  questions: MCQQuestion[];
}

export interface MCQAnalytics {
  score: number;
  weak_count: number;
  strong_count: number;
  domain: string;
}

export interface MCQWarning {
  id: string;
  warning_type: string;
  severity: string;
  details: string | null;
  created_at: string;
}

export interface MCQEmotionLog {
  id: string;
  emotion: string;
  confidence: number;
  face_detected: boolean;
  face_count: number;
  created_at: string;
}

export interface MCQEmotionDistribution {
  emotion: string;
  count: number;
  percentage: number;
}

export interface MCQProctoringSummary {
  attempt_id: string;
  warning_total: number;
  warning_counts: Record<string, number>;
  warnings: MCQWarning[];
  dominant_emotion: string | null;
  emotion_total: number;
  emotion_distribution: MCQEmotionDistribution[];
  emotion_logs: MCQEmotionLog[];
  timeline: MCQWarning[];
}

export interface MCQFinalReport {
  score: number;
  weak_count: number;
  strong_count: number;
  domain: string;
  proctoring?: MCQProctoringSummary;
}

// ── Billing Types ───────────────────────────────────────────────────────────
export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  amount: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface PaymentDue {
  id: string;
  user_id: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  description: string;
  created_at: string;
}

export interface RevenueReport {
  total_revenue: number;
}

export interface ProfessorStudentMatrixRow extends Student {
  request_status: 'pending' | 'accepted' | 'none';
}

export interface BulkValidationError {
  row?: number;
  field?: string;
  message: string;
}

export interface InterviewDrive {
  id: string;
  company_name: string;
  role: string;
  ctc?: number | null;
  job_description?: string | null;
  link?: string | null;
  department?: string | null;
  status: string;
  created_at: string;
}

export interface InterviewDriveApplication {
  id: string;
  interview_id: string;
  student_id: string;
  resume_url?: string | null;
  status: string;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  bio: string | null;
  headline: string | null;
  resume_url: string | null;
  resume_score: number | null;
  resume_analysis_status: 'not_started' | 'processing' | 'completed' | 'failed';
  resume_analysis_summary: string | null;
  resume_analyzed_at: string | null;
  public_slug: string | null;
  is_public: boolean;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  education: any[];
  experience: any[];
  projects: any[];
  certifications: any[];
}

export interface PublicProfile {
  full_name: string;
  headline: string | null;
  bio: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  resume_url: string | null;
  resume_score: number | null;
  resume_analysis_status: string;
  resume_analysis_summary: string | null;
  education: any[];
  experience: any[];
  projects: any[];
  certifications: any[];
}
