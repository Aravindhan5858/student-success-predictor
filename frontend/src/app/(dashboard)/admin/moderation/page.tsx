'use client';
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  suspension_reason?: string;
}

interface ContentRow {
  id: string;
  content: string;
  author: string;
  status: string;
}

interface LogRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  actor: string;
  reason: string;
  timestamp: string;
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<UserRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendHours, setSuspendHours] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/users', { params });
      let items: UserRow[] = data.items ?? data;
      if (statusFilter === 'active') items = items.filter((u) => u.is_active);
      if (statusFilter === 'suspended') items = items.filter((u) => !u.is_active);
      setUsers(items);
    } catch {}
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSuspend() {
    if (!suspendTarget) return;
    setLoading(true);
    try {
      await api.post(`/users/${suspendTarget.id}/suspend`, {
        reason: suspendReason,
        hours: Number(suspendHours) || undefined,
      });
      setSuspendTarget(null);
      setSuspendReason('');
      setSuspendHours('');
      fetchUsers();
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsuspend(id: string) {
    await api.post(`/users/${id}/unsuspend`);
    fetchUsers();
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <select
          className="border rounded px-2 py-1 text-sm bg-background"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="professor">Professor</option>
          <option value="student">Student</option>
        </select>
        <select
          className="border rounded px-2 py-1 text-sm bg-background"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.full_name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell className="capitalize">{u.role}</TableCell>
              <TableCell>
                {u.is_active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                ) : (
                  <span title={u.suspension_reason ?? ''}>
                    <Badge variant="destructive">Suspended</Badge>
                  </span>
                )}
              </TableCell>
              <TableCell>
                {u.is_active ? (
                  <Button size="sm" variant="destructive" onClick={() => setSuspendTarget(u)}>
                    Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleUnsuspend(u.id)}>
                    Unsuspend
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!suspendTarget} onOpenChange={() => setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspendTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Reason for suspension"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Duration (hours, leave blank for indefinite)"
              value={suspendHours}
              onChange={(e) => setSuspendHours(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={loading || !suspendReason}>
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Content Tab ───────────────────────────────────────────────────────────────
function ContentTab() {
  const [subTab, setSubTab] = useState<'questions' | 'answers'>('questions');
  const [items, setItems] = useState<ContentRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ContentRow | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const endpoint = subTab === 'questions' ? '/questions' : '/answers';
      const { data } = await api.get(endpoint);
      setItems(data.items ?? data);
    } catch {}
  }, [subTab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await api.post('/moderation/delete', {
        target_type: subTab === 'questions' ? 'question' : 'answer',
        target_id: deleteTarget.id,
        reason: deleteReason,
      });
      setDeleteTarget(null);
      setDeleteReason('');
      fetchItems();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        {(['questions', 'answers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-3 py-1 rounded text-sm capitalize ${
              subTab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-xs truncate">{item.content}</TableCell>
              <TableCell>{item.author}</TableCell>
              <TableCell>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(item)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {subTab === 'questions' ? 'Question' : 'Answer'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground truncate">{deleteTarget?.content}</p>
          <Input
            placeholder="Reason for deletion"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading || !deleteReason}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get('/moderation/logs', { params });
      setLogs(data.items ?? data);
    } catch {}
  }, [from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <>
      <div className="flex gap-2 mb-4 items-center">
        <label className="text-sm text-muted-foreground">From</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <label className="text-sm text-muted-foreground">To</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Target Type</TableHead>
            <TableHead>Target ID</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.target_type}</TableCell>
              <TableCell>{log.target_id}</TableCell>
              <TableCell>{log.actor}</TableCell>
              <TableCell className="max-w-xs truncate">{log.reason}</TableCell>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ModerationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Moderation</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="content" className="mt-4"><ContentTab /></TabsContent>
        <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
