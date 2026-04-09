function ChartContainer({ title, subtitle, data = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>

      <div className="grid h-64 grid-cols-5 items-end gap-4 sm:gap-6">
        {data.map((item) => (
          <div key={item.label} className="flex h-full flex-col justify-end gap-2 text-center">
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-indigo-500 to-cyan-400 transition-transform duration-300 hover:scale-105"
                style={{ height: `${item.value}%` }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{item.value}%</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChartContainer
