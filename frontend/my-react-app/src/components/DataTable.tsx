type Column = {
  key: string;
  label: string;
};

type DataTableProps = {
  data: Array<Record<string, unknown>>;
  columns?: Column[];
};

export default function DataTable({ data, columns }: DataTableProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Auto-generate columns if not provided
  const cols: Column[] =
    columns ||
    Object.keys(data[0] || {}).map((key) => ({
      key,
      label: key.replace(/_/g, " ").toUpperCase(),
    }));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {cols.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                  {String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
