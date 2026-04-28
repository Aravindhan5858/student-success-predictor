'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Brain, BookOpen, Cpu, Calculator, Play, Trophy, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { mcqApi } from '@/lib/api';
import type { MCQAttempt } from '@/types';

const DOMAINS = [
  { key: 'DSA', label: 'Data Structures & Algorithms', icon: Brain, color: 'from-violet-500 to-purple-600', questions: 15 },
  { key: 'DBMS', label: 'Database Management Systems', icon: BookOpen, color: 'from-blue-500 to-cyan-600', questions: 15 },
  { key: 'OS', label: 'Operating Systems', icon: Cpu, color: 'from-emerald-500 to-green-600', questions: 10 },
  { key: 'Aptitude', label: 'Quantitative Aptitude', icon: Calculator, color: 'from-amber-500 to-orange-600', questions: 10 },
];

export default function MCQTestPage() {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  const { data: attempts, isLoading } = useQuery<MCQAttempt[]>({
    queryKey: ['mcq-attempts'],
    queryFn: mcqApi.listAttempts,
  });

  const handleStart = async (domain: string, totalQuestions: number) => {
    setStarting(domain);
    try {
      const result = await mcqApi.start(domain, totalQuestions);
      sessionStorage.setItem(`mcq-${result.attempt_id}`, JSON.stringify(result.questions));
      router.push(`/student/mcq-test/${result.attempt_id}`);
    } catch { setStarting(null); }
  };

  const completedAttempts = attempts?.filter((a: MCQAttempt) => a.completed) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MCQ Test Center</h1>
        <p className="text-muted-foreground mt-1">Choose a domain and test your knowledge</p>
      </div>

      {/* Domain Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {DOMAINS.map(({ key, label, icon: Icon, color, questions }) => (
          <Card key={key} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none`} />
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{questions} questions · ~{questions * 1.5} min</span>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => handleStart(key, questions)}
                disabled={starting !== null}
              >
                {starting === key ? 'Starting...' : <><Play className="h-4 w-4" /> Start Test</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Past Attempts */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Past Attempts
        </h2>
        {isLoading ? <LoadingSpinner /> : completedAttempts.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No completed tests yet. Pick a domain above to get started!</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {completedAttempts.map((a: MCQAttempt) => (
              <Card key={a.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/student/mcq-test/${a.id}`)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{a.domain}</Badge>
                    <span className="text-sm text-muted-foreground">{a.correct_answers}/{a.total_questions} correct</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${a.score >= 70 ? 'text-green-600' : a.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {a.score.toFixed(0)}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
