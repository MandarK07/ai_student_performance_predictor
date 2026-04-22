import { apiFetch } from "./http";
import type { StudentProfileResponse } from "./students";

export type StudentDashboardPayload = StudentProfileResponse;

export async function fetchStudentDashboard(): Promise<StudentDashboardPayload> {
  const response = await apiFetch("/dashboard/student/me");
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to load student dashboard");
  }
  return response.json();
}
