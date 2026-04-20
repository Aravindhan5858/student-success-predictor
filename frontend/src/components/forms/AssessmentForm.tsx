'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { assessmentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const questionSchema = z.object({
  text: z.string().min(1, 'Question text required'),
  type: z.enum(['mcq', 'text']),
  options: z.array(z.string()).optional(),
  correct_option: z.number().optional(),
});

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(['mcq', 'aptitude', 'coding']),
  duration_mins: z.number().min(5).max(180),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});

type FormData = z.infer<typeof schema>;

interface Props { onSuccess?: () => void; }

export default function AssessmentForm({ onSuccess }: Props) {
  const qc = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'mcq',
      duration_mins: 30,
      questions: [{ text: '', type: 'mcq', options: ['', '', '', ''], correct_option: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });
  const assessmentType = watch('type');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      await assessmentsApi.create(data);
      qc.invalidateQueries({ queryKey: ['assessments'] });
      onSuccess?.();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create assessment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Title</Label>
          <Input placeholder="Assessment title" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select onValueChange={(v) => setValue('type', v as FormData['type'])} defaultValue="mcq">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="aptitude">Aptitude</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input type="number" {...register('duration_mins', { valueAsNumber: true })} />
          {errors.duration_mins && <p className="text-xs text-destructive">{errors.duration_mins.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Questions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ text: '', type: assessmentType === 'mcq' ? 'mcq' : 'text', options: ['', '', '', ''], correct_option: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>

        {fields.map((field, i) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Label>Question {i + 1}</Label>
                <Input placeholder="Enter question text" {...register(`questions.${i}.text`)} />
                {errors.questions?.[i]?.text && (
                  <p className="text-xs text-destructive">{errors.questions[i]?.text?.message}</p>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="mt-6 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {(assessmentType === 'mcq' || watch(`questions.${i}.type`) === 'mcq') && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Options (mark correct one)</Label>
                {[0, 1, 2, 3].map((optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct_${i}`}
                      defaultChecked={optIdx === 0}
                      onChange={() => setValue(`questions.${i}.correct_option`, optIdx)}
                      className="h-4 w-4"
                    />
                    <Input
                      placeholder={`Option ${optIdx + 1}`}
                      {...register(`questions.${i}.options.${optIdx}`)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {errors.questions && typeof errors.questions.message === 'string' && (
          <p className="text-xs text-destructive">{errors.questions.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Assessment'}
      </Button>
    </form>
  );
}
