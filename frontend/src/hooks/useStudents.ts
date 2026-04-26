import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '@/lib/api';
import type { Student, PaginatedResponse, PerformanceTrend } from '@/types';

interface StudentFilters {
  department?: string;
  risk_level?: string;
  page?: number;
  size?: number;
  search?: string;
}

export function useStudents(filters?: StudentFilters) {
  return useQuery<PaginatedResponse<Student>>({
    queryKey: ['students', filters],
    queryFn: () => studentsApi.list(filters),
  });
}

export function useStudent(id: number | null) {
  return useQuery<Student>({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getById(id!),
    enabled: id !== null,
  });
}

export function useMyStudent() {
  return useQuery<Student>({
    queryKey: ['student', 'me'],
    queryFn: () => studentsApi.getMe(),
  });
}

export function useStudentPerformance(id: number | null) {
  return useQuery<PerformanceTrend[]>({
    queryKey: ['student-performance', id],
    queryFn: () => studentsApi.getPerformance(id!),
    enabled: id !== null,
  });
}
