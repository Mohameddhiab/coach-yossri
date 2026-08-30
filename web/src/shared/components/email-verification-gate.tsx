"use client";

import { useState } from "react";
import { Loader2, LogOut, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/lib/auth-context";

export function EmailVerificationGate() {
  const { user, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await apiClient("POST", "/auth/verify-email/resend");
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <CardTitle className="text-xl">أكّد بريدك الإلكتروني</CardTitle>
          <CardDescription className="pt-1 text-sm leading-relaxed text-muted-foreground">
            تم إرسال رابط التحقق إلى بريدك الإلكتروني{" "}
            <span dir="ltr" className="font-bold text-foreground">
              {user?.email}
            </span>
            . افتح الرابط لتأكيد حسابك — ولن تتمكن من الوصول إلى لوحة المتابعة قبل التأكيد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              تم الإرسال — راجع بريدك الإلكتروني
            </div>
          ) : (
            <Button onClick={resend} disabled={sending} className="w-full gap-1.5">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              إعادة إرسال رابط التحقق
            </Button>
          )}
          <Button variant="ghost" onClick={() => void logout()} className="w-full gap-1.5">
            <LogOut className="size-4" />
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}