"use client";
import { Users, GraduationCap, AlertTriangle, TrendingUp } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import RiskDistributionChart from "@/components/charts/RiskDistributionChart";
import PerformanceChart from "@/components/charts/PerformanceChart";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  useDashboardSummary,
  useRiskDistribution,
  usePerformanceTrends,
} from "@/hooks/useAnalytics";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardSummary = {
  total_students: number;
  total_professors: number;
  at_risk_count: number;
  avg_cgpa: number;
};

type RiskDistribution = {
  low: number;
  medium: number;
  high: number;
};

interface AuditLogUser {
  full_name?: string | null;
}

interface AuditLog {
  id: number | string;
  action: string;
  resource: string;
  user?: AuditLogUser | null;
  user_id: number | string;
  created_at: string;
}

interface AuditLogsResponse {
  items: AuditLog[];
}

export default function AdminDashboard() {
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const dashboardSummary = summary as Partial<DashboardSummary> | undefined;
  const { data: riskData, isLoading: loadingRisk } = useRiskDistribution();
  const riskDistribution = riskData as Partial<RiskDistribution> | undefined;
  const { data: perfData, isLoading: loadingPerf } = usePerformanceTrends();
  const { data: logsData } = useQuery<AuditLogsResponse>({
    queryKey: ["audit-logs-recent"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/audit-logs", {
        params: { page: 1, size: 5 },
      });
      return data;
    },
  });

  if (loadingSummary) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={dashboardSummary?.total_students ?? 0}
          icon={GraduationCap}
        />
        <StatCard
          title="Total Professors"
          value={dashboardSummary?.total_professors ?? 0}
          icon={Users}
        />
        <StatCard
          title="At-Risk Students"
          value={dashboardSummary?.at_risk_count ?? 0}
          icon={AlertTriangle}
          iconClassName="bg-red-100"
        />
        <StatCard
          title="Average CGPA"
          value={dashboardSummary?.avg_cgpa?.toFixed(2) ?? "0.00"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Risk Distribution</h3>
          {loadingRisk ? (
            <LoadingSpinner />
          ) : typeof riskDistribution?.low === "number" &&
            typeof riskDistribution?.medium === "number" &&
            typeof riskDistribution?.high === "number" ? (
            <RiskDistributionChart
              data={riskDistribution as RiskDistribution}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No data</p>
          )}
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Performance Trends</h3>
          {loadingPerf ? (
            <LoadingSpinner />
          ) : perfData ? (
            <PerformanceChart data={perfData as any} />
          ) : (
            <p className="text-muted-foreground text-sm">No data</p>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recent Audit Logs</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsData?.items?.length ? (
                logsData.items.map((log: AuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      {log.user?.full_name ?? `User #${log.user_id}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-4"
                  >
                    No recent activity
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
