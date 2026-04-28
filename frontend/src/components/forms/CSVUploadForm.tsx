'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { academicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Props { onSuccess?: () => void; }

export default function CSVUploadForm({ onSuccess }: Props) {
  const { handleSubmit } = useForm();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(csv|xlsx)$/i)) {
      setMessage('Only .csv and .xlsx files are allowed');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setMessage('');
    setErrors([]);
  };

  const onSubmit = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    try {
      const result = await academicApi.uploadCSV(file, (pct) => setProgress(pct));
      setStatus('success');
      const saved = result.saved ?? result.success ?? 0;
      setMessage(`Successfully imported ${saved} records`);
      setErrors(Array.isArray(result.errors) ? result.errors.slice(0, 10) : []);
      setFile(null);
      qc.invalidateQueries({ queryKey: ['students'] });
      onSuccess?.();
    } catch (err: unknown) {
      setStatus('error');
      const detail = (err as { response?: { data?: { detail?: string | { message?: string; fields?: string[] } } } })?.response?.data?.detail;
      if (typeof detail === 'string') {
        setMessage(detail);
      } else if (detail && typeof detail === 'object') {
        setMessage(detail.message || 'Upload failed');
        setErrors(detail.fields ?? []);
      } else {
        setMessage('Upload failed');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={() => setFile(null)} className="ml-2 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
            <p className="text-xs text-muted-foreground">Supports .csv and .xlsx files</p>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Browse Files
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {status === 'uploading' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md text-sm">
          <CheckCircle className="h-4 w-4" /> {message}
        </div>
      )}

      {status === 'error' && (
        <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm space-y-2">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {message}</div>
          {errors.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      <Button type="submit" disabled={!file || status === 'uploading'} className="w-full">
        {status === 'uploading' ? 'Uploading...' : 'Upload File'}
      </Button>
    </form>
  );
}
