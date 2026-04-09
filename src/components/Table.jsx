function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
