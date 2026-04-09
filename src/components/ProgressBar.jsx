function ProgressBar({ value = 0, label, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      ) : null}
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
