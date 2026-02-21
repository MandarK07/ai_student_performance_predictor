type DataTableProps = {
  data: Array<Record<string, unknown>>;
};

export default function DataTable({ data }: DataTableProps) {
  if (!data.length) {
    return null;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t border-slate-100 hover:bg-slate-50">
              {columns.map((column) => (
                <td key={`${index}-${column}`} className="px-3 py-2 text-slate-700">
                  {String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
