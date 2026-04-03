import { apiFetch } from "./http";

export type StudentDashboardPayload = any;

export async function fetchStudentDashboard(): Promise<StudentDashboardPayload> {
  const response = await apiFetch("/dashboard/student/me");
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to load student dashboard");
  }
  return response.json();
}
