"use client";

import { toast } from "sonner";
import { CheckCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCheckinGoal, useGoal } from "@/features/goals/hooks/useGoals";
import { currentStreak, isCheckedToday } from "@/features/goals/lib/streak";
import { formatDate } from "@/lib/utils";

export function MonthlyGoalCard({ userId }: { userId: string }) {
  const { data: goal, isLoading } = useGoal(userId);
  const checkin = useCheckinGoal(userId);

  if (isLoading || !goal) return null;

  const done = goal.checkins.length;
  const pct = Math.min(100, Math.round((done / goal.cible) * 100));
  const streak = currentStreak(goal.checkins);
  const checkedToday = isCheckedToday(goal.checkins);
  const completed = done >= goal.cible;

  const doCheckin = async () => {
    try {
      await checkin.mutateAsync();
      toast.success("تم تسجيلت حصتك — واصل! 💪");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  };

  return (
    <Card className="border-primary/25 bg-gradient-to-l from-primary/10 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="size-4 text-primary" />
          تحدي الشهر
        </CardTitle>
        <CardDescription>{goal.titre}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} / {goal.cible} حصة
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <Flame className="size-3.5" />
                {streak} يوم متتالي
              </span>
            )}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {completed ? (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCheck className="size-4" />
            كمّلت هدف الشهر — برافو!
          </p>
        ) : (
          <Button
            className="w-full"
            onClick={doCheckin}
            disabled={checkin.isPending || checkedToday}
          >
            <CheckCheck />
            {checkedToday ? "سجّلت حصتك اليوم" : "حضرت حصة اليوم"}
          </Button>
        )}
        {goal.checkins.length > 0 && (
          <p className="text-xs text-muted-foreground">
            آخر حصة: {formatDate(goal.checkins[goal.checkins.length - 1])}
          </p>
        )}
      </CardContent>
    </Card>
  );
}