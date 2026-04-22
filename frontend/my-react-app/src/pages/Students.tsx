import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import StudentsTable, { type StudentRisk, type StudentRow } from "../components/students/StudentsTable";
import { createStudent, fetchStudentPerformance, fetchStudents, type CreateStudentRequest } from "../api/students";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { FormFieldWrapper } from "../components/ui/FormFieldWrapper";
import { useAuth } from "../context/AuthContext";

function buildInitialForm(): CreateStudentRequest {
  return {
    student_code: "",
    first_name: "",
    last_name: "",
    email: "",
    gender: "Prefer not to say",
    enrollment_date: new Date().toISOString().slice(0, 10),
  };
}

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

function buildStudentRow(student: {
  student_code: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}, performance?: { latest_prediction?: { predicted_gpa: number | null; risk_level: string | null } | null; academic_history?: Array<{ attendance_rate: number | null }> | null } | null): StudentRow {
  let attendance: number | null = null;
  if (performance?.academic_history) {
    for (const record of performance.academic_history) {
      if (record.attendance_rate !== null && record.attendance_rate !== undefined) {
        attendance = record.attendance_rate;
        break;
      }
    }
  }

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
}

export default function Students() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "true");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  
  const initialForm = buildInitialForm();
  if (searchParams.get("create") === "true") {
    initialForm.email = searchParams.get("email") || "";
    initialForm.student_code = searchParams.get("student_code") || "";
    const fullName = searchParams.get("full_name") || "";
    if (fullName) {
      const parts = fullName.split(" ");
      initialForm.first_name = parts[0] || "";
      initialForm.last_name = parts.slice(1).join(" ") || "";
    }
  }
  const [form, setForm] = useState<CreateStudentRequest>(initialForm);

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
        withPerformance.map(({ student, performance }) => buildStudentRow(student, performance))
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

  const resetCreateForm = () => {
    setForm(buildInitialForm());
    setCreateError(null);
  };

  const handleFieldChange = <K extends keyof CreateStudentRequest>(field: K, value: CreateStudentRequest[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateStudent = async () => {
    if (
      !form.student_code.trim() ||
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim()
    ) {
      setCreateError("Please fill in all required student details.");
      return;
    }

    setCreateSaving(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const created = await createStudent({
        ...form,
        student_code: form.student_code.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        enrollment_date: form.enrollment_date || undefined,
      });
      setRows((current) => [
        buildStudentRow(created, null),
        ...current.filter((row) => row.studentCode !== created.student_code),
      ]);
      setCreateSuccess(`Student record created for ${created.first_name} ${created.last_name} (${created.student_code}).`);
      setCreateOpen(false);
      resetCreateForm();
      await loadStudents();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, review risk level, and manage student records.
          </p>
        </div>
        <Button onClick={() => {
          setCreateOpen((current) => !current);
          setCreateError(null);
          setCreateSuccess(null);
        }}>
          <PlusCircle className="h-4 w-4" />
          {createOpen ? "Close Form" : "Create Student"}
        </Button>
      </div>

      {createSuccess && (
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-emerald-700">{createSuccess}</p>
        </Card>
      )}

      {createOpen && (
        <Card className="space-y-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Create Student Record</h2>
            <p className="text-sm text-slate-500">
              Admin and teacher users can add student records here before sending enrollment invites.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormFieldWrapper label="Student Code">
              <Input
                value={form.student_code}
                onChange={(event) => handleFieldChange("student_code", event.target.value)}
                placeholder="e.g. 202600123"
              />
            </FormFieldWrapper>

            <FormFieldWrapper label="First Name">
              <Input
                value={form.first_name}
                onChange={(event) => handleFieldChange("first_name", event.target.value)}
                placeholder="Enter first name"
              />
            </FormFieldWrapper>

            <FormFieldWrapper label="Last Name">
              <Input
                value={form.last_name}
                onChange={(event) => handleFieldChange("last_name", event.target.value)}
                placeholder="Enter last name"
              />
            </FormFieldWrapper>

            <FormFieldWrapper label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => handleFieldChange("email", event.target.value)}
                placeholder="student@example.com"
              />
            </FormFieldWrapper>


            <FormFieldWrapper label="Gender">
              <Select
                value={form.gender}
                onChange={(event) => handleFieldChange("gender", event.target.value as CreateStudentRequest["gender"])}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </Select>
            </FormFieldWrapper>

            <FormFieldWrapper label="Enrollment Date">
              <Input
                type="date"
                value={form.enrollment_date || ""}
                onChange={(event) => handleFieldChange("enrollment_date", event.target.value)}
              />
            </FormFieldWrapper>
          </div>

          {createError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {createError}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateStudent} disabled={createSaving}>
              {createSaving ? "Creating..." : "Create Student Record"}
            </Button>
          </div>
        </Card>
      )}

      <StudentsTable
        rows={rows}
        loading={loading}
        error={error}
        onRefresh={loadStudents}
        canDelete={user?.role === "admin"}
      />
    </div>
  );
}
