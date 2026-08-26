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

export async function apiClient<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const doFetch = async () => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res;
  };

  let res = await doFetch();

  if (res.status === 401 && path !== "/auth/refresh") {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        res = await doFetch();
      }
    } catch {
      // refresh failed — fall through to error
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
  return (await res.json()) as T;
}

export function isSubscriptionExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "SUBSCRIPTION_EXPIRED";
}