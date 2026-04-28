'use client';

import { useEffect, useState } from 'react';
import { campusInterviewsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { InterviewDrive, InterviewDriveApplication } from '@/types';

export default function ProfessorInterviewDrivesPage() {
  const { toast } = useToast();
  const [drives, setDrives] = useState<InterviewDrive[]>([]);
  const [selected, setSelected] = useState<InterviewDrive | null>(null);
  const [applications, setApplications] = useState<InterviewDriveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company_name: '', role: '', job_description: '', department: '', link: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await campusInterviewsAPI.list();
      setDrives(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Failed to load interview drives', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDrive = async () => {
    try {
      await campusInterviewsAPI.create(form);
      setForm({ company_name: '', role: '', job_description: '', department: '', link: '' });
      toast({ title: 'Interview drive created' });
      load();
    } catch {
      toast({ title: 'Failed to create drive', variant: 'destructive' });
    }
  };

  const openApplications = async (drive: InterviewDrive) => {
    setSelected(drive);
    try {
      const { data } = await campusInterviewsAPI.getApplications(drive.id);
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    }
  };

  const updateAppStatus = async (id: string, status: string) => {
    try {
      await campusInterviewsAPI.updateApplicationStatus(id, status);
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const closeDrive = async (id: string) => {
    try {
      await campusInterviewsAPI.close(id);
      toast({ title: 'Drive closed' });
      load();
    } catch {
      toast({ title: 'Failed to close drive', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Interview Drives</h2>
        <p className="text-muted-foreground">Create and manage upcoming interview drives</p>
      </div>

      <div className="bg-card border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        <Input placeholder="JD Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <Input className="md:col-span-2" placeholder="Job Description" value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} />
        <Button onClick={createDrive}>Create Drive</Button>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        {loading ? <p className="text-muted-foreground">Loading...</p> : drives.map((d) => (
          <div key={d.id} className="border rounded-md p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{d.company_name} - {d.role}</p>
              <p className="text-sm text-muted-foreground">{d.department || 'All departments'}</p>
              <Badge variant="outline">{d.status}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openApplications(d)}>Applications</Button>
              {d.status !== 'closed' && <Button size="sm" onClick={() => closeDrive(d.id)}>Close</Button>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="bg-card border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Applications - {selected.company_name}</h3>
          {applications.length === 0 ? <p className="text-sm text-muted-foreground">No applications yet</p> : applications.map((a) => (
            <div key={a.id} className="flex items-center justify-between border rounded p-2">
              <div className="text-sm">
                <p>Student: {a.student_id}</p>
                <Badge variant="outline">{a.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateAppStatus(a.id, 'shortlisted')}>Shortlist</Button>
                <Button size="sm" variant="outline" onClick={() => updateAppStatus(a.id, 'rejected')}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
