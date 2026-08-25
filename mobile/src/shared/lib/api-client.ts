import { getToken } from "./token";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

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
  method: string,
  path: string,
  body?: object,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = "صار خطأ";
    let code: string | undefined;
    try {
      const data = (await res.json()) as { message?: string; code?: string };
      message = data.message ?? message;
      code = data.code;
    } catch {
      // corps non JSON
    }
    throw new ApiError(res.status, message, code);
  }
  return (await res.json()) as T;
}

export function isSubscriptionExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "SUBSCRIPTION_EXPIRED";
}