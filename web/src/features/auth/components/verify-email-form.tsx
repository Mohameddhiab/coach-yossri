"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MailCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/shared/components/logo";
import { apiClient } from "@/shared/lib/api-client";

type Status = "idle" | "working" | "done" | "error";

export function VerifyEmailForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(() => (token ? "working" : "idle"));
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    apiClient("POST", "/auth/verify-email", { token })
      .then(() => {
        if (cancelled) return;
        setStatus("done");
        timerId = setTimeout(() => {
          if (!cancelled) router.push("/login");
        }, 2500);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "حدث خطأ — يُرجى المحاولة مرة أخرى",
        );
      });
    return () => {
      cancelled = true;
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [token, router]);

  if (!token) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="items-center text-center">
          <Logo className="mb-2" />
          <CardTitle className="text-xl">رابط غير صحيح</CardTitle>
          <CardDescription>
            الرابط غير مكتمل — اطلب من مدربك إعادة إرسال رابط التفعيل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">العودة إلى تسجيل الدخول</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
      <CardHeader className="items-center text-center">
        <Logo className="mb-2" />
        <CardTitle className="text-xl">تأكيد البريد الإلكتروني</CardTitle>
        <CardDescription>جارٍ التحقق من الرابط الخاص بك</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "working" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">يرجى الانتظار…</p>
          </div>
        )}
        {status === "done" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <p className="text-sm font-semibold">تم تأكيد بريدك الإلكتروني بنجاح ✅</p>
            <p className="text-sm text-muted-foreground">جارٍ تحويلك إلى صفحة تسجيل الدخول…</p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <MailCheck className="size-7 text-destructive" />
            </div>
            <p className="text-sm font-semibold">تعذر تأكيد البريد</p>
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">العودة إلى تسجيل الدخول</Link>
            </Button>
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LogIn className="size-3.5" />
          <Link href="/login" className="font-semibold transition-colors hover:text-primary">
            تسجيل الدخول
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}