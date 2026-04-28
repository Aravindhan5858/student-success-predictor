'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, from, to],
    queryFn: () => analyticsApi.getAuditLogs({ page, size: 20, from: from || undefined, to: to || undefined }),
  });

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'Action', render: (l) => <span className="font-medium font-mono text-sm">{l.action}</span> },
    { key: 'resource', header: 'Resource' },
    { key: 'user', header: 'User', render: (l) => l.user?.full_name ?? `User #${l.user_id}` },
    {
      key: 'details',
      header: 'Details',
      render: (l) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {JSON.stringify(l.details)}
        </span>
      ),
    },
    { key: 'created_at', header: 'Timestamp', render: (l) => <span className="text-sm">{formatDateTime(l.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-muted-foreground">Track all system activity</p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setFrom(''); setTo(''); setPage(1); }}>
            Clear Filters
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          <DataTable<AuditLog>
            data={data?.items ?? []}
            columns={columns}
            searchable={false}
            pageSize={20}
          />
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {data.pages} ({data.total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === data.pages}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
