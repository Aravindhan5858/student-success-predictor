'use client';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, DollarSign, Activity, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatCard from '@/components/shared/StatCard';
import { superAdminApi, billingApi } from '@/lib/api';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery<any>({ queryKey: ['sa-stats'], queryFn: superAdminApi.getStats });
  const { data: colleges, isLoading: loadingColleges } = useQuery<any[]>({ queryKey: ['sa-colleges'], queryFn: superAdminApi.listColleges });
  const { data: revenue } = useQuery<{ total_revenue: number }>({ queryKey: ['sa-revenue'], queryFn: billingApi.getRevenue });
  const { data: payments } = useQuery<any[]>({ queryKey: ['sa-payments'], queryFn: billingApi.listPayments });
  const { data: dues } = useQuery<any[]>({ queryKey: ['sa-dues'], queryFn: billingApi.listDues });
  const { data: logs } = useQuery<any>({ queryKey: ['sa-logs'], queryFn: () => superAdminApi.getAuditLogs({ page: 1, size: 5 }) });

  if (loadingStats) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Platform-wide management & analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.total_students ?? 0} icon={Users} />
        <StatCard title="Colleges" value={colleges?.length ?? 0} icon={Building2} />
        <StatCard title="Total Revenue" value={`₹${(revenue?.total_revenue ?? 0).toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Active Sessions" value={stats?.active_sessions ?? 0} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {!payments?.length ? <p className="text-sm text-muted-foreground">No payments yet</p> : (
              <div className="space-y-3">
                {(payments ?? []).slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">₹{p.amount}</p>
                      <p className="text-xs text-muted-foreground">{p.payment_method}</p>
                    </div>
                    <Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Dues */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-500" /> Outstanding Dues</CardTitle></CardHeader>
          <CardContent>
            {!dues?.length ? <p className="text-sm text-muted-foreground">No outstanding dues</p> : (
              <div className="space-y-3">
                {(dues ?? []).slice(0, 5).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">₹{d.amount}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                    </div>
                    <Badge variant="destructive">Due</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Recent System Logs</CardTitle></CardHeader>
        <CardContent>
          {!logs?.items?.length ? <p className="text-sm text-muted-foreground">No logs</p> : (
            <div className="space-y-2">
              {logs.items.map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="text-xs">{l.action}</Badge>
                  <span className="text-sm flex-1 truncate">{l.resource}</span>
                  <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
