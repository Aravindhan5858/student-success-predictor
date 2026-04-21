"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PerformanceTrend } from "@/types";

interface Props {
  data?: PerformanceTrend[];
}

export default function PerformanceChart({ data }: Props) {
  const normalizedData = Array.isArray(data) ? data : [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={normalizedData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="cgpa"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="CGPA"
        />
        <Line
          type="monotone"
          dataKey="attendance"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Attendance %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
