"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/shared/components/back-button";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { ErrorState } from "@/shared/components/error-state";
import { useUser } from "@/features/users/hooks/useUsers";
import { WorkoutPlanEditor } from "@/features/workout-plans/components/workout-plan-editor";
import {
  downloadWorkoutPdf,
  WorkoutPlanPdfDocument,
} from "@/features/workout-plans/components/workout-plan-pdf";
import { useWorkoutPlan } from "@/features/workout-plans/hooks/useWorkoutPlan";

export default function UserWorkoutPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data: user, isLoading, isError, refetch, isRefetching } = useUser(userId);
  const workoutQuery = useWorkoutPlan(userId);
  const workout = workoutQuery.data;

  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handlePdf = async () => {
    const el = pdfRef.current?.firstElementChild as HTMLElement | null;
    if (!el || !workout) return;
    setPdfBusy(true);
    try {
      await downloadWorkoutPdf(el, `workout-${workout.titre.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    } catch {
      toast.error("تعذر توليد PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  if (isError) {
    return (
      <div className="space-y-4">
        <BackButton fallback="/users" />
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      </div>
    );
  }

  if (isLoading || !user) return <PageLoader rows={2} />;

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <BackButton fallback={`/users/${userId}`} />
      </div>
      <PageHeader
        title="خطة التمارين"
        description={`برنامج التمارين الخاص بـ ${user.prenom} ${user.nom}`}
        actions={
          workout ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePdf}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
            >
              {pdfBusy ? (
                <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <FileDown />
              )}
              PDF التمارين
            </Button>
          ) : undefined
        }
      />
      <WorkoutPlanEditor userId={userId} />

      {workout && (
        <div
          ref={pdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 opacity-0 print:hidden"
        >
          <WorkoutPlanPdfDocument plan={workout} />
        </div>
      )}
    </div>
  );
}
