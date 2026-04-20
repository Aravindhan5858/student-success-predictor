'use client';
import { TrendingUp, BookOpen, AlertTriangle, Star } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import PerformanceChart from '@/components/charts/PerformanceChart';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useMyStudent, useStudentPerformance } from '@/hooks/useStudents';
import { useAssessments } from '@/hooks/useAssessments';
import { getRiskColor, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const IMPROVEMENTS: Record<string, string[]> = {
  high: ['Attend all classes immediately', 'Seek academic counseling', 'Form study groups', 'Review past exam papers'],
  medium: ['Improve attendance to 85%+', 'Focus on weak subjects', 'Practice mock tests regularly'],
  low: ['Maintain current performance', 'Explore advanced topics', 'Participate in competitions'],
};

export default function StudentDashboard() {
  const { data: student, isLoading } = useMyStudent();
  const { data: performance, isLoading: loadingPerf } = useStudentPerformance(student?.id ?? null);
  const { data: assessments } = useAssessments();

  if (isLoading) return <LoadingSpinner />;

  const riskLevel = student?.risk_level ?? 'low';
  const improvements = IMPROVEMENTS[riskLevel];
  const upcoming = assessments?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Dashboard</h2>
        <p className="text-muted-foreground">Track your academic progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="CGPA" value={student?.cgpa?.toFixed(2) ?? '0.00'} icon={TrendingUp} />
        <StatCard title="Attendance" value={`${student?.attendance_pct?.toFixed(1) ?? 0}%`} icon={BookOpen} />
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
          <div className="mt-2">
            <Badge className={getRiskColor(riskLevel)}>{riskLevel.toUpperCase()}</Badge>
          </div>
        </div>
        <StatCard title="Semester" value={`Sem ${student?.semester ?? 1}`} icon={Star} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">CGPA Trend</h3>
          {loadingPerf ? <LoadingSpinner /> : performance?.length ? (
            <PerformanceChart data={performance} />
          ) : (
            <p className="text-muted-foreground text-sm">No performance data yet</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-3">Recommended Improvements</h3>
            <ul className="space-y-2">
              {improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Upcoming Assessments</h3>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/assessments">View All</Link>
              </Button>
            </div>
            {upcoming.length ? (
              <ul className="space-y-2">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-muted-foreground">{a.duration_mins} min</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No upcoming assessments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
