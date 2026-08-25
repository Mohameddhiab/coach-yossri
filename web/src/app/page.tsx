import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/features/landing/components/landing-page";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default async function Home() {
  const cookieStore = await cookies();
  if (!cookieStore.has("9awi_access")) {
    return <LandingPage />;
  }
  let role: string | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (res.ok) {
      const me = (await res.json()) as { role?: string };
      role = me.role ?? null;
    }
  } catch {
    role = null;
  }
  if (!role) {
    return <LandingPage />;
  }
  redirect(role === "COACH" ? "/dashboard" : "/plan");
}