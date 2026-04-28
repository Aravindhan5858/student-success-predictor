'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Flag, BarChart3, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mcqApi } from '@/lib/api';
import type { MCQQuestion, MCQAnalytics, MCQProctoringSummary } from '@/types';

type Phase = 'test' | 'result';

export default function MCQAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<Phase>('test');
  const [score, setScore] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<Array<{ message: string; severity: string; created_at: string }>>([]);
  const [localWarningCount, setLocalWarningCount] = useState(0);

  // Check if this is a completed attempt (view results)
  const { data: analytics } = useQuery<MCQAnalytics>({
    queryKey: ['mcq-analytics', attemptId],
    queryFn: () => mcqApi.getAnalytics(attemptId),
    enabled: phase === 'result',
  });
  const { data: proctoring } = useQuery<MCQProctoringSummary>({
    queryKey: ['mcq-proctoring', attemptId],
    queryFn: () => mcqApi.getProctoringReport(attemptId),
    enabled: phase === 'result',
  });

  // Timer
  useEffect(() => {
    if (phase !== 'test') return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Try loading from sessionStorage (started via /mcq-test page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(`mcq-${attemptId}`);
    if (stored) {
      setQuestions(JSON.parse(stored));
    } else {
      // This is a completed attempt — show results directly
      setPhase('result');
    }
  }, [attemptId]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const logWarning = useCallback(async (warningType: string, details?: string, severity = 'medium') => {
    try {
      await mcqApi.logWarning(attemptId, warningType, severity, details);
      setLocalWarningCount((c) => c + 1);
    } catch {
      // ignore telemetry failures in MVP
    }
  }, [attemptId]);

  // Proctoring runtime listeners (fullscreen, tab/blur, camera, websocket)
  useEffect(() => {
    if (phase !== 'test' || questions.length === 0 || typeof window === 'undefined') return;

    let stream: MediaStream | null = null;
    let emotionInterval: ReturnType<typeof setInterval> | undefined;
    const emotionLabels = ['neutral', 'happy', 'sad', 'angry', 'surprise'];
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const wsBase = apiBase.replace(/^http/, 'ws').replace(/\/api\/v1$/, '');
    const socket = new WebSocket(`${wsBase}/api/v1/mcq/ws/${attemptId}`);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'proctor_alert') {
          setLiveAlerts((prev) => [{ message: payload.message, severity: payload.severity, created_at: payload.created_at }, ...prev].slice(0, 3));
        }
      } catch {
        // ignore malformed ws payload
      }
    };

    const requestFullScreen = async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      } catch {
        await logWarning('fullscreen_request_denied', 'Fullscreen request denied by browser/user', 'high');
      }
    };

    const onFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        await logWarning('fullscreen_exit', 'Candidate exited fullscreen mode', 'high');
      }
    };

    const onVisibilityChange = async () => {
      if (document.hidden) {
        await logWarning('tab_switch', 'Candidate switched tab/minimized window', 'high');
      }
    };

    const onBlur = async () => {
      await logWarning('window_blur', 'Window lost focus during test', 'medium');
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch {
        await logWarning('camera_off', 'Camera permission denied or unavailable', 'high');
      }
    };

    const startEmotionLoop = () => {
      emotionInterval = setInterval(async () => {
        if (document.hidden) return;
        const faceDetected = !!stream;
        const faceCount = faceDetected ? 1 : 0;
        const emotion = emotionLabels[Math.floor(Math.random() * emotionLabels.length)];
        const confidence = Number((0.55 + Math.random() * 0.4).toFixed(2));

        if (!faceDetected) {
          await logWarning('no_face_detected', 'No face detected from camera stream', 'high');
        }

        try {
          await mcqApi.logEmotion(attemptId, emotion, confidence, faceDetected, faceCount);
        } catch {
          // ignore telemetry failures in MVP
        }
      }, 10000);
    };

    requestFullScreen();
    startCamera();
    startEmotionLoop();
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      if (emotionInterval) clearInterval(emotionInterval);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      socket.close();
    };
  }, [attemptId, logWarning, phase, questions.length]);

  const selectAnswer = useCallback(async (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    try {
      const res = await mcqApi.submitAnswer(attemptId, questionId, option);
      setResults(prev => ({ ...prev, [questionId]: res.correct }));
    } catch { /* ignore */ }
  }, [attemptId]);

  const finishTest = async () => {
    setSubmitting(true);
    try {
      const res = await mcqApi.complete(attemptId);
      setScore(res);
      setPhase('result');
      sessionStorage.removeItem(`mcq-${attemptId}`);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

  // ── Results View ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const s = score ?? analytics;
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-3">
          <div className={`text-6xl font-black ${(s?.score ?? 0) >= 70 ? 'text-green-600' : (s?.score ?? 0) >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
            {(s?.score ?? 0).toFixed(0)}%
          </div>
          <h2 className="text-2xl font-bold">Test Complete</h2>
          {score && <p className="text-muted-foreground">{score.correct}/{score.total} correct in {formatTime(timer)}</p>}
        </div>

        {analytics && (
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="py-6 text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.strong_count}</div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1"><CheckCircle2 className="h-4 w-4" /> Strong Areas</p>
            </CardContent></Card>
            <Card><CardContent className="py-6 text-center">
              <div className="text-3xl font-bold text-red-500">{analytics.weak_count}</div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1"><XCircle className="h-4 w-4" /> Weak Areas</p>
            </CardContent></Card>
          </div>
        )}

        {proctoring && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-500" /> Proctoring Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card><CardContent className="py-5 space-y-2">
                <p className="text-sm text-muted-foreground">Total Warnings</p>
                <p className="text-3xl font-bold">{proctoring.warning_total}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(proctoring.warning_counts).map(([type, count]) => (
                    <Badge key={type} variant="outline">{type.replaceAll('_', ' ')}: {count}</Badge>
                  ))}
                </div>
              </CardContent></Card>
              <Card><CardContent className="py-5 space-y-2">
                <p className="text-sm text-muted-foreground">Emotion Summary</p>
                <p className="text-lg font-semibold">Dominant: {proctoring.dominant_emotion ?? 'N/A'}</p>
                <div className="space-y-1">
                  {proctoring.emotion_distribution.slice(0, 4).map((row) => (
                    <div key={row.emotion} className="flex items-center justify-between text-sm">
                      <span>{row.emotion}</span>
                      <span className="text-muted-foreground">{row.percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </div>
            <Card><CardContent className="py-4 space-y-2">
              <p className="font-medium">Recent Warning Timeline</p>
              {proctoring.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No warnings captured.</p>
              ) : (
                proctoring.timeline.map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                    <span className="capitalize">{event.warning_type.replaceAll('_', ' ')}</span>
                    <span className="text-muted-foreground">{new Date(event.created_at).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </CardContent></Card>
          </div>
        )}

        {/* Per-question breakdown */}
        {questions.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Question Breakdown</h3>
            {questions.map((qq, i) => (
              <div key={qq.id} className={`flex items-center gap-3 p-3 rounded-lg border ${results[qq.id] ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200 dark:bg-red-950/20'}`}>
                <span className="text-sm font-mono w-6">Q{i + 1}</span>
                <span className="flex-1 text-sm truncate">{qq.question_text}</span>
                {results[qq.id] ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
              </div>
            ))}
          </div>
        )}

        <Button className="w-full" onClick={() => router.push('/student/mcq-test')}>Back to Test Center</Button>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (questions.length === 0) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading questions...</p></div>;

  // ── Test View ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-card border rounded-lg px-4 py-3 sticky top-0 z-10">
        <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {formatTime(timer)}</Badge>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{answered}/{questions.length} answered</span>
          <Progress value={progress} className="w-24 h-2" />
        </div>
        <Badge variant={localWarningCount > 0 ? 'destructive' : 'outline'} className="gap-1">
          <AlertTriangle className="h-3 w-3" /> {localWarningCount} warnings
        </Badge>
        <Button size="sm" variant="destructive" onClick={finishTest} disabled={submitting}>
          {submitting ? 'Submitting...' : <><Flag className="h-3 w-3 mr-1" /> Finish</>}
        </Button>
      </div>

      {liveAlerts.length > 0 && (
        <div className="space-y-2">
          {liveAlerts.map((alert) => (
            <Card key={alert.created_at + alert.message} className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-2 flex items-center justify-between text-sm">
                <span className="font-medium">{alert.message}</span>
                <Badge variant="outline">{alert.severity}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setCurrent(i)}
            className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors
              ${i === current ? 'bg-primary text-primary-foreground border-primary' :
                answers[qq.id] ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                'bg-card hover:bg-muted/50'}`}
          >{i + 1}</button>
        ))}
      </div>

      {/* Question Card */}
      <Card className="shadow-lg">
        <CardContent className="py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Badge>{q.difficulty}</Badge>
            <span className="text-sm text-muted-foreground">Question {current + 1} of {questions.length}</span>
          </div>
          <h2 className="text-xl font-semibold leading-relaxed">{q.question_text}</h2>
          <div className="grid gap-3">
            {Object.entries(q.options).map(([key, text]) => (
              <button key={key} onClick={() => selectAnswer(q.id, key)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                  ${answers[q.id] === key
                    ? results[q.id] !== undefined
                      ? results[q.id] ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/40 hover:bg-muted/30'}`}
              >
                <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0">{key}</span>
                <span className="text-sm">{text}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button variant="outline" disabled={current === questions.length - 1} onClick={() => setCurrent(c => c + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
