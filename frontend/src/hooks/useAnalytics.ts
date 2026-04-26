import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import type { DashboardSummary, RiskDistribution, PerformanceTrend, AttendanceTrend } from '@/types';

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: analyticsApi.getDashboard,
  });
}

export function useRiskDistribution() {
  return useQuery<RiskDistribution>({
    queryKey: ['risk-distribution'],
    queryFn: analyticsApi.getRiskDistribution,
  });
}

export function usePerformanceTrends() {
  return useQuery<PerformanceTrend[]>({
    queryKey: ['performance-trends'],
    queryFn: analyticsApi.getPerformance,
  });
}

export function useAttendanceTrends() {
  return useQuery<AttendanceTrend[]>({
    queryKey: ['attendance-trends'],
    queryFn: analyticsApi.getAttendanceTrends,
  });
}
