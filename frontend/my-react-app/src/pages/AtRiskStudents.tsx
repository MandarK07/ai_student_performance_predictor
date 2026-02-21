import { useEffect, useMemo, useState } from "react";
import { getAtRiskStudents, type AtRiskStudent } from "../api/predict";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function AtRiskStudents() {
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAtRiskStudents();
        if (!active) {
          return;
        }

        const unique = new Map<string, AtRiskStudent>();
        for (const item of response.students) {
          if (!unique.has(item.student_code)) {
            unique.set(item.student_code, item);
          }
        }
        setStudents(Array.from(unique.values()));
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load at-risk students");
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

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => (a.risk_level === "Critical" ? -1 : 1) - (b.risk_level === "Critical" ? -1 : 1)),
    [students]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">At-Risk Students</h1>
        <p className="text-sm text-slate-500">Prioritize interventions for students with elevated risk signals.</p>
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-slate-600">Loading at-risk students...</p>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {sortedStudents.map((student) => (
          <Card key={student.student_code} className="border-l-4 border-l-red-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{student.full_name}</p>
                <p className="text-sm text-slate-500">
                  {student.student_code} • Predicted GPA {student.predicted_gpa?.toFixed(2) || "N/A"}
                </p>
                <p className="mt-1 text-sm text-slate-600">{student.recommendation || "No recommendation available."}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="high">{student.risk_level} Risk</Badge>
                <Button variant="danger" size="sm">
                  Create Intervention
                </Button>
                <Button variant="secondary" size="sm">
                  Contact Guardian
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!loading && !error && sortedStudents.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">No at-risk students found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
