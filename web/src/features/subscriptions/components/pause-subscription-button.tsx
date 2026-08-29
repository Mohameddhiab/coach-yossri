"use client";

import { toast } from "sonner";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subscription } from "@/shared/lib/domain";
import { isPaused } from "@/shared/lib/domain";
import { usePauseSubscription, useResumeSubscription } from "@/features/subscriptions/hooks/useSubscriptions";

export function PauseSubscriptionButton({
  userId,
  subscription,
}: {
  userId: string;
  subscription: Subscription;
}) {
  const pause = usePauseSubscription(userId);
  const resume = useResumeSubscription(userId);
  const paused = isPaused(subscription);

  if (paused) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={resume.isPending}
        onClick={async () => {
          try {
            await resume.mutateAsync(subscription.id);
            toast.success("تم استئناف الاشتراك — أضيفت فترة التجميد إلى تاريخ النهاية");
          } catch {
            toast.error("تعذّر استئناف الاشتراك — يُرجى المحاولة مرة أخرى");
          }
        }}
      >
        <Play />
        استئناف الاشتراك
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pause.isPending}
      onClick={async () => {
        try {
          await pause.mutateAsync(subscription.id);
          toast.success("تم تجميد الاشتراك مؤقتًا — الأيام المتبقية محفوظة");
        } catch {
          toast.error("تعذّر تجميد الاشتراك — يُرجى المحاولة مرة أخرى");
        }
      }}
    >
      <Pause />
      تجميد الاشتراك
    </Button>
  );
}