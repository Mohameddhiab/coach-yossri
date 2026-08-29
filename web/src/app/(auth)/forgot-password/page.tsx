import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "نسيت كلمة المرور",
};

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 start-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
      />
      <ForgotPasswordForm />
    </div>
  );
}
