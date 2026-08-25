"use client";

import { Phone, Timer } from "lucide-react";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { daysLeft } from "@/shared/lib/domain";

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function RenewalCountdownBanner() {
  const { data } = useMySubscription();

  if (!data?.subscription) return null;
  const remaining = daysLeft(data.subscription);
  if (remaining <= 0 || remaining > 7) return null;

  const urgent = remaining <= 3;
  const coach = data.coach;
  const phone = coach ? phoneDigits(coach.telephone) : "";

  return (
    <div
      className={
        urgent
          ? "flex items-center justify-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive"
          : "flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"
      }
    >
      <Timer className="size-3.5" />
      <span>
        بقي لك {remaining} {remaining === 1 ? "يوم واحد" : "أيام"} — جدد اشتراكك مع المدرب
      </span>
      {phone && (
        <span className="flex items-center gap-1">
          <a href={`tel:${phone}`} className="underline underline-offset-2">
            <Phone className="inline size-3.5" />
            اتصل
          </a>
          <span className="opacity-50">|</span>
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            واتساب
          </a>
        </span>
      )}
    </div>
  );
}