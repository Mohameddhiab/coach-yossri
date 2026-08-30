"use client";

import { useState } from "react";
import { Loader2, MailWarning, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/shared/lib/api-client";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";

export function EmailVerificationBanner() {
  const { data } = useMySubscription();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!data?.user || data.user.email_verified) return null;

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
    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
      <MailWarning className="size-3.5" />
      <span>بريدك الإلكتروني غير مؤكد بعد — أكّده لتفعيل الحساب بالكامل</span>
      {sent ? (
        <span className="text-emerald-600 dark:text-emerald-400">تم الإرسال — راجع بريدك</span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={resend}
          disabled={sending}
          className="h-6 gap-1 px-2 text-xs"
        >
          {sending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          إعادة إرسال رابط التفعيل
        </Button>
      )}
    </div>
  );
}