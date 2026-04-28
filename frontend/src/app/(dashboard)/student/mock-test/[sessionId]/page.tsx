'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AlertTriangle, Clock } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Question {
  id: string; text: string; type: 'mcq' | 'code';
  options?: string[];
}
interface SessionData {
  id: number; domain: string; duration_mins: number; questions: Question[];
}

export default function ExamSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [result, setResult] = useState<{ score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const violationsRef = useRef(0);

  useEffect(() => {
    api.get<SessionData>(`/tests/sessions/${sessionId}`)
      .then((r) => { setSession(r.data); setTimeLeft(r.data.duration_mins * 60); })
      .catch(() => router.push('/student/mock-test'))
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const handleSubmit = useCallback(async (sess: SessionData, ans: Record<string, string>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<{ score: number }>('/tests/submit', {
        session_id: Number(sessionId),
        attempts: sess.questions.map((q) => ({ question_id: q.id, response: ans[q.id] ?? '' })),
      });
      setResult(data);
    } catch {
      setResult({ score: 0 });
    }
  }, [sessionId, submitting]);

  const handleViolation = useCallback(async () => {
    violationsRef.current += 1;
    setViolations(violationsRef.current);
    try {
      await api.post('/tests/proctor/event', { session_id: Number(sessionId), event_type: 'violation' });
    } catch { /* silent */ }
    if (violationsRef.current >= 3 && session) {
      handleSubmit(session, answers);
    }
  }, [sessionId, session, answers, handleSubmit]);

  // Fullscreen on mount + proctoring hooks
  useEffect(() => {
    if (!session) return;
    requestFullscreen();

    const onVisibility = () => { if (document.hidden) handleViolation(); };
    const onBlur = () => handleViolation();
    const onCopy = (e: Event) => e.preventDefault();
    const onFullscreen = () => { if (!document.fullscreenElement) requestFullscreen(); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.exitFullscreen?.().catch(() => {});
    };
  }, [session, handleViolation, requestFullscreen]);

  // Timer
  useEffect(() => {
    if (!session || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); if (session) handleSubmit(session, answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !session) return <LoadingSpinner />;

  const questions = Array.isArray(session.questions) ? session.questions : [];
  const safeCurrent = Math.min(current, Math.max(questions.length - 1, 0));
  const q = questions[safeCurrent];

  if (questions.length === 0 || !q) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No questions available for this session.</p>
          <Button onClick={() => router.push('/student/mock-test')}>Back to Mock Tests</Button>
        </div>
      </div>
    );
  }
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 60 ? 'text-destructive' : timeLeft < 300 ? 'text-yellow-500' : 'text-foreground';

  const setAnswer = (val: string) => setAnswers((prev) => ({ ...prev, [q.id]: val }));

  return (
    <div className="flex flex-col h-screen bg-background select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <span className="font-semibold">{session.domain} — Mock Test</span>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 font-mono font-medium ${timerColor}`}>
            <Clock className="h-4 w-4" />
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <span className="text-sm text-muted-foreground">Q {safeCurrent + 1}/{questions.length}</span>
          {violations > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {violations} violation{violations > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-16 border-r bg-card flex flex-col items-center py-4 gap-2 overflow-y-auto shrink-0">
          {questions.map((_, i) => {
            const answered = !!answers[questions[i].id];
            const isCurrent = i === safeCurrent;
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                  isCurrent ? 'bg-blue-500 text-white' :
                  answered ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Main question area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <p className="text-base font-medium leading-relaxed">{q.text}</p>

            {q.type === 'mcq' && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswer(String(i))}
                    className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                      answers[q.id] === String(i) ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-64 border rounded-md overflow-hidden">
                <MonacoEditor
                  height="100%"
                  language="javascript"
                  value={answers[q.id] ?? ''}
                  onChange={(v) => setAnswer(v ?? '')}
                  options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
                  theme="vs-dark"
                />
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-card shrink-0">
            <Button variant="outline" onClick={() => setCurrent(Math.max(0, safeCurrent - 1))} disabled={safeCurrent === 0}>
              Previous
            </Button>
            <div className="flex gap-2">
              {safeCurrent < questions.length - 1 ? (
                <Button onClick={() => setCurrent(safeCurrent + 1)}>Next</Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(session, answers)}
                  disabled={submitting}
                  variant="default"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results modal */}
      {result && (
        <Dialog open>
          <DialogContent>
            <DialogHeader><DialogTitle>Test Complete</DialogTitle></DialogHeader>
            <div className="text-center space-y-4 py-4">
              <p className="text-5xl font-bold">{result.score}%</p>
              <p className="text-muted-foreground">
                {result.score >= 70 ? '🎉 Great job!' : result.score >= 50 ? '👍 Good effort!' : '📚 Keep practicing!'}
              </p>
              {violations > 0 && (
                <p className="text-sm text-destructive">{violations} proctoring violation{violations > 1 ? 's' : ''} recorded</p>
              )}
              <Button className="w-full" onClick={() => router.push('/student/mock-test')}>
                Back to Mock Tests
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
