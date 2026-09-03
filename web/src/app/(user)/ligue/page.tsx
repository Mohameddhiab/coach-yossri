"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { MonthlyGoalCard } from "@/features/goals/components/monthly-goal-card";
import { ChallengeCard } from "@/features/goals/components/challenge-card";
import { LeagueStatsCards } from "@/features/goals/components/league-stats-cards";
import { LeaguePodium } from "@/features/goals/components/league-podium";
import { ActivityHeatmap } from "@/features/goals/components/activity-heatmap";
import { BadgeShowcase } from "@/features/goals/components/badge-showcase";
import { ShareRankingButton } from "@/features/goals/components/share-ranking-button";
import { FollowUpList } from "@/features/follow-ups/components/follow-up-list";
import { useChallengeLeaderboard } from "@/features/goals/hooks/useChallenge";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { getMySubscription } from "@/features/subscriptions/api/subscriptions.api";
import { getActiveTier, tierAllows } from "@/shared/lib/domain";

export default function MyLiguePage() {
  const { data: me, isLoading: subLoading } = useQuery({
    queryKey: ["me", "subscription"],
    queryFn: getMySubscription,
  });

  const { data: leaderboard } = useChallengeLeaderboard("30");
  const { data: goal } = useGoal("me");

  if (subLoading) return <PageLoader rows={2} />;

  const tier = me ? getActiveTier(me.subscription) : null;
  const showFollowUp = tierAllows(tier, "follow-up");
  const goalDone = goal?.checkins.length ?? 0;
  const goalCible = goal?.cible ?? 0;
  const checkins = goal?.checkins ?? [];
  const top = leaderboard?.top ?? [];
  const myRank = leaderboard?.my_rank;
  const myCheckinDates =
    top.find((r) => r.pseudo === "أنت")?.checkin_dates ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الدوري"
        description="تحدي الحضور — ترتيبك بين الأعضاء حسب عدد الحصص"
        actions={
          myRank ? (
            <ShareRankingButton
              rank={myRank.rank}
              count={myRank.count}
              streak={myRank.streak}
            />
          ) : undefined
        }
      />
      <LeagueStatsCards
        goalDone={goalDone}
        goalCible={goalCible}
        checkins={checkins}
        leaderboard={leaderboard}
      />
      <MonthlyGoalCard userId="me" />
      <LeaguePodium rows={top} />
      <ChallengeCard />
      <ActivityHeatmap dates={myCheckinDates} />
      <BadgeShowcase />
      {showFollowUp ? <FollowUpList /> : null}
    </div>
  );
}
