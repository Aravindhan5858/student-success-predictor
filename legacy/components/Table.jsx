function Table({ headers = [], children, className = '' }) {
  return (
    <div
      className={`table-animate overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_25px_rgba(255,46,159,0.18)] backdrop-blur-xl ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-white">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent text-white [&>tr]:transition [&>tr:hover]:bg-white/10">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
