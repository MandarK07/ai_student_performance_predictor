import { apiFetch } from "./http";

export type StudentListItem = {
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  enrollment_date: string;
  status: string;
  created_at: string;
};

export type StudentPerformanceResponse = {
  student_code: string;
  full_name: string;
  email: string;
  academic_history: Array<{
    academic_year: string;
    semester: string;
    gpa: number | null;
    attendance_rate: number | null;
    study_hours_per_week: number | null;
  }>;
  latest_prediction: {
    predicted_gpa: number | null;
    category: string | null;
    confidence: number | null;
    risk_level: string | null;
    recommendation: string | null;
    date: string;
  } | null;
};

export type StudentProfileResponse = {
  student: {
    student_id: string;
    student_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    date_of_birth: string;
    gender: string;
    enrollment_date: string;
    status: string;
    created_at: string;
  };
  academic_metrics: {
    total_semesters: number;
    latest_gpa: number | null;
    average_gpa: number | null;
    latest_attendance_rate: number | null;
    average_attendance_rate: number | null;
    average_study_hours_per_week: number | null;
    total_absences: number;
    total_late_submissions: number;
    gpa_trend: string;
  };
  latest_prediction: {
    prediction_id: string;
    predicted_gpa: number | null;
    predicted_category: string | null;
    confidence_score: number | null;
    risk_level: string | null;
    recommendation: string | null;
    prediction_date: string;
  } | null;
  academic_history: Array<{
    record_id: string;
    academic_year: string;
    semester: string;
    gpa: number | null;
    total_credits: number | null;
    attendance_rate: number | null;
    study_hours_per_week: number | null;
    class_participation_score: number | null;
    late_submissions: number | null;
    absences: number | null;
    created_at: string;
  }>;
  prediction_history: Array<{
    prediction_id: string;
    academic_year: string;
    semester: string;
    predicted_gpa: number | null;
    predicted_category: string | null;
    confidence_score: number | null;
    risk_level: string | null;
    recommendation: string | null;
    prediction_date: string;
    model: {
      model_name: string;
      model_version: string;
      algorithm: string;
    } | null;
    interventions: Array<{
      intervention_id: string;
      intervention_type: string | null;
      priority: string | null;
      status: string | null;
      description: string;
      assigned_to: string | null;
      due_date: string | null;
      created_at: string;
    }>;
  }>;
  recommendations: Array<{
    source: "prediction" | "intervention";
    text: string;
    risk_level?: string;
    status?: string;
    priority?: string;
    date: string;
  }>;
};

export async function fetchStudents(params?: {
  skip?: number;
  limit?: number;
  status?: "active" | "inactive" | "graduated" | "suspended";
}): Promise<StudentListItem[]> {
  const query = new URLSearchParams();
  query.set("skip", String(params?.skip ?? 0));
  query.set("limit", String(params?.limit ?? 100));
  if (params?.status) {
    query.set("status", params.status);
  }

  const response = await apiFetch(`/students?${query.toString()}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch students");
  }
  return response.json();
}

export async function fetchStudentPerformance(studentCode: string): Promise<StudentPerformanceResponse> {
  const response = await apiFetch(`/students/${encodeURIComponent(studentCode)}/performance`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch student performance");
  }

  return response.json();
}

export async function fetchStudentProfile(studentCode: string): Promise<StudentProfileResponse> {
  const response = await apiFetch(`/students/${encodeURIComponent(studentCode)}/profile`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch student profile");
  }

  return response.json();
}
