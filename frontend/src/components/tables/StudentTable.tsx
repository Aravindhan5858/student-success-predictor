'use client';
import DataTable, { Column } from './DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRiskColor } from '@/lib/utils';
import type { Student } from '@/types';
import { Eye } from 'lucide-react';

interface Props {
  students: Student[];
  onView?: (student: Student) => void;
}

export default function StudentTable({ students, onView }: Props) {
  const columns: Column<Student>[] = [
    {
      key: 'full_name',
      header: 'Name',
      render: (s) => <span className="font-medium">{s.full_name || `Student #${s.student_id}`}</span>,
    },
    { key: 'student_id', header: 'Student ID' },
    { key: 'department', header: 'Department' },
    {
      key: 'cgpa',
      header: 'CGPA',
      render: (s) => <span className="font-mono">{s.cgpa?.toFixed(2)}</span>,
    },
    {
      key: 'attendance_pct',
      header: 'Attendance',
      render: (s) => <span>{s.attendance_pct?.toFixed(1)}%</span>,
    },
    {
      key: 'risk_level',
      header: 'Risk Level',
      render: (s) => (
        <Badge className={getRiskColor(s.risk_level)}>
          {s.risk_level?.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s) => onView ? (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(s); }}>
          <Eye className="h-4 w-4" />
        </Button>
      ) : null,
    },
  ];

  return (
    <DataTable<Student>
      data={students}
      columns={columns}
      searchKeys={['full_name', 'student_id', 'department']}
    />
  );
}
