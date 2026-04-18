import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function ChartContainer({ title, subtitle, data = [] }) {
  const safeData = Array.isArray(data) ? data : []

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_30px_rgba(91,140,255,0.16)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-400">{subtitle}</p> : null}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barNeonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff2e9f" />
                <stop offset="100%" stopColor="#8a2be2" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.65)" tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
              contentStyle={{
                background: 'rgba(11,15,26,0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                color: '#ffffff',
              }}
              formatter={(value) => [`${value}%`, 'Value']}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="url(#barNeonGradient)" barSize={30}>
              {safeData.map((entry) => (
                <Cell key={`cell-${entry.label}`} className="drop-shadow-[0_0_10px_rgba(255,46,159,0.55)]" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartContainer
