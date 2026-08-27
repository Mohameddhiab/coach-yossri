"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MealPlanEditor } from "@/features/meal-plans/components/meal-plan-editor";
import {
  downloadPlanPdf,
  PlanPdfDocument,
} from "@/features/meal-plans/components/plan-pdf";
import {
  downloadWorkoutPdf,
  WorkoutPlanPdfDocument,
} from "@/features/workout-plans/components/workout-plan-pdf";
import { useWorkoutPlan } from "@/features/workout-plans/hooks/useWorkoutPlan";
import { getPlan } from "@/features/meal-plans/api/mealPlans.api";
import { useUser } from "@/features/users/hooks/useUsers";
import { PageLoader } from "@/shared/components/page-loader";
import { PageHeader } from "@/shared/components/page-header";
import { BackButton } from "@/shared/components/back-button";
import { ErrorState } from "@/shared/components/error-state";

export default function UserPlanPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data: user, isLoading, isError, refetch, isRefetching } = useUser(userId);

  const mealPdfRef = useRef<HTMLDivElement>(null);
  const workoutPdfRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState<"meal" | "workout" | null>(null);

  const { data: plan } = useQuery({
    queryKey: ["users", userId, "plan"],
    queryFn: () => getPlan(userId),
  });
  const workoutQuery = useWorkoutPlan(userId);
  const workout = workoutQuery.data;

  const handlePdf = async (kind: "meal" | "workout") => {
    const el =
      kind === "meal"
        ? (mealPdfRef.current?.firstElementChild as HTMLElement | null)
        : (workoutPdfRef.current?.firstElementChild as HTMLElement | null);
    if (!el) return;
    setPdfBusy(kind);
    try {
      if (kind === "meal" && plan) {
        await downloadPlanPdf(el, `plan-${plan.titre.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
      } else if (kind === "workout" && workout) {
        await downloadWorkoutPdf(el, `workout-${workout.titre.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
      }
    } catch {
      toast.error("تعذر توليد PDF");
    } finally {
      setPdfBusy(null);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <BackButton fallback="/users" />
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      </div>
    );
  }

  if (isLoading || !user) return <PageLoader rows={2} />;

  return (
    <div className="space-y-5">
      <PageHeader
        back={`/users/${userId}`}
        title="الخطة الغذائية"
        description={`برنامج التغذية الخاص بـ ${user.prenom} ${user.nom}`}
        actions={
          <>
            {workout ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePdf("workout")}
                disabled={pdfBusy === "workout"}
                aria-busy={pdfBusy === "workout"}
              >
                {pdfBusy === "workout" ? (
                  <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <FileDown />
                )}
                PDF التمارين
              </Button>
            ) : undefined}
            {plan ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePdf("meal")}
                disabled={pdfBusy === "meal"}
                aria-busy={pdfBusy === "meal"}
              >
                {pdfBusy === "meal" ? (
                  <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <FileDown />
                )}
                PDF الغذاء
              </Button>
            ) : undefined}
          </>
        }
      />
      <MealPlanEditor userId={userId} />

      {plan && (
        <div
          ref={mealPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 opacity-0 print:hidden"
        >
          <PlanPdfDocument plan={plan} logs={[]} target={null} goal={null} />
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
    </div>
  );
}
