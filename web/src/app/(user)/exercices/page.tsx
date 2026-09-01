"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Dumbbell, FileDown, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { UpsellCard } from "@/features/subscriptions/components/tier-gate";
import { WorkoutPlanDayView } from "@/features/workout-plans/components/workout-plan-day-view";
import { WorkoutPlanPdfDocument } from "@/features/workout-plans/components/workout-plan-pdf";
import { useWorkoutPlan } from "@/features/workout-plans/hooks/useWorkoutPlan";
import { getMySubscription } from "@/features/subscriptions/api/subscriptions.api";
import {
  OBJECTIVE_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  todayWeekDay,
  type WeekDay,
} from "@/shared/lib/domain";
import { cn } from "@/lib/utils";

export default function MyExercicesPage() {
  const [day, setDay] = useState<string>(todayWeekDay());
  const [pdfBusy, setPdfBusy] = useState(false);
  const workoutPdfRef = useRef<HTMLDivElement>(null);

  const { data: me, isLoading: subLoading } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });

  const workoutQuery = useWorkoutPlan("me");
  const workout = workoutQuery.data;

  const handlePdfDownload = async () => {
    const el = workoutPdfRef.current?.firstElementChild as HTMLElement | null;
    const fallbackEl = document.querySelector<HTMLElement>("[data-pdf-preview='workout']");
    const target = el ?? fallbackEl;
    if (!target || !workout) {
      toast.error("العنصر غير جاهز — حاول مرة أخرى");
      return;
    }
    setPdfBusy(true);
    try {
      const { downloadWorkoutPdf } = await import("@/features/workout-plans/components/workout-plan-pdf");
      await downloadWorkoutPdf(
        target,
        `workout-${workout.titre.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (e) {
      console.error("[pdf] failed", e);
      toast.error(e instanceof Error ? e.message : "تعذر تحويل ملف PDF — حاول مرة أخرى");
    } finally {
      setPdfBusy(false);
    }
  };

  if (subLoading) return <PageLoader rows={2} />;

  if (workoutQuery.isLoading) return <PageLoader rows={2} />;

  const today = todayWeekDay();

  return (
    <div className="space-y-6">
      <PageHeader
        title="التمارين"
        description="برنامجك التدريبي اليومي — التزم به وتابع أوزانك كل حصة!"
        actions={
          workout ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePdfDownload}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
              className="gap-1.5"
            >
              {pdfBusy ? (
                <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <FileDown className="size-4" />
              )}
              <span className="text-xs">تحميل PDF</span>
            </Button>
          ) : undefined
        }
      />

      {workoutQuery.isError ? (
        <ErrorState onRetry={() => workoutQuery.refetch()} retrying={workoutQuery.isRefetching} />
      ) : !workout ? (
        <EmptyState
          title="لا يوجد خطة تمارين بعد"
          description="لم يقم مدربك بإعداد خطتك التدريبية بعد. ستصلك إشعار فور جاهزيتها."
          icon={<Dumbbell className="size-5 text-muted-foreground" />}
        />
      ) : (
        <>
          {/* Plan summary */}
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

          {/* Day rail */}
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
                  const exCount = workout.exercises.filter((e) => e.jour_semaine === d || e.jour_semaine === "TOUS_LES_JOURS").length;
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
                        {exCount > 0 && <span className={cn("size-1.5 rounded-full", isActive ? "bg-amber-300" : "bg-amber-500")} />}
                        {exCount > 0 ? `${exCount} تمارين` : "راحة"}
                      </span>
                      {isToday && !isActive && <span className="absolute -top-1 -end-1 size-2 rounded-full bg-primary animate-pulse" />}
                      {isToday && isActive && <span className="absolute -top-1 -end-1 size-2 rounded-full bg-white shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4">
              <WorkoutPlanDayView day={day as WeekDay} exercises={workout.exercises} />
            </div>
          </div>
        </>
      )}

      {workout && (
        <>
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-black">معاينة PDF</h3>
            <Button size="sm" variant="outline" onClick={handlePdfDownload} disabled={pdfBusy}>
              <FileDown className="size-4" /> تحميل PDF التمارين
            </Button>
            <div className="mt-4 overflow-auto rounded-xl border bg-white">
              <div data-pdf-preview="workout">
                <WorkoutPlanPdfDocument plan={workout} />
              </div>
            </div>
          </div>

          <div
            ref={workoutPdfRef}
            aria-hidden="true"
            className="pointer-events-none fixed -left-[10000px] top-0 opacity-100 print:hidden"
            style={{ width: "794px" }}
          >
            <WorkoutPlanPdfDocument plan={workout} />
          </div>
        </>
      )}
    </div>
  );
}