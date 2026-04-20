import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi } from '@/lib/api';

export function useAssessments() {
  return useQuery({
    queryKey: ['assessments'],
    queryFn: assessmentsApi.list,
  });
}

export function useAssessment(id: number | null) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentsApi.getById(id!),
    enabled: id !== null,
  });
}

export function useSubmitAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answers }: { id: number; answers: Record<string, string | number> }) =>
      assessmentsApi.submit(id, answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-results'] }),
  });
}

export function useMyResults() {
  return useQuery({
    queryKey: ['my-results'],
    queryFn: assessmentsApi.getMyResults,
  });
}
