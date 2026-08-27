"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Flame,
  Scale,
  StickyNote,
  Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { useWeightLogs } from "@/features/progress/hooks/useProgress";
import { useNotes } from "@/features/users/hooks/useUsers";
import { usePlan } from "@/features/meal-plans/hooks/useMealPlan";
import { listSubscriptions } from "@/features/subscriptions/api/subscriptions.api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  date: string;
  type: "weight" | "subscription" | "note" | "checkin" | "plan";
  text: string;
  detail?: string;
}

const EVENT_STYLE: Record<TimelineEvent["type"], string> = {
  weight: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  subscription: "bg-primary/15 text-primary",
  note: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  checkin: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  plan: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

const EVENT_ICON = {
  weight: Scale,
  subscription: Ticket,
  note: StickyNote,
  checkin: Flame,
  plan: ClipboardList,
};

export function MemberTimeline({ userId }: { userId: string }) {
  const { data: weightLogs } = useWeightLogs(userId);
  const { data: goal } = useGoal(userId);
  const { data: notes } = useNotes(userId);
  const { data: plan } = usePlan(userId);
  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: () => listSubscriptions(userId),
    enabled: !!userId,
  });

  const events: TimelineEvent[] = [
    ...(weightLogs ?? []).map((w) => ({
      id: `w-${w.id}`,
      date: w.date,
      type: "weight" as const,
      text: `سجّل وزنة جديدة: ${w.poids_kg} كغ`,
      detail: w.note ?? undefined,
    })),
    ...(subscriptions ?? []).map((s) => ({
      id: `s-${s.id}`,
      date: s.created_at,
      type: "subscription" as const,
      text: `اشتراك جديد: ${s.montant} د.ت`,
      detail: `${formatDate(s.date_debut)} → ${formatDate(s.date_fin)}`,
    })),
    ...(notes ?? []).map((n) => ({
      id: `n-${n.id}`,
      date: n.created_at,
      type: "note" as const,
      text: "ملاحظة خاصة",
      detail: n.contenu,
    })),
    ...(goal?.checkins ?? []).map((c, i) => ({
      id: `c-${c}-${i}`,
      date: c,
      type: "checkin" as const,
      text: "حصة تدريبية مسجّلة",
      detail: goal?.titre ?? "",
    })),
    ...(plan
      ? [
          {
            id: `p-${plan.id}`,
            date: plan.updated_at,
            type: "plan" as const,
            text: `خطة «${plan.titre}» — الإصدار ${plan.version}`,
          },
        ]
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">سجل النشاط</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState title="لا يوجد نشاط بعد" />
        ) : (
          <div className="relative space-y-4 before:absolute before:inset-y-1 before:start-[13px] before:w-px before:bg-border">
            {events.slice(0, 40).map((event) => {
              const Icon = EVENT_ICON[event.type];
              return (
                <div key={event.id} className="relative flex gap-3 ps-0">
                  <div
                    className={cn(
                      "z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                      EVENT_STYLE[event.type],
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-sm font-medium">{event.text}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    {event.detail && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={event.detail}>
                        {event.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}