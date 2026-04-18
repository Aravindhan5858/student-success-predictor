function ProgressBar({ value = 0, label, className = '' }) {
  const normalizedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-600">
          <span className="truncate">{label}</span>
          <span className="shrink-0 font-medium text-slate-700">{normalizedValue}%</span>
        </div>
      ) : null}
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
