export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<boolean> | null = null;

function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )coachyosri_access=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(),
        });
        if (refreshRes.ok) {
          // Refresh a posé un nouveau cookie HttpOnly sur onrender.com → copie sur vercel.app pour le proxy
          try {
            const data = (await refreshRes.clone().json()) as {
              access_token?: string;
            };
            if (data?.access_token && typeof document !== "undefined") {
              const secure = location.protocol === "https:" ? "; Secure" : "";
              document.cookie = `coachyosri_access=${data.access_token}; Path=/; Max-Age=900; SameSite=Lax${secure}`;
            }
          } catch {}
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiClient<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const doFetch = async () => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(),
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res;
  };

  let res = await doFetch();

  if (res.status === 401 && path !== "/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    let code: string | undefined;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
      if (data?.code) code = data.code;
    } catch {
      // corps non-JSON
    }
    throw new ApiError(res.status, message, code);
  }
  // Backend renvoie parfois 200 avec body vide pour `null` (plan inexistant) → éviter crash JSON
  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T;
  }
}

export function isSubscriptionExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "SUBSCRIPTION_EXPIRED";
}