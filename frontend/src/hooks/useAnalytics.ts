import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: analyticsApi.getDashboard,
  });
}

export function useRiskDistribution() {
  return useQuery({
    queryKey: ['risk-distribution'],
    queryFn: analyticsApi.getRiskDistribution,
  });
}

export function usePerformanceTrends() {
  return useQuery({
    queryKey: ['performance-trends'],
    queryFn: analyticsApi.getPerformance,
  });
}

export function useAttendanceTrends() {
  return useQuery({
    queryKey: ['attendance-trends'],
    queryFn: analyticsApi.getAttendanceTrends,
  });
}
