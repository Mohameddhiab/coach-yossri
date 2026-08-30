"use client";

import { OfflineBanner } from "@/shared/components/offline-banner";
import { MorningGreeting } from "@/shared/components/morning-greeting";
import { RenewalCountdownBanner } from "@/shared/components/renewal-countdown-banner";
import { EmailVerificationGate } from "@/shared/components/email-verification-gate";
import { ExpiredScreen } from "@/features/subscriptions/components/expired-screen";
import { UserShell } from "@/shared/components/shells/user-shell";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { getActiveTier, getSubscriptionStatus } from "@/shared/lib/domain";
import { navForTier } from "@/shared/lib/user-nav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: subData, isLoading: subLoading } = useMySubscription();

  if (subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (subData && !subData.user.email_verified) {
    return <EmailVerificationGate />;
  }

  if (subData && getSubscriptionStatus(subData.subscription) === "EXPIRE") {
    return <ExpiredScreen coach={subData.coach ?? null} subscription={subData.subscription} />;
  }

  const tier = subData ? getActiveTier(subData.subscription) : null;

  return (
    <>
      <MorningGreeting />
      <OfflineBanner />
      <RenewalCountdownBanner />
      <UserShell nav={navForTier(tier)}>{children}</UserShell>
    </>
  );
}
