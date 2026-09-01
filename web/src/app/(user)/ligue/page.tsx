"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { MonthlyGoalCard } from "@/features/goals/components/monthly-goal-card";
import { ChallengeCard } from "@/features/goals/components/challenge-card";
import { FollowUpList } from "@/features/follow-ups/components/follow-up-list";
import { getMySubscription } from "@/features/subscriptions/api/subscriptions.api";
import { getActiveTier, tierAllows } from "@/shared/lib/domain";

export default function MyLiguePage() {
  const { data: me, isLoading: subLoading } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });

  if (subLoading) return <PageLoader rows={2} />;

  const tier = me ? getActiveTier(me.subscription) : null;
  const showFollowUp = tierAllows(tier, "follow-up");

  return (
    <div className="space-y-6">
      <PageHeader
        title="الدوري"
        description="تحدي الحضور — ترتيبك بين الأعضاء حسب عدد الحصص"
      />
      <MonthlyGoalCard userId="me" />
      <ChallengeCard />
      {showFollowUp ? <FollowUpList /> : null}
    </div>
  );
}