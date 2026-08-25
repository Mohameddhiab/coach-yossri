"use client";

import { useParams } from "next/navigation";
import { MealPlanEditor } from "@/features/meal-plans/components/meal-plan-editor";
import { useUser } from "@/features/users/hooks/useUsers";
import { PageLoader } from "@/shared/components/page-loader";
import { PageHeader } from "@/shared/components/page-header";
import { BackButton } from "@/shared/components/back-button";
import { ErrorState } from "@/shared/components/error-state";

export default function UserPlanPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data: user, isLoading, isError, refetch, isRefetching } = useUser(userId);

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
      />
      <MealPlanEditor userId={userId} />
    </div>
  );
}
