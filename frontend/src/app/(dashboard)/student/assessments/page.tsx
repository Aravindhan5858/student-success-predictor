'use client';
import { useState, useEffect, useRef } from 'react';
import { useAssessments, useMyResults, useSubmitAssessment } from '@/hooks/useAssessments';
import { useAssessment } from '@/hooks/useAssessments';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { Assessment, TestResult } from '@/types';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle, PlayCircle } from 'lucide-react';

function TakeAssessmentModal({ assessment, onClose }: { assessment: Assessment; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(assessment.duration_mins * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const submitMutation = useSubmitAssessment();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    const res = await submitMutation.mutateAsync({ id: assessment.id, answers });
    setResult(res);
    setSubmitted(true);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const questions = assessment.questions ?? [];
  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  if (submitted && result) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assessment Complete!</DialogTitle></DialogHeader>
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <p className="text-3xl font-bold">{result.score} / {result.max_score}</p>
              <p className="text-muted-foreground">Score</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {((result.score / result.max_score) * 100).toFixed(0)}% correct
            </p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{assessment.title}</span>
            <span className={`flex items-center gap-1 text-sm font-normal ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="h-4 w-4" />
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>{Object.keys(answers).length} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {q && (
            <div className="space-y-4">
              <p className="font-medium">{q.text}</p>
              {q.type === 'mcq' && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                        answers[q.id] === i ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full border rounded-md p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Type your answer..."
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
              Previous
            </Button>
            {currentQ < questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(currentQ + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AssessmentsPage() {
  const { data: assessments, isLoading } = useAssessments();
  const { data: results } = useMyResults();
  const [taking, setTaking] = useState<Assessment | null>(null);

  const completedIds = new Set(results?.map((r) => r.assessment_id));

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Assessments</h2>
        <p className="text-muted-foreground">Test your knowledge and track progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments?.map((a) => {
          const done = completedIds.has(a.id);
          const myResult = results?.find((r) => r.assessment_id === a.id);
          return (
            <div key={a.id} className="bg-card border rounded-lg p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{a.questions?.length ?? 0} questions</p>
                </div>
                <Badge variant="secondary">{a.type.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration_mins} min</span>
                {done && myResult && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" /> {myResult.score}/{myResult.max_score}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant={done ? 'outline' : 'default'}
                onClick={() => !done && setTaking(a)}
                disabled={done}
                className="w-full"
              >
                {done ? 'Completed' : <><PlayCircle className="h-4 w-4 mr-1" /> Take Assessment</>}
              </Button>
            </div>
          );
        })}
        {!assessments?.length && (
          <p className="text-muted-foreground col-span-2 text-center py-8">No assessments available</p>
        )}
      </div>

      {results && results.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Past Results</h3>
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 text-sm">
                <span className="font-medium">{r.assessment?.title ?? `Assessment #${r.assessment_id}`}</span>
                <div className="flex items-center gap-3">
                  <span>{r.score}/{r.max_score}</span>
                  <Badge variant={r.score / r.max_score >= 0.7 ? 'default' : 'destructive'}>
                    {((r.score / r.max_score) * 100).toFixed(0)}%
                  </Badge>
                  <span className="text-muted-foreground">{formatDate(r.completed_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {taking && <TakeAssessmentModal assessment={taking} onClose={() => setTaking(null)} />}
    </div>
  );
}
