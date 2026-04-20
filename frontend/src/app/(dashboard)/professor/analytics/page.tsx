'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/shared/StatCard';
import PerformanceChart from '@/components/charts/PerformanceChart';
import AttendanceChart from '@/components/charts/AttendanceChart';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Download } from 'lucide-react';

interface DashboardData { total_students: number; avg_gpa: number; at_risk_count: number }
interface HeatmapRow { student_name: string; student_id: string; courses: Record<string, number> }
interface HeatmapData { courses: string[]; rows: HeatmapRow[] }
interface WeakArea { topic: string; frequency: number }
interface StudentRow {
  id: number; full_name: string; student_id: string; department: string;
  gpa: number; risk_level: 'low' | 'medium' | 'high';
}

function cellColor(mark: number) {
  if (mark >= 75) return 'bg-green-100 text-green-800';
  if (mark >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function riskVariant(r: StudentRow['risk_level']) {
  return ({ low: 'default', medium: 'secondary', high: 'destructive' } as const)[r];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/analytics/dashboard').then((r) => r.data),
      api.get<HeatmapData>('/analytics/heatmap').then((r) => r.data),
      api.get<WeakArea[]>('/analytics/weak-areas').then((r) => r.data),
      api.get<StudentRow[]>('/analytics/students').then((r) => r.data),
    ])
      .then(([d, h, w, s]) => { setDashboard(d); setHeatmap(h); setWeakAreas(w); setStudents(s); })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const fetchHeatmap = () => {
    api.get<HeatmapData>('/analytics/heatmap', { params: { semester, department } })
      .then((r) => setHeatmap(r.data))
      .catch(() => {});
  };

  const exportCSV = () => {
    if (!heatmap) return;
    const header = ['Student', 'ID', ...heatmap.courses].join(',');
    const rows = heatmap.rows.map((r) =>
      [r.student_name, r.student_id, ...heatmap.courses.map((c) => r.courses[c] ?? '')].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'heatmap.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (!search || s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)) &&
      (!department || s.department === department) &&
      (!course || true) // course filter applied server-side if needed
    );
  });

  const departments = [...new Set(students.map((s) => s.department))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Student performance insights</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="weak-areas">Weak Areas</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {dashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Students" value={dashboard.total_students} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Average GPA" value={dashboard.avg_gpa?.toFixed(2)} icon={<TrendingUp className="h-5 w-5" />} />
              <StatCard title="At Risk" value={dashboard.at_risk_count} icon={<AlertTriangle className="h-5 w-5" />} />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Performance Trends</h3>
              <PerformanceChart />
            </div>
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Attendance Trends</h3>
              <AttendanceChart />
            </div>
          </div>
        </TabsContent>

        {/* Heatmap */}
        <TabsContent value="heatmap" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Semester</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {[1,2,3,4,5,6,7,8].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchHeatmap}>Apply</Button>
            <Button variant="outline" onClick={exportCSV} className="ml-auto">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          {heatmap && (
            <div className="overflow-auto border rounded-lg">
              <table className="text-xs w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium sticky left-0 bg-muted/50">Student</th>
                    <th className="text-left px-3 py-2 font-medium">ID</th>
                    {heatmap.courses.map((c) => (
                      <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {heatmap.rows.map((row) => (
                    <tr key={row.student_id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-background whitespace-nowrap">{row.student_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.student_id}</td>
                      {heatmap.courses.map((c) => {
                        const mark = row.courses[c];
                        return (
                          <td key={c} className="px-3 py-2 text-center">
                            {mark != null
                              ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${cellColor(mark)}`}>{mark}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!heatmap.rows.length && (
                    <tr><td colSpan={heatmap.courses.length + 2} className="text-center py-8 text-muted-foreground">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Weak Areas */}
        <TabsContent value="weak-areas" className="mt-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Weak Areas by Frequency</h3>
            {weakAreas.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={weakAreas} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="topic" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No weak area data available</p>
            )}
          </div>
        </TabsContent>

        {/* Students */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Name', 'Student ID', 'Department', 'GPA', 'Risk Level', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.student_id}</td>
                    <td className="px-4 py-3">{s.department}</td>
                    <td className="px-4 py-3">{s.gpa?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={riskVariant(s.risk_level)}>{s.risk_level}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/professor/students/${s.id}`)}
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
                {!filteredStudents.length && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
