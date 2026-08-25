import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "كلمة سر جديدة",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 start-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
      />
      <ResetPasswordForm token={token ?? ""} />
    </div>
  );
}
