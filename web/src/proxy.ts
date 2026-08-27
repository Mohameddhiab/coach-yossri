import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/shared/lib/domain";

const ACCESS_COOKIE = "9awi_access";
const isProd = process.env.NODE_ENV === "production";
const backendUrl = process.env.SERVER_API_URL || "http://localhost:3001";

const COACH_PATHS = ["/dashboard", "/users", "/settings", "/pointage", "/notifications", "/classification", "/messages"];
const USER_PATHS = ["/plan", "/progression", "/abonnement", "/reglages"];
const PUBLIC_AUTH_PATHS = ["/forgot-password", "/reset-password"];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://wger.de https://*.supabase.co https://cdn.jsdelivr.net https://raw.githubusercontent.com http://localhost:* http://127.0.0.1:*`,
    "font-src 'self' data:",
    `connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https://*.supabase.co https://*.supabase.in http://backend:* http://backend:3001 ${isProd ? backendUrl : ""}`,
    "frame-ancestors 'none'",
  ].join("; "),
};

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function decodeAccess(token: string): { role: Role; userId: string } | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf-8"),
    ) as { sub?: string; role?: string; exp?: number };
    if (!payload.sub || (payload.role !== "USER" && payload.role !== "COACH")) return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return { role: payload.role, userId: payload.sub };
  } catch {
    return null;
  }
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");

  const isAuthPage =
    isLoginPage || matchesPath(pathname, PUBLIC_AUTH_PATHS);

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const session = accessToken ? decodeAccess(accessToken) : null;
  const role = session?.role ?? null;

  if (!role) {
    if (!isAuthPage && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  if (isAuthPage || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = role === "COACH" ? "/dashboard" : "/plan";
    url.search = "";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const isCoachPath = matchesPath(pathname, COACH_PATHS);
  const isUserPath = matchesPath(pathname, USER_PATHS);

  if (role === "COACH" && isUserPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (role === "USER" && isCoachPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/plan";
    url.search = "";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
