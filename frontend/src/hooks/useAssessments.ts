import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi } from '@/lib/api';
import type { Assessment, TestResult } from '@/types';

export function useAssessments() {
  return useQuery<Assessment[]>({
    queryKey: ['assessments'],
    queryFn: assessmentsApi.list,
  });
}

export function useAssessment(id: number | null) {
  return useQuery<Assessment>({
    queryKey: ['assessment', id],
    queryFn: () => assessmentsApi.getById(id!),
    enabled: id !== null,
  });
}

export function useSubmitAssessment() {
  const qc = useQueryClient();
  return useMutation<TestResult, Error, { id: number; answers: Record<string, string | number> }>({
    mutationFn: ({ id, answers }) =>
      assessmentsApi.submit(id, answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-results'] }),
  });
}

export function useMyResults() {
  return useQuery<TestResult[]>({
    queryKey: ['my-results'],
    queryFn: assessmentsApi.getMyResults,
  });
}
