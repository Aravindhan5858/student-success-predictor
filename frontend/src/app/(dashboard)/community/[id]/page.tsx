'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, CheckCircle, Trash2, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Author { id: string; full_name: string }
interface Answer {
  id: string;
  body: string;
  author: Author;
  vote_count: number;
  is_accepted: boolean;
  created_at: string;
}
interface QuestionDetail {
  id: string;
  title: string;
  body: string;
  tags: string[];
  vote_count: number;
  author: Author;
  created_at: string;
  answers: Answer[];
}

type QuestionDetailApi = {
  id: string;
  title: string;
  body: string;
  tags?: string[] | null;
  votes?: number;
  author_id?: string | null;
  created_at: string;
  answers?: Array<{
    id: string;
    body: string;
    votes?: number;
    is_accepted?: boolean;
    author_id?: string | null;
    created_at: string;
  }>;
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${avatarColor(name)}`}>
      {name[0].toUpperCase()}
    </span>
  );
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isModerator = user?.role === 'professor' || user?.role === 'admin';
  const isAuthor = String(question?.author?.id ?? '') === String(user?.id ?? '');

  const load = async () => {
    try {
      const { data } = await api.get<QuestionDetailApi>(`/questions/${id}`);
      setQuestion({
        id: data.id,
        title: data.title,
        body: data.body,
        tags: Array.isArray(data.tags) ? data.tags : [],
        vote_count: data.votes ?? 0,
        author: {
          id: String(data.author_id ?? ''),
          full_name: 'Community User',
        },
        created_at: data.created_at,
        answers: (data.answers ?? []).map((a) => ({
          id: a.id,
          body: a.body,
          vote_count: a.votes ?? 0,
          is_accepted: !!a.is_accepted,
          author: { id: String(a.author_id ?? ''), full_name: 'Community User' },
          created_at: a.created_at,
        })),
      });
    } catch {
      toast({ title: 'Failed to load question', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const vote = async (answerId: string, value: 1 | -1) => {
    try {
      await api.post(`/answers/${answerId}/vote`, { direction: value === 1 ? 'up' : 'down' });
      setQuestion((q) => q ? {
        ...q,
        answers: q.answers.map((a) => a.id === answerId ? { ...a, vote_count: a.vote_count + value } : a),
      } : q);
    } catch {
      toast({ title: 'Failed to vote', variant: 'destructive' });
    }
  };

  const accept = async (answerId: string) => {
    try {
      await api.post(`/answers/${answerId}/accept`);
      setQuestion((q) => q ? {
        ...q,
        answers: q.answers.map((a) => ({ ...a, is_accepted: a.id === answerId })),
      } : q);
    } catch {
      toast({ title: 'Failed to accept answer', variant: 'destructive' });
    }
  };

  const deleteQuestion = async () => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.post('/moderation/delete', { target_type: 'question', target_id: id, reason: 'Removed by moderator' });
      router.push('/community');
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const deleteAnswer = async (answerId: string) => {
    if (!confirm('Delete this answer?')) return;
    try {
      await api.post('/moderation/delete', { target_type: 'answer', target_id: answerId, reason: 'Removed by moderator' });
      setQuestion((q) => q ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) } : q);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const postAnswer = async () => {
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/questions/${id}/answers`, { body: answerBody });
      const mapped: Answer = {
        id: data.id,
        body: data.body,
        vote_count: data.votes ?? 0,
        is_accepted: !!data.is_accepted,
        author: { id: String(data.author_id ?? user?.id ?? ''), full_name: user?.full_name ?? 'You' },
        created_at: data.created_at,
      };
      setQuestion((q) => q ? { ...q, answers: [...q.answers, mapped] } : q);
      setAnswerBody('');
      toast({ title: 'Answer posted' });
    } catch {
      toast({ title: 'Failed to post answer', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!question) return <p className="text-muted-foreground">Question not found.</p>;

  // Sort: accepted first, then by votes descending
  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (a.is_accepted !== b.is_accepted) return a.is_accepted ? -1 : 1;
    return b.vote_count - a.vote_count;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => router.push('/community')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Question */}
      <div className="bg-card border rounded-lg p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold leading-snug">{question.title}</h2>
          {isModerator && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={deleteQuestion}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.body}</p>
        <div className="flex flex-wrap gap-1">
          {question.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Avatar name={question.author?.full_name ?? '?'} />
          <span className="font-medium text-foreground">{question.author?.full_name}</span>
          <span>·</span>
          <span>{question.vote_count} votes</span>
          <span>·</span>
          <span>{new Date(question.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-3">
        <h3 className="font-semibold">{question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}</h3>

        {sortedAnswers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 border rounded-lg bg-card">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <MessageSquarePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No answers yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to help!</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => document.getElementById('answer-textarea')?.focus()}>
              Write an Answer
            </Button>
          </div>
        )}

        {sortedAnswers.map((answer) => {
          const authorName = answer.author?.full_name ?? '?';
          return (
            <div
              key={answer.id}
              className={`bg-card border rounded-lg p-4 ${answer.is_accepted ? 'border-l-4 border-l-green-500' : ''}`}
            >
              <div className="flex gap-4">
                {/* Vote controls */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => vote(answer.id, 1)}
                    className="p-1.5 rounded-md hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold min-w-[1.5rem] text-center">{answer.vote_count}</span>
                  <button
                    onClick={() => vote(answer.id, -1)}
                    className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
                {/* Body */}
                <div className="flex-1 min-w-0 space-y-2">
                  {answer.is_accepted && (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle className="h-4 w-4" /> Accepted Answer
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{answer.body}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar name={authorName} />
                      <span className="font-medium text-foreground">{authorName}</span>
                      <span>·</span>
                      <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAuthor && !answer.is_accepted && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 h-7 text-xs" onClick={() => accept(answer.id)}>
                          Accept
                        </Button>
                      )}
                      {isModerator && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7" onClick={() => deleteAnswer(answer.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Answer */}
      <div className="bg-card border rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Your Answer</h3>
        <div className="relative">
          <textarea
            id="answer-textarea"
            rows={6}
            placeholder="Write your answer... (supports plain text)"
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            maxLength={5000}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-shadow"
          />
          <span className={`absolute bottom-2 right-3 text-xs ${answerBody.length > 4500 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {answerBody.length}/5000
          </span>
        </div>
        <Button onClick={postAnswer} disabled={submitting || !answerBody.trim()}>
          {submitting ? 'Posting...' : 'Post Answer'}
        </Button>
      </div>
    </div>
  );
}
