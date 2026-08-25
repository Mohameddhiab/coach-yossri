"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Dumbbell, FileDown, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { UpsellCard } from "@/features/subscriptions/components/tier-gate";
import { MacrosCards } from "@/features/meal-plans/components/macros-cards";
import { MealPlanDayView } from "@/features/meal-plans/components/meal-plan-day-view";
import {
  PlanPdfDocument,
  downloadPlanPdf,
} from "@/features/meal-plans/components/plan-pdf";
import { getPlan } from "@/features/meal-plans/api/mealPlans.api";
import {
  WorkoutPlanDayView,
} from "@/features/workout-plans/components/workout-plan-day-view";
import { WorkoutPlanPdfDocument } from "@/features/workout-plans/components/workout-plan-pdf";
import { useWorkoutPlan } from "@/features/workout-plans/hooks/useWorkoutPlan";
import { FollowUpList } from "@/features/follow-ups/components/follow-up-list";
import { MonthlyGoalCard } from "@/features/goals/components/monthly-goal-card";
import { ChallengeCard } from "@/features/goals/components/challenge-card";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { useWeightLogs } from "@/features/progress/hooks/useProgress";
import { useWeightTarget } from "@/features/progress/hooks/useWeightTarget";
import { getMySubscription } from "@/features/subscriptions/api/subscriptions.api";
import {
  OBJECTIVE_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  getActiveTier,
  tierAllows,
  todayWeekDay,
} from "@/shared/lib/domain";

export default function MyPlanPage() {
  const [day, setDay] = useState<string>(todayWeekDay());
  const [pdfBusy, setPdfBusy] = useState<"meal" | "workout" | null>(null);
  const mealPdfRef = useRef<HTMLDivElement>(null);
  const workoutPdfRef = useRef<HTMLDivElement>(null);

  const { data: me, isLoading: subLoading } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });

  const tier = me ? getActiveTier(me.subscription) : null;
  const plansAllowed = tierAllows(tier, "meal-plan");

  const planQuery = useQuery({
    queryKey: ["me", "plan"],
    queryFn: () => getPlan("me"),
    enabled: plansAllowed,
  });
  const workoutQuery = useWorkoutPlan("me", plansAllowed);

  const { data: logs } = useWeightLogs("me");
  const { data: target } = useWeightTarget("me");
  const { data: goal } = useGoal("me");

  const plan = planQuery.data;
  const workout = workoutQuery.data;

  const handlePdfDownload = async (kind: "meal" | "workout") => {
    const el =
      kind === "meal"
        ? (mealPdfRef.current?.firstElementChild as HTMLElement | null)
        : (workoutPdfRef.current?.firstElementChild as HTMLElement | null);
    if (!el || (kind === "meal" ? !plan : !workout)) return;
    setPdfBusy(kind);
    try {
      await downloadPlanPdf(
        el,
        `${kind === "meal" ? "plan" : "workout"}-${
          kind === "meal"
            ? plan!.titre.replace(/\s+/g, "-")
            : workout!.titre.replace(/\s+/g, "-")
        }-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch {
      toast.error("تعذر تحويل ملف PDF — حاول مرة أخرى");
    } finally {
      setPdfBusy(null);
    }
  };

  if (subLoading || (plansAllowed && planQuery.isLoading)) return <PageLoader rows={2} />;

  if (!plansAllowed) {
    return (
      <div className="space-y-6">
        <PageHeader title="خطتي" description="برنامجك — تغذية وتمارين 💪" />
        <UpsellCard require="PREMIUM" />
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <ErrorState onRetry={() => planQuery.refetch()} retrying={planQuery.isRefetching} />
    );
  }

  const today = todayWeekDay();
  const hasAnyPlan = !!plan || !!workout;

  return (
    <div className="space-y-6">
      <PageHeader
        title="خطتي"
        description="برنامجك الغذائي وتمارينك اليومية — التزم به وحقق أهدافك! 💪"
        actions={
          <>
            {workout ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePdfDownload("workout")}
                disabled={pdfBusy !== null}
              >
                <FileDown />
                {pdfBusy === "workout" ? "جاري التحميل..." : "PDF التمارين"}
              </Button>
            ) : undefined}
            {plan ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePdfDownload("meal")}
                disabled={pdfBusy !== null}
              >
                <FileDown />
                {pdfBusy === "meal" ? "جاري التحميل..." : "PDF الغذاء"}
              </Button>
            ) : undefined}
          </>
        }
      />

      {!hasAnyPlan ? (
        <EmptyState
          title="لا يوجد خطة بعد"
          description="لم يقم مدربك بإعداد خطتك بعد. ستصلك إشعار فور جاهزيتها."
          action={<CalendarDays className="size-5 text-muted-foreground" />}
        />
      ) : (
        <>
          <MonthlyGoalCard userId="me" />

          {plan ? (
            <Card className="border-primary/25 bg-gradient-to-l from-primary/10 to-transparent">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {OBJECTIVE_LABELS[plan.objectif]}
                  </Badge>
                  <Badge variant="outline">الإصدار {plan.version}</Badge>
                </div>
                <h2 className="text-lg font-extrabold">{plan.titre}</h2>
                <MacrosCards
                  calories={plan.calories_cible}
                  proteines={plan.proteines_g}
                  glucides={plan.glucides_g}
                  lipides={plan.lipides_g}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {workout ? <Dumbbell className="size-4 text-primary" /> : <UtensilsCrossed className="size-4 text-primary" />}
                برنامج الأسبوع
              </CardTitle>
              <CardDescription>اليوم معلّم باللون — {WEEK_DAY_LABELS[today]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={day} onValueChange={setDay}>
                <TabsList
                  variant="line"
                  className="w-full justify-start gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-none border-b bg-transparent p-0 h-auto"
                >
                  {WEEK_DAYS.map((d) => {
                    const isActive = d === day;
                    const isToday = d === today;
                    return (
                      <TabsTrigger
                        key={d}
                        value={d}
                        className="shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <span className="flex items-center gap-1.5">
                          {isToday ? (
                            <span className={`size-1.5 shrink-0 rounded-full ${isActive ? "bg-primary" : "bg-primary/60"}`} />
                          ) : null}
                          {isToday ? "اليوم" : WEEK_DAY_LABELS[d]}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {WEEK_DAYS.map((d) => (
                  <TabsContent key={d} value={d} className="space-y-4 pt-4">
                    {plan ? (
                      <>
                        <h3 className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                          <UtensilsCrossed className="size-3.5" /> الوجبات
                        </h3>
                        <MealPlanDayView plan={plan} day={d} highlightToday={d === today} accent />
                      </>
                    ) : null}
                    {workout ? (
                      <>
                        <h3 className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                          <Dumbbell className="size-3.5" /> التمارين
                        </h3>
                        <WorkoutPlanDayView day={d} exercises={workout.exercises} />
                      </>
                    ) : null}
                    {!plan && !workout ? null : null}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {tierAllows(tier, "follow-up") && <FollowUpList />}

      {plan && (
        <div
          ref={mealPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 opacity-0 print:hidden"
        >
          <PlanPdfDocument plan={plan} logs={logs ?? []} target={target ?? null} goal={goal ?? null} />
        </div>
      )}

      {workout && (
        <div
          ref={workoutPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 opacity-0 print:hidden"
        >
          <WorkoutPlanPdfDocument plan={workout} />
        </div>
      )}

      <ChallengeCard />
    </div>
  );
}
