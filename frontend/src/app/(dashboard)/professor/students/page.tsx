'use client';
import { useState } from 'react';
import { useStudents, useStudentPerformance } from '@/hooks/useStudents';
import StudentTable from '@/components/tables/StudentTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { getRiskColor, formatGrade } from '@/lib/utils';
import type { Student } from '@/types';
import { studentsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function StudentDetailModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const { data: performance, isLoading } = useStudentPerformance(student.id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student.full_name || student.student_id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Student ID:</span> <span className="font-medium">{student.student_id}</span></div>
            <div><span className="text-muted-foreground">Department:</span> <span className="font-medium">{student.department}</span></div>
            <div><span className="text-muted-foreground">Year:</span> <span className="font-medium">{student.year}</span></div>
            <div><span className="text-muted-foreground">Semester:</span> <span className="font-medium">{student.semester}</span></div>
            <div><span className="text-muted-foreground">CGPA:</span> <span className="font-medium">{student.cgpa?.toFixed(2)} ({formatGrade(student.cgpa)})</span></div>
            <div><span className="text-muted-foreground">Attendance:</span> <span className="font-medium">{student.attendance_pct?.toFixed(1)}%</span></div>
            <div>
              <span className="text-muted-foreground">Risk Level:</span>{' '}
              <Badge className={getRiskColor(student.risk_level)}>{student.risk_level?.toUpperCase()}</Badge>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Performance Trend</h4>
            {isLoading ? <LoadingSpinner size="sm" /> : performance?.length ? (
              <PerformanceChart data={performance} />
            ) : (
              <p className="text-muted-foreground text-sm">No performance data available</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfessorStudentsPage() {
  const { toast } = useToast();
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useStudents({
    risk_level: riskFilter !== 'all' ? riskFilter : undefined,
    size: 100,
  });

  const saveEdit = async () => {
    if (!editingStudent) return;
    setSaving(true);
    try {
      await studentsApi.update(editingStudent.id, {
        department: editingStudent.department,
        year: editingStudent.year,
        semester: editingStudent.semester,
        cgpa: editingStudent.cgpa,
        attendance_pct: editingStudent.attendance_pct,
        risk_level: editingStudent.risk_level,
      });
      toast({ title: 'Student updated' });
      setEditingStudent(null);
      refetch();
    } catch {
      toast({ title: 'Failed to update student', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground">View and manage student records</p>
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-card border rounded-lg p-6">
          <StudentTable
            students={data?.items ?? []}
            onView={(s) => setSelectedStudent(s)}
            onEdit={(s) => setEditingStudent({ ...s })}
          />
        </div>
      )}

      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}

      {editingStudent && (
        <Dialog open onOpenChange={() => setEditingStudent(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Department</label>
                <Input value={editingStudent.department ?? ''} onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Year</label>
                <Input type="number" value={editingStudent.year ?? 0} onChange={(e) => setEditingStudent({ ...editingStudent, year: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Semester</label>
                <Input type="number" value={editingStudent.semester ?? 0} onChange={(e) => setEditingStudent({ ...editingStudent, semester: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">CGPA</label>
                <Input type="number" step="0.01" value={editingStudent.cgpa ?? 0} onChange={(e) => setEditingStudent({ ...editingStudent, cgpa: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Attendance %</label>
                <Input type="number" step="0.1" value={editingStudent.attendance_pct ?? 0} onChange={(e) => setEditingStudent({ ...editingStudent, attendance_pct: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Risk</label>
                <Select value={editingStudent.risk_level} onValueChange={(v) => setEditingStudent({ ...editingStudent, risk_level: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
