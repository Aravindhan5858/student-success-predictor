'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsApi } from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { InterviewSession } from '@/types';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Send, Star } from 'lucide-react';

function InterviewModal({ session, onClose }: { session: InterviewSession; onClose: () => void }) {
  const [responses, setResponses] = useState<string[]>(session.questions.map(() => ''));
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: () => interviewsApi.respond(session.id, responses),
    onSuccess: () => {
      completeMutation.mutate();
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => interviewsApi.complete(session.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] });
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader><DialogTitle>Interview Submitted!</DialogTitle></DialogHeader>
          <div className="text-center space-y-3 py-4">
            <MessageSquare className="h-12 w-12 text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Your responses have been submitted for AI evaluation. Check back soon for feedback.</p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const q = session.questions[currentQ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize">{session.type} Interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQ + 1} of {session.questions.length}</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium">{q}</p>
          </div>
          <textarea
            className="w-full border rounded-md p-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Type your response..."
            value={responses[currentQ]}
            onChange={(e) => {
              const updated = [...responses];
              updated[currentQ] = e.target.value;
              setResponses(updated);
            }}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
              Previous
            </Button>
            {currentQ < session.questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!responses[currentQ]}>
                Next
              </Button>
            ) : (
              <Button
                onClick={() => respondMutation.mutate()}
                disabled={respondMutation.isPending || !responses[currentQ]}
              >
                <Send className="h-4 w-4 mr-1" />
                {respondMutation.isPending ? 'Submitting...' : 'Submit Interview'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InterviewsPage() {
  const [interviewType, setInterviewType] = useState('technical');
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const qc = useQueryClient();

  const { data: sessions, isLoading } = useQuery<InterviewSession[]>({
    queryKey: ['my-sessions'],
    queryFn: interviewsApi.getMySessions,
  });

  const startMutation = useMutation({
    mutationFn: () => interviewsApi.startSession(interviewType),
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] });
      setActiveSession(session);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mock Interviews</h2>
        <p className="text-muted-foreground">Practice with AI-powered interview sessions</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Start New Interview</h3>
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Interview Type</label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {startMutation.isPending ? 'Starting...' : 'Start Interview'}
          </Button>
        </div>
      </div>

      {sessions && sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Past Sessions</h3>
          {sessions.map((s) => (
            <div key={s.id} className="bg-card border rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{s.type}</Badge>
                  <Badge variant={s.status === 'completed' ? 'default' : 'outline'}>{s.status}</Badge>
                </div>
                {s.score > 0 && (
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {s.score}/10
                  </div>
                )}
              </div>
              {s.feedback && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">AI Feedback</p>
                  <p className="text-sm">{s.feedback}</p>
                </div>
              )}
              {s.created_at && (
                <p className="text-xs text-muted-foreground">{formatDate(s.created_at)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSession && (
        <InterviewModal session={activeSession} onClose={() => setActiveSession(null)} />
      )}
    </div>
  );
}
