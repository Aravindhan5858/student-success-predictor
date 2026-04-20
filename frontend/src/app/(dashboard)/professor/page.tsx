'use client';
import { GraduationCap, AlertTriangle, Upload, TrendingUp } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import StudentTable from '@/components/tables/StudentTable';
import AttendanceChart from '@/components/charts/AttendanceChart';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useStudents } from '@/hooks/useStudents';
import { useAttendanceTrends } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfessorDashboard() {
  const { data: studentsData, isLoading } = useStudents({ size: 10 });
  const { data: attendanceData, isLoading: loadingAttendance } = useAttendanceTrends();

  const atRiskCount = studentsData?.items?.filter((s) => s.risk_level === 'high').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Professor Dashboard</h2>
          <p className="text-muted-foreground">Monitor your students&apos; progress</p>
        </div>
        <Button asChild>
          <Link href="/professor/upload"><Upload className="h-4 w-4 mr-2" /> Upload Data</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="My Students" value={studentsData?.total ?? 0} icon={GraduationCap} />
        <StatCard title="At-Risk Students" value={atRiskCount} icon={AlertTriangle} iconClassName="bg-red-100" />
        <StatCard title="Avg CGPA" value={
          studentsData?.items?.length
            ? (studentsData.items.reduce((s, st) => s + (st.cgpa || 0), 0) / studentsData.items.length).toFixed(2)
            : '0.00'
        } icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Attendance Trends</h3>
          {loadingAttendance ? <LoadingSpinner /> : attendanceData?.length ? (
            <AttendanceChart data={attendanceData} />
          ) : (
            <p className="text-muted-foreground text-sm">No attendance data available</p>
          )}
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Students</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href="/professor/students">View All</Link>
            </Button>
          </div>
          {isLoading ? <LoadingSpinner /> : (
            <StudentTable students={studentsData?.items ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
