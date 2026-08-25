"use client";

import { useParams } from "next/navigation";
import { BackButton } from "@/shared/components/back-button";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { ErrorState } from "@/shared/components/error-state";
import { useUser } from "@/features/users/hooks/useUsers";
import { WorkoutPlanEditor } from "@/features/workout-plans/components/workout-plan-editor";

export default function UserWorkoutPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data: user, isLoading, isError, refetch, isRefetching } = useUser(userId);

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
      />
      <WorkoutPlanEditor userId={userId} />
    </div>
  );
}
