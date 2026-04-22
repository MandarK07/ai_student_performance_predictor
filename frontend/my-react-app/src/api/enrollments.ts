import { apiFetch } from "./http";

export type InviteRequest = {
  email: string;
  student_code?: string;
  first_name?: string;
  last_name?: string;
};

export type LinkedStudent = {
  student_id: string;
  student_code: string;
  full_name: string;
  email: string;
  matched_by: string;
};

export type InvitePreviewResponse = {
  matched_by: string;
  linked_student: LinkedStudent;
};

export type InviteResponse = {
  invite_id: string;
  token: string;
  expires_at: string;
  matched_by: string;
  linked_student: LinkedStudent;
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

export async function previewInvite(payload: InviteRequest): Promise<InvitePreviewResponse> {
  const res = await apiFetch("/enrollments/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to match student record");
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
export type LinkingRequest = {
  request_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  student_code: string | null;
  status: string;
  created_at: string;
};

export async function requestLinking(studentCode?: string): Promise<LinkingRequest> {
  const res = await apiFetch("/enrollments/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_code: studentCode }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to submit request");
  }
  return res.json();
}

export async function getMyLinkingRequest(): Promise<LinkingRequest | null> {
  const res = await apiFetch("/enrollments/my-request");
  if (!res.ok) return null;
  return res.json();
}

export async function getAllLinkingRequests(status?: string): Promise<LinkingRequest[]> {
  const url = status ? `/enrollments/link-requests?status=${status}` : "/enrollments/link-requests";
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch linking requests");
  return res.json();
}

export async function approveLinkingRequest(requestId: string, studentId: string, notes?: string): Promise<void> {
  const res = await apiFetch(`/enrollments/link-requests/${requestId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link_to_student_id: studentId, admin_notes: notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to approve request");
  }
}

export async function rejectLinkingRequest(requestId: string, notes?: string): Promise<void> {
  const res = await apiFetch(`/enrollments/link-requests/${requestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_notes: notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to reject request");
  }
}
