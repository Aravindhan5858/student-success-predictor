"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AttendanceTrend } from "@/types";

interface Props {
  data?: AttendanceTrend[];
}

export default function AttendanceChart({ data }: Props) {
  const normalizedData = Array.isArray(data) ? data : [];
  const xAxisKey = normalizedData.some((entry) => Boolean(entry?.course))
    ? "course"
    : "month";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={normalizedData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(v: number) => [`${v}%`, "Attendance"]}
        />
        <Legend />
        <Bar
          dataKey="attendance"
          fill="#3b82f6"
          name="Attendance %"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
