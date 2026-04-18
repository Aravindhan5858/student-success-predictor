function Badge({ children, tone = 'low', className = '' }) {
  const tones = {
    low: 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/45 shadow-[0_0_14px_rgba(16,185,129,0.45)]',
    medium: 'bg-amber-500/15 text-amber-100 ring-amber-400/45 shadow-[0_0_14px_rgba(245,158,11,0.45)]',
    high: 'bg-pink-500/15 text-pink-100 ring-pink-400/45 shadow-[0_0_14px_rgba(255,46,159,0.5)]',
    neutral: 'bg-blue-500/15 text-blue-100 ring-blue-400/40 shadow-[0_0_12px_rgba(91,140,255,0.35)]',
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
