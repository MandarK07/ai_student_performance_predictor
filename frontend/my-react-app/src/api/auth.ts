import { apiFetch, clearTokens, getAccessToken, getRefreshToken, hasValidTokens, setTokens } from "./http";

export type AuthUser = {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  student_id: string | null;
};

export type RegisterUserRequest = {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "teacher" | "counselor" | "student" | "parent";
  is_active?: boolean;
};

export type RegisterUserResponse = {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type SignupRequest = {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "teacher" | "student";
};

export async function login(usernameOrEmail: string, password: string, role: string): Promise<void> {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username_or_email: usernameOrEmail,
      password,
      role,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "Login failed");
  }

  setTokens(payload.access_token, payload.refresh_token);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch("/auth/me", { method: "GET" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
    }
    throw new Error(payload.detail || "Failed to load user");
  }
  return payload;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return;
  }

  await apiFetch("/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  clearTokens();
}

export function isAuthenticated(): boolean {
  return hasValidTokens() && Boolean(getAccessToken() && getRefreshToken());
}

export async function registerUser(data: RegisterUserRequest): Promise<RegisterUserResponse> {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "User registration failed");
  }
  return payload;
}

export async function signupUser(data: SignupRequest): Promise<RegisterUserResponse> {
  const response = await apiFetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "Signup failed");
  }
  return payload;
}
