import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_42%),radial-gradient(circle_at_80%_80%,color-mix(in_oklch,var(--ring)_8%,transparent),transparent_40%)] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 start-1/2 h-96 w-[36rem] -translate-x-1/2 animate-float rounded-full bg-primary/12 blur-3xl"
      />
      <LoginForm />
    </div>
  );
}