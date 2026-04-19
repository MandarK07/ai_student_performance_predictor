import { useCallback, useEffect, useState } from "react";
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

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const students = await fetchStudents({ limit: 500 });

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

      setRows(
        withPerformance.map(({ student, performance }) => {
          // Find the best available attendance value from any academic record
          let attendance: number | null = null;
          if (performance?.academic_history) {
            for (const record of performance.academic_history) {
              if (record.attendance_rate !== null && record.attendance_rate !== undefined) {
                attendance = record.attendance_rate;
                break;
              }
            }
          }
          // Normalize: if stored as decimal (0.0-1.0), convert to percentage
          if (attendance !== null && attendance > 0 && attendance <= 1) {
            attendance = attendance * 100;
          }

          return {
            studentCode: student.student_code,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            status: student.status,
            predictedGpa: performance?.latest_prediction?.predicted_gpa ?? null,
            attendance,
            risk: normalizeRisk(performance?.latest_prediction?.risk_level),
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Management</h1>
        <p className="text-sm text-slate-500 mt-1">Search, filter, review risk level, and manage student records.</p>
      </div>
      <StudentsTable rows={rows} loading={loading} error={error} onRefresh={loadStudents} />
    </div>
  );
}
