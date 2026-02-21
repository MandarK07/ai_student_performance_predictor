import { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

export type StudentRisk = "Low" | "Medium" | "High" | "Critical" | "Unknown";

export type StudentRow = {
  studentCode: string;
  name: string;
  email: string;
  status: string;
  predictedGpa: number | null;
  attendance: number | null;
  risk: StudentRisk;
};

type StudentsTableProps = {
  rows: StudentRow[];
  loading?: boolean;
  error?: string | null;
};

function riskVariant(risk: StudentRisk): "low" | "medium" | "high" {
  if (risk === "High" || risk === "Critical") {
    return "high";
  }
  if (risk === "Medium") {
    return "medium";
  }
  return "low";
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return `${value.toFixed(1)}%`;
}

function formatGpa(value: number | null): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return value.toFixed(2);
}

export default function StudentsTable({ rows, loading = false, error = null }: StudentsTableProps) {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<StudentRisk | "All">("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const matchesQuery =
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.studentCode.toLowerCase().includes(query.toLowerCase()) ||
          item.email.toLowerCase().includes(query.toLowerCase());
        const matchesRisk = riskFilter === "All" || item.risk === riskFilter;
        return matchesQuery && matchesRisk;
      }),
    [query, riskFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search by name or ID"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <select
            value={riskFilter}
            onChange={(e) => {
              setPage(1);
              setRiskFilter(e.target.value as StudentRisk | "All");
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          >
            <option value="All">All Risks</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Predicted GPA</th>
              <th className="px-4 py-3 font-semibold">Attendance</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading student records...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {visible.map((item) => (
              <tr key={item.studentCode} className="border-t border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.studentCode} • {item.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{item.status}</td>
                <td className="px-4 py-3 text-slate-700">{formatGpa(item.predictedGpa)}</td>
                <td className="px-4 py-3 text-slate-700">{formatPercent(item.attendance)}</td>
                <td className="px-4 py-3">
                  <Badge variant={riskVariant(item.risk)}>{item.risk} Risk</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                    <Button variant="primary" size="sm">
                      Edit
                    </Button>
                    <Button variant="danger" size="sm">
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !error && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No student records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-xs text-slate-500">
          Showing {visible.length} of {filtered.length} students
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage((v) => Math.max(1, v - 1))}>
            Prev
          </Button>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {clampedPage} / {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
