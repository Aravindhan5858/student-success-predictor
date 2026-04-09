function Badge({ children, tone = 'low', className = '' }) {
  const tones = {
    low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    medium: 'bg-amber-100 text-amber-700 ring-amber-200',
    high: 'bg-rose-100 text-rose-700 ring-rose-200',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone] ?? tones.neutral} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
