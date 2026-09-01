"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Dumbbell, FileDown, UtensilsCrossed, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
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
  type WeekDay,
} from "@/shared/lib/domain";

export default function MyPlanPage() {
  const [day, setDay] = useState<string>(todayWeekDay());
  const [mobileTab, setMobileTab] = useState<"meals" | "workout">("workout");
  const [pdfBusy, setPdfBusy] = useState<"meal" | "workout" | null>(null);
  const mealPdfRef = useRef<HTMLDivElement>(null);
  const workoutPdfRef = useRef<HTMLDivElement>(null);

  const { data: me, isLoading: subLoading } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });

  const tier = me ? getActiveTier(me.subscription) : null;
  const plansAllowedMeal = tierAllows(tier, "meal-plan");
  const plansAllowedWorkout = tierAllows(tier, "workout-plan");

  const planQuery = useQuery({
    queryKey: ["me", "plan"],
    queryFn: () => getPlan("me"),
    enabled: plansAllowedMeal,
  });
  const workoutQuery = useWorkoutPlan("me", plansAllowedWorkout);

  const { data: logs } = useWeightLogs("me");
  const { data: target } = useWeightTarget("me");
  const { data: goal } = useGoal("me");

  const plan = planQuery.data;
  const workout = workoutQuery.data;

  const handlePdfDownload = async (kind: "meal" | "workout") => {
    const container =
      kind === "meal" ? mealPdfRef.current : workoutPdfRef.current;
    const el = container?.firstElementChild as HTMLElement | null;
    // Fallback to visible preview if hidden container not found (for direct preview)
    const fallbackEl =
      kind === "workout"
        ? document.querySelector<HTMLElement>("[data-pdf-preview='workout']")
        : document.querySelector<HTMLElement>("[data-pdf-preview='meal']");
    const target = el ?? fallbackEl;
    if (!target || (kind === "meal" ? !plan : !workout)) {
      toast.error("العنصر غير جاهز — حاول مرة أخرى");
      return;
    }
    setPdfBusy(kind);
    try {
      const fn = kind === "meal" ? downloadPlanPdf : (await import("@/features/workout-plans/components/workout-plan-pdf")).downloadWorkoutPdf;
      await fn(
        target,
        `${kind === "meal" ? "plan" : "workout"}-${
          kind === "meal"
            ? plan!.titre.replace(/\s+/g, "-")
            : workout!.titre.replace(/\s+/g, "-")
        }-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (e) {
      console.error("[pdf] failed", e);
      toast.error(e instanceof Error ? e.message : "تعذر تحويل ملف PDF — حاول مرة أخرى");
    } finally {
      setPdfBusy(null);
    }
  };

  if (subLoading) return <PageLoader rows={2} />;

  const planLoading = plansAllowedMeal && planQuery.isLoading;
  const workoutLoading = plansAllowedWorkout && workoutQuery.isLoading;
  if (planLoading || workoutLoading) return <PageLoader rows={2} />;

  const planError = plansAllowedMeal && planQuery.isError;
  const workoutError = plansAllowedWorkout && workoutQuery.isError;
  if (planError && workoutError) {
    return (
      <div className="space-y-6">
        <PageHeader title="خطتي" description="برنامجك — تغذية وتمارين 💪" />
        <ErrorState
          onRetry={() => {
            planQuery.refetch();
            workoutQuery.refetch();
          }}
          retrying={planQuery.isRefetching || workoutQuery.isRefetching}
        />
      </div>
    );
  }

  if (!plansAllowedMeal && !plansAllowedWorkout) {
    return (
      <div className="space-y-6">
        <PageHeader title="خطتي" description="برنامجك — تغذية وتمارين 💪" />
        <UpsellCard require="ONLINE" />
      </div>
    );
  }

  const today = todayWeekDay();
  const hasAnyPlan = !!plan || !!workout;

  return (
    <div className="space-y-6">
      <PageHeader
        title="خطتي"
        description="برنامجك الغذائي وتمارينك اليومية — التزم به وحقق أهدافك!"
        actions={
          (plan || workout) ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 p-1 backdrop-blur">
              {workout ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePdfDownload("workout")}
                  disabled={pdfBusy === "workout"}
                  aria-busy={pdfBusy === "workout"}
                  className="gap-1.5"
                >
                  {pdfBusy === "workout" ? (
                    <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileDown className="size-4" />
                  )}
                  <span className="text-xs">التمارين</span>
                </Button>
              ) : undefined}
              {plan ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePdfDownload("meal")}
                  disabled={pdfBusy === "meal"}
                  aria-busy={pdfBusy === "meal"}
                  className="gap-1.5"
                >
                  {pdfBusy === "meal" ? (
                    <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileDown className="size-4" />
                  )}
                  <span className="text-xs">الغذاء</span>
                </Button>
              ) : undefined}
            </div>
          ) : undefined
        }
      />

      {!hasAnyPlan ? (
        <EmptyState
          title="لا يوجد خطة بعد"
          description="لم يقم مدربك بإعداد خطتك بعد. ستصلك إشعار فور جاهزيتها."
          icon={<CalendarDays className="size-5 text-muted-foreground" />}
        />
      ) : (
        <>
          <MonthlyGoalCard userId="me" />

          {/* Plan summary — two distinct identities */}
          {(plan || workout) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {plan && (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-card to-card">
                  <div className="absolute -top-6 -end-6 size-24 rounded-full bg-emerald-500/10 blur-2xl" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15">
                        <UtensilsCrossed className="size-4" />
                      </span>
                      <span className="text-xs font-black tracking-[0.14em]">NUTRITION</span>
                      <span className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" /> {OBJECTIVE_LABELS[plan.objectif]}
                      </span>
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-lg font-black leading-tight">
                      {plan.titre}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        الإصدار {plan.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{plan.meals.length} وجبة</span>
                    </div>
                  </div>
                  <div className="border-t border-emerald-500/10 bg-card/60 px-5 py-4">
                    <MacrosCards
                      calories={plan.calories_cible}
                      proteines={plan.proteines_g}
                      glucides={plan.glucides_g}
                      lipides={plan.lipides_g}
                    />
                  </div>
                </div>
              )}

              {workout && (
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-card to-card">
                  <div className="absolute -top-6 -end-6 size-24 rounded-full bg-amber-500/10 blur-2xl" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15">
                        <Dumbbell className="size-4" />
                      </span>
                      <span className="text-xs font-black tracking-[0.14em]">TRAINING</span>
                      <span className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-amber-500" /> {OBJECTIVE_LABELS[workout.objectif]}
                      </span>
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-lg font-black leading-tight">
                      {workout.titre}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        الإصدار {workout.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{workout.exercises.length} تمرين</span>
                    </div>
                  </div>
                  <div className="border-t border-amber-500/10 bg-card/60 px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="size-3.5 text-amber-500" />
                    <span>برنامج مبني على جسمك — تابع الأوزان كل حصة</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Day rail — signature: huge ghost day + pill rail */}
          <div className="relative overflow-hidden rounded-2xl border bg-card">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="select-none text-[84px] font-black leading-none tracking-tighter text-foreground/[0.03] whitespace-nowrap">
                {WEEK_DAY_LABELS[day as keyof typeof WEEK_DAY_LABELS]}
              </span>
            </div>

            <div className="relative border-b bg-muted/20 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CalendarDays className="size-4" />
                </span>
                <span className="text-sm font-black">برنامج الأسبوع</span>
                <span className="text-xs text-muted-foreground">اختر يومك</span>
                <span className="ms-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Trophy className="size-3" /> اليوم {WEEK_DAY_LABELS[today as keyof typeof WEEK_DAY_LABELS]}
                </span>
              </div>

              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {WEEK_DAYS.map((d) => {
                  const isActive = d === day;
                  const isToday = d === today;
                  const mealCount = plan?.meals.filter((m) => m.jour_semaine === d || m.jour_semaine === "TOUS_LES_JOURS").length ?? 0;
                  const exCount = workout?.exercises.filter((e) => e.jour_semaine === d || e.jour_semaine === "TOUS_LES_JOURS").length ?? 0;
                  return (
                    <button
                      key={d}
                      onClick={() => setDay(d)}
                      className={`relative flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <span className="whitespace-nowrap">{WEEK_DAY_LABELS[d]}</span>
                      <span className={`flex items-center gap-1 text-[11px] ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {mealCount > 0 && <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-300" : "bg-emerald-500"}`} />}
                        {mealCount > 0 && `${mealCount} وجبات`}
                        {mealCount > 0 && exCount > 0 && " · "}
                        {exCount > 0 && <span className={`size-1.5 rounded-full ${isActive ? "bg-amber-300" : "bg-amber-500"}`} />}
                        {exCount > 0 && `${exCount} تمارين`}
                        {mealCount === 0 && exCount === 0 && "راحة"}
                      </span>
                      {isToday && !isActive && <span className="absolute -top-1 -end-1 size-2 rounded-full bg-primary animate-pulse" />}
                      {isToday && isActive && <span className="absolute -top-1 -end-1 size-2 rounded-full bg-white shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile segment */}
            <div className="flex gap-1 border-b bg-muted/20 p-1 lg:hidden">
              <button
                onClick={() => setMobileTab("workout")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${mobileTab === "workout" ? "bg-amber-500 text-white shadow" : "text-muted-foreground hover:bg-card"}`}
              >
                <Dumbbell className="size-4" /> التمارين {workout ? `(${workout.exercises.filter((e) => e.jour_semaine === day || e.jour_semaine === "TOUS_LES_JOURS").length})` : ""}
              </button>
              <button
                onClick={() => setMobileTab("meals")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${mobileTab === "meals" ? "bg-emerald-500 text-white shadow" : "text-muted-foreground hover:bg-card"}`}
              >
                <UtensilsCrossed className="size-4" /> الوجبات {plan ? `(${plan.meals.filter((m) => m.jour_semaine === day || m.jour_semaine === "TOUS_LES_JOURS").length})` : ""}
              </button>
            </div>

            {/* Desktop side-by-side, mobile segmented */}
            <div className="p-4">
              {/* Mobile segmented view */}
              <div className="lg:hidden">
                {mobileTab === "meals" ? (
                  planError ? (
                    <div className="rounded-xl border border-destructive/30 bg-card p-4">
                      <ErrorState onRetry={() => planQuery.refetch()} retrying={planQuery.isRefetching} />
                    </div>
                  ) : plan ? (
                    <MealPlanDayView plan={plan} day={day as WeekDay} highlightToday={day === today} accent />
                  ) : (
                    <EmptyState title="لا وجبات" description="لم يحدد المدرب وجبات لهذا اليوم" icon={<UtensilsCrossed className="size-5" />} />
                  )
                ) : workoutError ? (
                  <div className="rounded-xl border border-destructive/30 bg-card p-4">
                    <ErrorState onRetry={() => workoutQuery.refetch()} retrying={workoutQuery.isRefetching} />
                  </div>
                ) : workout ? (
                  <WorkoutPlanDayView day={day as WeekDay} exercises={workout.exercises} />
                ) : (
                  <EmptyState title="لا تمارين" description="يوم راحة — استشفِ جيداً" icon={<Dumbbell className="size-5" />} />
                )}
              </div>

              {/* Desktop side-by-side */}
              <div className="hidden lg:grid gap-5 lg:grid-cols-2 lg:items-start">
                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                      <Dumbbell className="size-4" />
                    </span>
                    <span className="text-sm font-black">التمارين</span>
                    <span className="ms-auto text-xs text-muted-foreground">
                      {workout ? `${workout.exercises.filter((e) => e.jour_semaine === day || e.jour_semaine === "TOUS_LES_JOURS").length} تمارين` : "—"}
                    </span>
                  </div>
                  {workoutError ? (
                    <div className="rounded-xl border border-destructive/30 bg-card p-4">
                      <ErrorState onRetry={() => workoutQuery.refetch()} retrying={workoutQuery.isRefetching} />
                    </div>
                  ) : workout ? (
                    <WorkoutPlanDayView day={day as WeekDay} exercises={workout.exercises} />
                  ) : (
                    <div className="rounded-xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">لا تمارين مبرمجة</div>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                      <UtensilsCrossed className="size-4" />
                    </span>
                    <span className="text-sm font-black">الوجبات</span>
                    <span className="ms-auto text-xs text-muted-foreground">
                      {plan ? `${plan.meals.filter((m) => m.jour_semaine === day || m.jour_semaine === "TOUS_LES_JOURS").length} وجبات` : "—"}
                    </span>
                  </div>
                  {planError ? (
                    <div className="rounded-xl border border-destructive/30 bg-card p-4">
                      <ErrorState onRetry={() => planQuery.refetch()} retrying={planQuery.isRefetching} />
                    </div>
                  ) : plan ? (
                    <MealPlanDayView plan={plan} day={day as WeekDay} highlightToday={day === today} accent />
                  ) : (
                    <div className="rounded-xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">لا وجبات مبرمجة</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tierAllows(tier, "follow-up") && <FollowUpList />}

      {(plan || workout) && (
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-black">معاينة PDF</h3>
          <div className="flex flex-wrap gap-2">
            {plan && (
              <Button size="sm" variant="outline" onClick={() => handlePdfDownload("meal")} disabled={pdfBusy === "meal"}>
                <FileDown className="size-4" /> تحميل PDF الغذاء
              </Button>
            )}
            {workout && (
              <Button size="sm" variant="outline" onClick={() => handlePdfDownload("workout")} disabled={pdfBusy === "workout"}>
                <FileDown className="size-4" /> تحميل PDF التمارين
              </Button>
            )}
          </div>
          <div className="mt-4 overflow-auto rounded-xl border bg-white">
            {workout && (
              <div data-pdf-preview="workout">
                <WorkoutPlanPdfDocument plan={workout} />
              </div>
            )}
            {plan && !workout && (
              <div data-pdf-preview="meal">
                <PlanPdfDocument plan={plan} logs={logs ?? []} target={target ?? null} goal={goal ?? null} />
              </div>
            )}
          </div>
        </div>
      )}

      {plan && (
        <div
          ref={mealPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed -left-[10000px] top-0 opacity-100 print:hidden"
          style={{ width: "794px" }}
        >
          <PlanPdfDocument plan={plan} logs={logs ?? []} target={target ?? null} goal={goal ?? null} />
        </div>
      )}

      {workout && (
        <div
          ref={workoutPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed -left-[10000px] top-0 opacity-100 print:hidden"
          style={{ width: "794px" }}
        >
          <WorkoutPlanPdfDocument plan={workout} />
        </div>
      )}

      <ChallengeCard />
    </div>
  );
}
