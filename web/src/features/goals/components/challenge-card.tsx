"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Swords, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChallengeLeaderboard } from "@/features/goals/hooks/useChallenge";
import type { LeaderboardPeriod } from "@/features/users/api/users.api";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";

const RANK_STYLE = [
  "bg-amber-400/20 text-amber-600 dark:text-amber-400",
  "bg-zinc-400/20 text-zinc-500 dark:text-zinc-400",
  "bg-orange-400/20 text-orange-600 dark:text-orange-400",
];

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "7", label: "7 أيام" },
  { value: "30", label: "30 يوم" },
  { value: "all", label: "الكل" },
];

export function ChallengeCard({ coach = false }: { coach?: boolean }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("7");
  const { data, isLoading, isError, refetch, isRefetching } =
    useChallengeLeaderboard(period);

  const rows = data?.top ?? [];
  const my_rank = data?.my_rank ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Swords className="size-4 text-primary" />
            تحدي الحضور — الأكثر حضوراً
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  period === p.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardTitle>
        <CardDescription>
          {coach
            ? "عدد الحصص المسجلة لكل عضو حسب الفترة"
            : "سجلت حصصك هذا الأسبوع؟ اطلع على ترتيبك"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Trophy className="size-5" />}
            title="لا يوجد ترتيب بعد"
            description={
              coach
                ? "الهدف الشهري يغذي الترتيب — الحصص تُصنف تلقائياً."
                : "سجل حضورك في القاعة لتظهر في الترتيب."
            }
          />
        ) : (
          <>
            {!coach && my_rank && (
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                <span className="text-sm font-semibold">مرتبتك</span>
                <span className="text-sm font-black tabular-nums text-primary">
                  #{my_rank.rank}
                  <span className="ms-1 text-xs font-medium text-muted-foreground">
                    ({my_rank.count} حصة)
                  </span>
                </span>
              </div>
            )}
            {rows.map((row, i) => {
              const inner = (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                        i < 3 ? RANK_STYLE[i] : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{row.pseudo}</span>
                    {i === 0 && <Crown className="size-3.5 shrink-0 text-amber-500" />}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {row.count} حصة
                    </span>
                    {coach && row.user_id && (
                      <span className="text-xs font-semibold text-primary">فتح</span>
                    )}
                  </div>
                </>
              );
              const rowClass = cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                row.pseudo === "أنت"
                  ? "border-primary/40 bg-primary/5"
                  : "bg-muted/30 hover:bg-muted/50",
              );
              return coach && row.user_id ? (
                <Link
                  key={row.user_id ?? row.pseudo}
                  href={`/users/${row.user_id}`}
                  className={rowClass}
                >
                  {inner}
                </Link>
              ) : (
                <div key={row.user_id ?? row.pseudo} className={rowClass}>
                  {inner}
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}