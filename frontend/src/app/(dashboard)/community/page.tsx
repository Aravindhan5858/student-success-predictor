'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, Plus, X, HelpCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Question {
  id: string;
  title: string;
  body: string;
  tags: string[];
  vote_count: number;
  answer_count: number;
  is_closed?: boolean;
  author: { full_name: string };
  created_at: string;
}

interface PaginatedQuestions {
  items: Question[];
  total: number;
  page: number;
  pages: number;
}

const POPULAR_TAGS = ['python', 'javascript', 'algorithms', 'career', 'interview', 'ml'];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CommunityPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<PaginatedQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const [askOpen, setAskOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', tags: '' });

  const fetchQuestions = async (q = search, tag = activeTag, p = page) => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/questions', { params: { q, tag, page: p, size: 10 } });
      setData(res);
    } catch {
      toast({ title: 'Failed to load questions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions(search, activeTag, 1);
  };

  const toggleTag = (tag: string) => {
    const next = activeTag === tag ? '' : tag;
    setActiveTag(next);
    setPage(1);
    fetchQuestions(search, next, 1);
  };

  const submitQuestion = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/questions', {
        title: form.title,
        body: form.body,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast({ title: 'Question posted' });
      setAskOpen(false);
      setForm({ title: '', body: '', tags: '' });
      fetchQuestions(search, activeTag, 1);
    } catch {
      toast({ title: 'Failed to post question', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Q&amp;A</h2>
          <p className="text-muted-foreground">Ask questions, share knowledge</p>
        </div>
        <Button onClick={() => setAskOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ask Question
        </Button>
      </div>

      {/* Search + Tags */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeTag === tag
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 hover:bg-muted border-transparent'
              }`}
            >
              #{tag}
              {activeTag === tag && <X className="inline h-3 w-3 ml-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {data?.items?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No questions found</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to ask something!</p>
              </div>
              <Button size="sm" onClick={() => setAskOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Ask a Question
              </Button>
            </div>
          )}
          {data?.items?.map((q) => {
            const authorName = q.author?.full_name ?? '?';
            return (
              <div
                key={q.id}
                onClick={() => router.push(`/community/${q.id}`)}
                className="bg-card border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm leading-snug truncate">{q.title}</h3>
                      <Badge
                        variant={q.is_closed ? 'secondary' : 'outline'}
                        className={`shrink-0 text-xs ${q.is_closed ? '' : 'border-green-500 text-green-600'}`}
                      >
                        {q.is_closed ? 'closed' : 'open'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{q.body}</p>
                    <div className="flex flex-wrap gap-1">
                      {q.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            activeTag === tag
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/60 hover:bg-muted border-transparent text-muted-foreground'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Stat pills */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                      <ThumbsUp className="h-3 w-3" />{q.vote_count}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                      <MessageSquare className="h-3 w-3" />{q.answer_count}
                    </span>
                  </div>
                </div>
                {/* Footer row */}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${avatarColor(authorName)}`}>
                    {authorName[0].toUpperCase()}
                  </span>
                  <span>asked by <span className="font-medium text-foreground">{authorName}</span></span>
                  <span>·</span>
                  <span>{q.answer_count} answer{q.answer_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{q.vote_count} vote{q.vote_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page === data.pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Ask Question Dialog */}
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ask a Question</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                placeholder="What's your question?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Body</Label>
              <textarea
                rows={5}
                placeholder="Describe your question in detail..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label>Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input
                placeholder="python, algorithms, career"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskOpen(false)}>Cancel</Button>
            <Button onClick={submitQuestion} disabled={submitting || !form.title.trim() || !form.body.trim()}>
              {submitting ? 'Posting...' : 'Post Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
