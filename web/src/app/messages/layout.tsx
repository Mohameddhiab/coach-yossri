"use client";

import { OfflineBanner } from "@/shared/components/offline-banner";
import { RenewalCountdownBanner } from "@/shared/components/renewal-countdown-banner";
import { ExpiredScreen } from "@/features/subscriptions/components/expired-screen";
import { CoachShell } from "@/shared/components/shells/coach-shell";
import { UserShell } from "@/shared/components/shells/user-shell";
import { useAuth } from "@/shared/lib/auth-context";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { getActiveTier, getSubscriptionStatus } from "@/shared/lib/domain";
import { navForTier } from "@/shared/lib/user-nav";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const isCoach = user?.role === "COACH";
  const needsSub = !authLoading && !isCoach;
  const { data: subData, isLoading: subLoading } = useMySubscription(needsSub);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (isCoach) return <CoachShell>{children}</CoachShell>;

  if (subLoading || (needsSub && subData === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (subData && getSubscriptionStatus(subData.subscription) === "EXPIRE") {
    return (
      <>
        <OfflineBanner />
        <ExpiredScreen coach={subData.coach ?? null} subscription={subData.subscription} />
      </>
    );
  }

  const tier = subData ? getActiveTier(subData.subscription) : null;

  return (
    <>
      <OfflineBanner />
      <RenewalCountdownBanner />
      <UserShell nav={navForTier(tier)}>{children}</UserShell>
    </>
  );
}
