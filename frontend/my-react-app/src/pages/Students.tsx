import { useEffect, useState } from "react";
import StudentsTable, { type StudentRisk, type StudentRow } from "../components/students/StudentsTable";
import { fetchStudentPerformance, fetchStudents } from "../api/students";

function normalizeRisk(risk: string | null | undefined): StudentRisk {
  if (!risk) {
    return "Unknown";
  }
  const value = risk.toLowerCase();
  if (value.includes("critical")) {
    return "Critical";
  }
  if (value.includes("high")) {
    return "High";
  }
  if (value.includes("medium")) {
    return "Medium";
  }
  if (value.includes("low")) {
    return "Low";
  }
  return "Unknown";
}

export default function Students() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const students = await fetchStudents({ limit: 100 });

        const withPerformance = await Promise.all(
          students.map(async (student) => {
            try {
              const performance = await fetchStudentPerformance(student.student_code);
              return { student, performance };
            } catch {
              return { student, performance: null };
            }
          })
        );

        if (!active) {
          return;
        }

        setRows(
          withPerformance.map(({ student, performance }) => ({
            studentCode: student.student_code,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            status: student.status,
            predictedGpa: performance?.latest_prediction?.predicted_gpa ?? null,
            attendance: performance?.academic_history?.[0]?.attendance_rate ?? null,
            risk: normalizeRisk(performance?.latest_prediction?.risk_level),
          }))
        );
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load students");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
        <p className="text-sm text-slate-500">Search, filter, review risk level, and manage student records.</p>
      </div>
      <StudentsTable rows={rows} loading={loading} error={error} />
    </div>
  );
}
