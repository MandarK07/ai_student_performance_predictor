const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const fallbackApiBaseUrl = import.meta.env.DEV ? "/api" : `${window.location.origin}/api`;
const API_BASE_URL = (configuredApiBaseUrl || fallbackApiBaseUrl).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return true;
    }
    const decoded = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(decoded) as { exp?: number };
    if (!payload.exp) {
      return false;
    }
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function hasValidTokens(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) {
    return false;
  }
  if (isTokenExpired(accessToken) || isTokenExpired(refreshToken)) {
    clearTokens();
    return false;
  }
  return true;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const payload = await response.json();
  setTokens(payload.access_token, payload.refresh_token);
  return payload.access_token;
}

export async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 403) {
    window.location.href = "/access-denied";
    return response;
  }

  if (response.status !== 401 || !retry || path.startsWith("/auth/")) {
    return response;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  const newAccessToken = await refreshPromise;
  if (!newAccessToken) {
    return response;
  }

  const retryHeaders = new Headers(init.headers || {});
  retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: retryHeaders,
  });
}
