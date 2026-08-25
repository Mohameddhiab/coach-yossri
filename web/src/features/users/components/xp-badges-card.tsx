"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Dumbbell,
  Flame,
  Medal,
  Scale,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { useWeightLogs } from "@/features/progress/hooks/useProgress";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { computeBadges, computeFidelity, computeXp, type BadgeDef } from "@/shared/lib/insights";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<BadgeDef["icon"], typeof Scale> = {
  scale: Scale,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  medal: Medal,
  calendar: CalendarDays,
  target: Target,
  dumbbell: Dumbbell,
};

export function XpBadgesCard() {
  const { data: logs, isLoading: logsLoading } = useWeightLogs("me");
  const { data: goal } = useGoal("me");
  const { data: me, isLoading: meLoading } = useMySubscription();

  const badges = useMemo(() => {
    if (!logs || !me) return null;
    return computeBadges({
      user: me.user,
      weightLogs: logs,
      goal: goal ?? null,
      fidelity: computeFidelity(me.history),
    });
  }, [logs, goal, me]);

  const xp = useMemo(() => {
    if (!logs || !me) return null;
    return computeXp(logs, goal ?? null, computeFidelity(me.history));
  }, [logs, goal, me]);

  useEffect(() => {
    if (!badges || !me) return;
    const key = `9awi_badges_${me.user.id}`;
    let known: string[] = [];
    try {
      known = JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
    } catch {
      known = [];
    }
    const fresh = badges.filter((b) => b.unlocked && !known.includes(b.badge.id));
    if (fresh.length > 0) {
      fresh.forEach((b) => {
        toast(`🎉 أوسمة جديدة: ${b.badge.label}`, {
          description: b.badge.description,
        });
      });
      localStorage.setItem(
        key,
        JSON.stringify([...known, ...fresh.map((f) => f.badge.id)]),
      );
    }
  }, [badges, me]);

  if (logsLoading || meLoading || !badges || !xp) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4 text-primary" />
            قوّة الأسبوع
          </CardTitle>
          <CardDescription>
            كل تسجيل وزن وكل حصة وكل نشاط يزيد رصيدك — المستوى:{" "}
            <span className="font-bold text-foreground">{xp.level.label}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold tabular-nums text-primary">{xp.xp} نقطة</span>
            {xp.next ? (
              <span className="text-xs text-muted-foreground">
                {xp.next.label} بعد {xp.xpForNext - xp.xpIntoLevel} نقطة
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-500">أعلى مستوى! 👑</span>
            )}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-l from-primary to-amber-400 transition-all duration-700"
              style={{ width: `${xp.progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">الأوسمة ({unlockedCount}/{badges.length})</CardTitle>
          <CardDescription>واصل حتى تكسب الكل — كل وسام قصة نجاح</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {badges.map(({ badge, unlocked }) => {
              const Icon = BADGE_ICONS[badge.icon];
              return (
                <div
                  key={badge.id}
                  title={`${badge.label} — ${badge.description}`}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center",
                    unlocked
                      ? "border-amber-400/40 bg-amber-400/10"
                      : "border-transparent bg-muted/40 opacity-45 grayscale",
                  )}
                >
                  <Icon className={cn("size-6", unlocked ? "text-amber-500" : "text-muted-foreground")} />
                  <span className="text-[10px] font-semibold leading-tight">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}