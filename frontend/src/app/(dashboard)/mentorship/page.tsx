'use client';
import { useEffect, useState, useRef } from 'react';
import { UserPlus, Users, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface UserResult { id: string; full_name: string; email: string; role: string }
interface Mentorship { id: string; mentor: UserResult; mentee: UserResult; started_at: string; status: string }
interface MentorshipRequest { id: string; sender: UserResult; message: string; created_at: string }

export default function MentorshipPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isStudent = user?.role === 'student';
  const searchRole = isStudent ? 'professor' : 'student';

  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSelectedUser(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/users/search', { params: { q: val, role: searchRole } });
        setSearchResults(data);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectUser = (u: UserResult) => {
    setSelectedUser(u);
    setSearchQuery(u.full_name);
    setShowDropdown(false);
  };

  const submitRequest = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.post('/mentorship/request', { to_user_id: selectedUser.id, message });
      toast({ title: 'Request sent!' });
      setDialogOpen(false);
      setSearchQuery(''); setSelectedUser(null); setMessage('');
    } catch (e: any) {
      toast({ title: e?.response?.data?.detail ?? 'Failed to send request', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/mentorship/${id}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (action === 'approve') load();
      toast({ title: action === 'approve' ? 'Accepted!' : 'Rejected' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  };

  const endMentorship = async (id: string) => {
    if (!confirm('End this mentorship?')) return;
    try {
      await api.delete(`/mentorships/${id}`);
      setMentorships((prev) => prev.filter((m) => m.id !== id));
      toast({ title: 'Mentorship ended' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
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
          <TabsTrigger value="active"><Users className="h-4 w-4 mr-1" />My Mentorships ({mentorships.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests {requests.length > 0 && <Badge className="ml-1 h-5 px-1.5 text-xs">{requests.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {mentorships.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No active mentorships</p>}
          {mentorships.map((m) => {
            const other = isStudent ? m.mentor : m.mentee;
            return (
              <div key={m.id} className="bg-card border rounded-lg p-4 flex items-center justify-between gap-4 transition-colors hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {other?.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{other?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{other?.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Since {new Date(m.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => endMentorship(m.id)}>
                  End
                </Button>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {requests.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No pending requests</p>}
          {requests.map((r) => (
            <div key={r.id} className="bg-card border rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {r.sender?.full_name?.[0] ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{r.sender?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.sender?.email}</p>
                  {r.message && <p className="text-sm mt-1.5 text-muted-foreground line-clamp-2 italic">"{r.message}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => respond(r.id, 'approve')}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => respond(r.id, 'reject')}>Reject</Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Request Dialog with search dropdown */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setSearchQuery(''); setSelectedUser(null); setMessage(''); setSearchResults([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isStudent ? 'Find a Mentor' : 'Invite a Student'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5" ref={searchRef}>
              <Label>{isStudent ? 'Search Professor' : 'Search Student'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder={isStudent ? 'Search by name or email...' : 'Search student by name or email...'}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-3 transition-colors"
                        onClick={() => selectUser(u)}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {u.full_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchResults.length === 0 && searchQuery.length > 1 && !searching && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-lg px-3 py-2.5 text-sm text-muted-foreground">
                    No {searchRole}s found
                  </div>
                )}
              </div>
              {selectedUser && (
                <div className="flex items-center gap-2 mt-1 p-2 bg-primary/5 border border-primary/20 rounded-md">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                    {selectedUser.full_name[0]}
                  </div>
                  <span className="text-sm font-medium">{selectedUser.full_name}</span>
                  <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Message <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <textarea
                rows={3}
                placeholder="Introduce yourself or explain what you're looking for..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={submitting || !selectedUser}>
              {submitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
