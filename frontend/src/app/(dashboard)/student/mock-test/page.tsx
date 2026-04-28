'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { BookOpen, PlayCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Domain { id: number; name: string; question_count: number; description?: string }
interface TestSession {
  id: number; domain: string; score: number | null; created_at: string;
  violations: number; status: 'pending' | 'in_progress' | 'completed' | 'terminated';
}

export default function MockTestPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Domain[]>('/tests/domains').then((r) => r.data),
      api.get<TestSession[]>('/tests/sessions').then((r) => r.data),
    ])
      .then(([d, s]) => { setDomains(d); setSessions(s); })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const startTest = async (domainId: number) => {
    setStarting(domainId);
    try {
      const { data } = await api.post<{ session_id: number }>('/tests/start', { domain_id: domainId, count: 10 });
      router.push(`/student/mock-test/${data.session_id}`);
    } catch {
      setError('Failed to start test');
      setStarting(null);
    }
  };

  const statusVariant = (s: TestSession['status']) =>
    ({ completed: 'default', terminated: 'destructive', in_progress: 'secondary', pending: 'outline' } as const)[s];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Mock Tests</h2>
        <p className="text-muted-foreground">Practice with proctored domain tests</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div>
        <h3 className="font-semibold mb-3">Available Domains</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((d) => (
            <div key={d.id} className="bg-card border rounded-lg p-5 space-y-3">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold">{d.name}</h4>
                  {d.description && <p className="text-sm text-muted-foreground mt-0.5">{d.description}</p>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{d.question_count} questions · 10 per test</p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => startTest(d.id)}
                disabled={starting === d.id}
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                {starting === d.id ? 'Starting...' : 'Start Test'}
              </Button>
            </div>
          ))}
          {!domains.length && <p className="text-muted-foreground col-span-3 py-8 text-center">No domains available</p>}
        </div>
      </div>

      {sessions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Past Sessions</h3>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Domain', 'Score', 'Date', 'Violations', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.domain}</td>
                    <td className="px-4 py-3">{s.score != null ? `${s.score}%` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      {s.violations > 0
                        ? <span className="text-destructive font-medium">{s.violations}</span>
                        : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
