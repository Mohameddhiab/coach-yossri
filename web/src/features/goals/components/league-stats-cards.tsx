"use client";

import { Flame, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { currentStreak } from "@/features/goals/lib/streak";
import type { ChallengeLeaderboard } from "@/features/users/api/users.api";

export function LeagueStatsCards({
  goalDone,
  goalCible,
  checkins,
  leaderboard,
}: {
  goalDone: number;
  goalCible: number;
  checkins: string[];
  leaderboard: ChallengeLeaderboard | undefined;
}) {
  const streak = currentStreak(checkins);
  const myRank = leaderboard?.my_rank;
  const pct = goalCible > 0 ? Math.min(100, Math.round((goalDone / goalCible) * 100)) : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <Flame className="size-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black tabular-nums leading-tight">{streak}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {streak === 1 ? "يوم متواصل" : "أيام متتالية"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            {myRank ? (
              <span className="text-sm font-black tabular-nums text-primary">
                #{myRank.rank}
              </span>
            ) : (
              <Target className="size-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black tabular-nums leading-tight">
              {myRank?.count ?? 0}
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground">حصة هذا الشهر</p>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "border-emerald-400/30 bg-gradient-to-br to-transparent",
          pct >= 100 ? "from-emerald-500/15" : "from-muted/30",
        )}
      >
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            {pct >= 100 ? (
              <TrendingUp className="size-5 text-emerald-500" />
            ) : pct > 50 ? (
              <TrendingUp className="size-5 text-emerald-500" />
            ) : pct > 0 ? (
              <Minus className="size-5 text-muted-foreground" />
            ) : (
              <TrendingDown className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black tabular-nums leading-tight">
              {goalDone}/{goalCible}
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground">{pct}% الهدف</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
