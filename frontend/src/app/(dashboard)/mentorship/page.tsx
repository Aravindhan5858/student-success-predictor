'use client';
import { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Mentorship {
  id: number;
  mentor: { full_name: string; email: string };
  mentee: { full_name: string; email: string };
  started_at: string;
  status: string;
}
interface MentorshipRequest {
  id: number;
  sender: { full_name: string; email: string };
  message: string;
  created_at: string;
}

export default function MentorshipPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isStudent = user?.role === 'student';

  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [m, r] = await Promise.all([
        api.get('/mentorships').then((res) => res.data),
        api.get('/mentorship/requests').then((res) => res.data),
      ]);
      setMentorships(Array.isArray(m) ? m : m.items ?? []);
      setRequests(Array.isArray(r) ? r : r.items ?? []);
    } catch {
      toast({ title: 'Failed to load mentorships', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const endMentorship = async (id: number) => {
    if (!confirm('End this mentorship?')) return;
    try {
      await api.post(`/mentorship/${id}/end`);
      setMentorships((prev) => prev.filter((m) => m.id !== id));
      toast({ title: 'Mentorship ended' });
    } catch {
      toast({ title: 'Failed to end mentorship', variant: 'destructive' });
    }
  };

  const respond = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/mentorship/${id}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (action === 'approve') load();
      toast({ title: action === 'approve' ? 'Request accepted' : 'Request rejected' });
    } catch {
      toast({ title: 'Failed to respond', variant: 'destructive' });
    }
  };

  const submitRequest = async () => {
    if (!form.email.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/mentorship/request', { email: form.email, message: form.message });
      toast({ title: 'Request sent' });
      setDialogOpen(false);
      setForm({ email: '', message: '' });
    } catch {
      toast({ title: 'Failed to send request', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mentorship</h2>
          <p className="text-muted-foreground">
            {isStudent ? 'Connect with professors for guidance' : 'Guide students in their journey'}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {isStudent ? 'Find Mentor' : 'Invite Student'}
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <Users className="h-4 w-4 mr-1" /> My Mentorships ({mentorships.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {mentorships.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">No active mentorships</p>
          )}
          {mentorships.map((m) => {
            const other = isStudent ? m.mentor : m.mentee;
            return (
              <div key={m.id} className="bg-card border rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{other?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{other?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Started {new Date(m.started_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => endMentorship(m.id)}>
                  End
                </Button>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {requests.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">No pending requests</p>
          )}
          {requests.map((r) => (
            <div key={r.id} className="bg-card border rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.sender?.full_name}</p>
                <p className="text-xs text-muted-foreground">{r.sender?.email}</p>
                {r.message && <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{r.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => respond(r.id, 'approve')}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => respond(r.id, 'reject')}>Reject</Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Request/Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isStudent ? 'Find a Mentor' : 'Invite a Student'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>{isStudent ? 'Professor Email' : 'Student Email'}</Label>
              <Input
                type="email"
                placeholder={isStudent ? 'professor@university.edu' : 'student@university.edu'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <textarea
                rows={3}
                placeholder="Introduce yourself or explain what you're looking for..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={submitting || !form.email.trim()}>
              {submitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
