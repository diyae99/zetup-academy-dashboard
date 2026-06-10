export default function DataTable({ columns, rows, empty = 'Aucune donnée disponible.' }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <div className="overflow-x-auto soft-scrollbar">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">{empty}</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
