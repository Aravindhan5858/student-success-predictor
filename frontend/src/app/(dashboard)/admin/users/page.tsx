'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegisterForm from '@/components/forms/RegisterForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { getRoleBadgeColor, formatDate } from '@/lib/utils';
import type { User } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => usersApi.list(roleFilter !== 'all' ? { role: roleFilter } : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: () => toast({ title: 'Failed to delete user', variant: 'destructive' }),
  });

  const columns: Column<User>[] = [
    { key: 'full_name', header: 'Name', render: (u) => <span className="font-medium">{u.full_name}</span> },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge className={getRoleBadgeColor(u.role)}>{u.role}</Badge>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.is_active ? 'default' : 'secondary'}>
          {u.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'created_at', header: 'Joined', render: (u) => formatDate(u.created_at) },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this user?')) deleteMutation.mutate(u.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage all system users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <RegisterForm onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['users'] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={roleFilter} onValueChange={setRoleFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="professor">Professor</TabsTrigger>
          <TabsTrigger value="student">Student</TabsTrigger>
        </TabsList>
        <TabsContent value={roleFilter} className="mt-4">
          {isLoading ? <LoadingSpinner /> : (
            <DataTable<User>
              data={data?.items ?? []}
              columns={columns}
              searchKeys={['full_name', 'email']}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
