import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = {
  title: "تأكيد البريد الإلكتروني",
};

export default async function VerifyEmailPage({
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
      <VerifyEmailForm token={token ?? ""} />
    </div>
  );
}