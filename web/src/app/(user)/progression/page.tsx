"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { ExpiredScreen } from "@/features/subscriptions/components/expired-screen";
import { WeightChart } from "@/features/progress/components/weight-chart";
import { WeightProjectionCard } from "@/features/progress/components/weight-projection-card";
import { WeightTargetCard } from "@/features/progress/components/weight-target-card";
import { AddWeightButton } from "@/features/progress/components/add-weight-button";
import { ShareCardButton } from "@/features/progress/components/share-card-button";
import { PhotoGallery } from "@/features/progress/components/photo-gallery";
import { listWeightLogs } from "@/features/progress/api/progress.api";
import { getPlan } from "@/features/meal-plans/api/mealPlans.api";
import { getMySubscription } from "@/features/subscriptions/api/subscriptions.api";
import { isSubscriptionExpiredError } from "@/shared/lib/api-client";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { currentStreak } from "@/features/goals/lib/streak";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import type { PlanObjective } from "@/shared/lib/domain";

function trendFor(diff: number | null, objectif: PlanObjective | null) {
  if (diff === null || diff === 0) return { good: true };
  const losing = diff < 0;
  if (objectif === "SECHE") return { good: losing };
  if (objectif === "PRISE_DE_MASSE") return { good: !losing };
  return { good: Math.abs(diff) <= 1 };
}

export default function MyProgressPage() {
  const { data: logs, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["me", "weight-logs"],
    queryFn: () => listWeightLogs("me"),
  });

  const { data: me } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });

  const { data: plan } = useQuery({
    queryKey: ["me", "plan"],
    queryFn: () => getPlan("me"),
    retry: false,
  });

  const { data: goal } = useGoal("me");

  if (isLoading) return <PageLoader rows={2} />;

  if (isSubscriptionExpiredError(error)) {
    return <ExpiredScreen coach={me?.coach ?? null} />;
  }

  if (error) return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;

  const sorted = logs ?? [];
  const first = sorted[sorted.length - 1];
  const last = sorted[0];
  const diff = first && last ? Math.round((last.poids_kg - first.poids_kg) * 10) / 10 : null;

  const objectif = plan?.objectif ?? null;
  const trend = trendFor(diff, objectif);
  const TrendIcon = diff === null || diff === 0 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  const trendClass = trend.good
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-destructive";

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقدّمي"
        description="كل أسبوع وزن جديد = خطوة نحو هدفك"
        actions={
          <>
            {diff !== null && (
              <ShareCardButton
                name={`${me?.user.prenom ?? ""} ${me?.user.nom ?? ""}`.trim()}
                deltaKg={diff}
                streak={currentStreak(goal?.checkins ?? [])}
                badgesCount={0}
                currentWeight={last?.poids_kg ?? null}
              />
            )}
            <AddWeightButton userId="me" />
          </>
        }
      />

      <WeightTargetCard userId="me" logs={sorted} canEdit />
      <WeightProjectionCard logs={sorted} />

      <Card className="border-primary/20 bg-gradient-to-l from-primary/10 to-transparent">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-2xl">🔥</span>
          <div>
            <div className="text-xs text-muted-foreground">أيام الالتزام المتتالية</div>
            <div className="text-2xl font-black text-primary">
              <AnimatedCounter value={currentStreak(goal?.checkins ?? [])} suffix=" يوم" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>منحنى الوزن</span>
            {diff !== null && (
              <span className={cn("flex items-center gap-1 text-sm font-bold", trendClass)}>
                <TrendIcon className="size-4" />
                {diff > 0 ? "+" : ""}
                {diff} كغ
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {sorted.length} قياس — {first ? `من ${first.poids_kg} كغ` : ""}
            {last && first && first.poids_kg !== last.poids_kg ? ` إلى ${last.poids_kg} كغ` : ""}
            {objectif === "SECHE"
              ? " — هدفك تنزيل الوزن، النزول بالأخضر"
              : objectif === "PRISE_DE_MASSE"
                ? " — هدفك زيادة الوزن، الزيادة بالأخضر"
                : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length > 0 ? (
            <WeightChart logs={sorted} height={280} />
          ) : (
            <EmptyState
              title="لا يوجد قياسات بعد"
              description="سجّل وزنك الأول وابدأ تتبع تقدمك"
              action={<AddWeightButton userId="me" />}
            />
          )}
        </CardContent>
      </Card>

      {sorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">آخر القياسات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
               {sorted.slice(0, 8).map((log, index) => (
                 <div
                   key={log.id}
                   className="animate-slide-up flex items-center justify-between py-2.5 text-sm"
                   style={{ animationDelay: `${index * 50}ms` }}
                 >
                  <div>
                    <div className="font-medium">{formatDate(log.date)}</div>
                    {log.note && (
                      <div className="text-xs text-muted-foreground">{log.note}</div>
                    )}
                  </div>
                  <div className="font-bold tabular-nums text-primary">{log.poids_kg} كغ</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <PhotoGallery userId="me" />
        </CardContent>
      </Card>
    </div>
  );
}