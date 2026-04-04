import { apiFetch } from "./http";

export type InviteRequest = {
  email: string;
  student_code?: string;
  first_name?: string;
  last_name?: string;
};

export type InviteResponse = {
  invite_id: string;
  token: string;
  expires_at: string;
};

export type InviteStatus = {
  email: string;
  student_code?: string;
  first_name?: string;
  last_name?: string;
  expires_at: string;
  status: string;
};

export type AcceptInviteRequest = {
  token: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  student_code?: string;
};

export async function createInvite(payload: InviteRequest): Promise<InviteResponse> {
  const res = await apiFetch("/enrollments/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create invite");
  }
  return res.json();
}

export async function getInviteStatus(token: string): Promise<InviteStatus> {
  const res = await apiFetch(`/enrollments/status/${token}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Invalid or expired invite");
  }
  return res.json();
}

export async function acceptInvite(payload: AcceptInviteRequest): Promise<void> {
  const res = await apiFetch("/enrollments/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to accept invite");
  }
}
