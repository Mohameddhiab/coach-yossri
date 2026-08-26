import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/shared/lib/domain";

const ACCESS_COOKIE = "9awi_access";

const COACH_PATHS = ["/dashboard", "/users", "/settings"];
const USER_PATHS = ["/plan", "/progression", "/abonnement", "/reglages"];
const PUBLIC_AUTH_PATHS = ["/forgot-password", "/reset-password"];

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
      const isRsc =
        request.headers.get("rsc") === "1" ||
        request.nextUrl.searchParams.has("_rsc") ||
        request.headers.has("next-router-state-tree");
      if (isRsc) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAuthPage || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = role === "COACH" ? "/dashboard" : "/plan";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isCoachPath = COACH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isUserPath = USER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (role === "COACH" && isUserPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (role === "USER" && isCoachPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/plan";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};