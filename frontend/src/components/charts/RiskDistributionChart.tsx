'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RiskDistribution } from '@/types';

const COLORS = { low: '#22c55e', medium: '#eab308', high: '#ef4444' };

interface Props { data: RiskDistribution; }

export default function RiskDistributionChart({ data }: Props) {
  const chartData = [
    { name: 'Low Risk', value: data.low, color: COLORS.low },
    { name: 'Medium Risk', value: data.medium, color: COLORS.medium },
    { name: 'High Risk', value: data.high, color: COLORS.high },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
