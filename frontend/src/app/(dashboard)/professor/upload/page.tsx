'use client';
import { useQuery } from '@tanstack/react-query';
import { academicApi, professorAPI } from '@/lib/api';
import CSVUploadForm from '@/components/forms/CSVUploadForm';
import DataTable, { Column } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';
import type { UploadHistory } from '@/types';

export default function UploadPage() {
  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['upload-history'],
    queryFn: academicApi.getUploadHistory,
  });

  const columns: Column<UploadHistory>[] = [
    { key: 'filename', header: 'File Name', render: (h) => <span className="font-medium">{h.filename}</span> },
    { key: 'records_count', header: 'Records', render: (h) => (h.records_count ?? 0).toLocaleString() },
    {
      key: 'status',
      header: 'Status',
      render: (h) => (
        <Badge variant={h.status === 'success' ? 'default' : h.status === 'failed' ? 'destructive' : 'secondary'}>
          {h.status}
        </Badge>
      ),
    },
    { key: 'uploaded_at', header: 'Uploaded At', render: (h) => formatDateTime(h.uploaded_at) },
  ];

  const downloadTemplate = async () => {
    const res = await professorAPI.downloadAcademicTemplate();
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'academic_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const historyRows = Array.isArray(history?.items)
    ? history.items.map((r: any) => ({
      id: r.id,
      filename: r.file_url,
      records_count: (r.report_json?.saved ?? 0),
      status: r.status,
      uploaded_at: r.created_at,
    }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Student Data</h2>
        <p className="text-muted-foreground">Import academic records via CSV or Excel</p>
      </div>

      <div className="bg-card border rounded-lg p-6 max-w-2xl">
        <h3 className="font-semibold mb-4">Upload File</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV or Excel file with columns: student_id, course_id, semester, marks, grade, attendance
        </p>
        <button type="button" className="text-sm text-primary underline mb-4" onClick={downloadTemplate}>
          Download standard template
        </button>
        <CSVUploadForm onSuccess={() => refetch()} />
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Upload History</h3>
        {isLoading ? <LoadingSpinner /> : (
          <DataTable<UploadHistory>
            data={historyRows}
            columns={columns}
            searchable={false}
          />
        )}
      </div>
    </div>
  );
}
