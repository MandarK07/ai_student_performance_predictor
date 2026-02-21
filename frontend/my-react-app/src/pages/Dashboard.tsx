import { useEffect, useMemo, useState } from "react";
import { fetchStudentPerformance, fetchStudents } from "../api/students";
import { getAtRiskStudents, type AtRiskStudent } from "../api/predict";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

type DashboardMetrics = {
  totalStudents: number;
  avgScorePct: number;
  highRisk: number;
  lowRisk: number;
  atRiskStudents: AtRiskStudent[];
};

function normalizeConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
}

function widthClass(ratio: number): string {
  if (ratio >= 0.9) return "w-11/12";
  if (ratio >= 0.8) return "w-10/12";
  if (ratio >= 0.7) return "w-9/12";
  if (ratio >= 0.6) return "w-8/12";
  if (ratio >= 0.5) return "w-7/12";
  if (ratio >= 0.4) return "w-6/12";
  if (ratio >= 0.3) return "w-5/12";
  if (ratio >= 0.2) return "w-4/12";
  if (ratio >= 0.1) return "w-3/12";
  if (ratio > 0) return "w-2/12";
  return "w-0";
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    avgScorePct: 0,
    highRisk: 0,
    lowRisk: 0,
    atRiskStudents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [students, atRisk] = await Promise.all([fetchStudents({ limit: 100 }), getAtRiskStudents()]);

        const performanceByStudent = await Promise.all(
          students.map(async (student) => {
            try {
              return await fetchStudentPerformance(student.student_code);
            } catch {
              return null;
            }
          })
        );

        if (!active) {
          return;
        }

        const scoreValues = performanceByStudent
          .map((item) => {
            if (item?.latest_prediction?.predicted_gpa !== null && item?.latest_prediction?.predicted_gpa !== undefined) {
              return item.latest_prediction.predicted_gpa * 25;
            }
            const latestGpa = item?.academic_history?.[0]?.gpa;
            return latestGpa !== null && latestGpa !== undefined ? latestGpa * 25 : null;
          })
          .filter((value): value is number => value !== null);

        const avgScorePct = scoreValues.length ? scoreValues.reduce((acc, value) => acc + value, 0) / scoreValues.length : 0;

        const uniqueHighRisk = new Map<string, AtRiskStudent>();
        for (const item of atRisk.students) {
          if (!uniqueHighRisk.has(item.student_code)) {
            uniqueHighRisk.set(item.student_code, item);
          }
        }

        const highRisk = uniqueHighRisk.size;
        const lowRisk = Math.max(0, students.length - highRisk);

        setMetrics({
          totalStudents: students.length,
          avgScorePct,
          highRisk,
          lowRisk,
          atRiskStudents: Array.from(uniqueHighRisk.values()).slice(0, 5),
        });
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const kpis = useMemo(
    () => [
      { label: "Total Students", value: metrics.totalStudents.toLocaleString(), tone: "info" as const },
      { label: "Avg Score", value: `${metrics.avgScorePct.toFixed(1)}%`, tone: "success" as const },
      { label: "High Risk", value: metrics.highRisk.toLocaleString(), tone: "danger" as const },
      { label: "Low Risk", value: metrics.lowRisk.toLocaleString(), tone: "success" as const },
    ],
    [metrics]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">AI-powered overview of student performance and risk trends.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label} className="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            <div className="mt-3">
              <Badge variant={item.tone}>{loading ? "Loading..." : "Live from DB"}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent High/Critical Risk Students</h2>
            <Badge variant="danger">{metrics.highRisk} flagged</Badge>
          </div>
          <div className="space-y-2">
            {metrics.atRiskStudents.length === 0 ? (
              <p className="text-sm text-slate-500">No at-risk students found.</p>
            ) : (
              metrics.atRiskStudents.map((student) => (
                <div key={student.student_code} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{student.full_name}</p>
                    <Badge variant="high">{student.risk_level}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {student.student_code} • Pred GPA: {student.predicted_gpa?.toFixed(2) || "N/A"} • Confidence:{" "}
                    {normalizeConfidence(student.confidence_score)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Risk Distribution</h2>
            <Badge variant="warning">Live</Badge>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>High/Critical</span>
                <span>{metrics.highRisk}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-red-500 transition-all duration-500 ${widthClass(
                    metrics.totalStudents ? metrics.highRisk / metrics.totalStudents : 0
                  )}`}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>Other Students</span>
                <span>{metrics.lowRisk}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-emerald-500 transition-all duration-500 ${widthClass(
                    metrics.totalStudents ? metrics.lowRisk / metrics.totalStudents : 0
                  )}`}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
