"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Coins,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { StatCard } from "@/shared/components/stat-card";
import { EmptyState } from "@/shared/components/empty-state";
import {
  MemberGrowthChart,
  SubscriptionStatusChart,
} from "@/features/dashboard/components/dashboard-charts";
import { AlertsMiniList } from "@/features/dashboard/components/alerts-mini-list";
import { TierDistributionCard } from "@/features/dashboard/components/tier-distribution-card";
import { UnreadMessagesCard } from "@/features/dashboard/components/unread-messages-card";
import { TodayAttendanceCard } from "@/features/check-ins/components/today-attendance-card";
import { useUsers } from "@/features/users/hooks/useUsers";
import { getSubscriptionStatus } from "@/shared/lib/domain";
import { payingRevenue } from "@/shared/lib/insights";

function ClickableStat({
  href,
  ...props
}: React.ComponentProps<typeof StatCard> & { href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl transition-shadow hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <StatCard {...props} />
    </Link>
  );
}

export default function DashboardPage() {
  const { data: users, isLoading } = useUsers("", "TOUS");

  if (isLoading) return <PageLoader />;

  if (!users?.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="لوحة التحكم"
          description="إحصائيات عامة على المنصة"
          actions={
            <Button asChild>
              <Link href="/users/new">
                <UserPlus />
                أضف عضو
              </Link>
            </Button>
          }
        />
        <EmptyState
          title="لا يوجد أعضاء حاليًا"
          description="أضف أول عضو لتبدأ بمتابعة النشاط من هنا."
          action={
            <Button asChild>
              <Link href="/users/new">
                <UserPlus />
                أضف عضو
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const trial = users.filter((u) => getSubscriptionStatus(u.subscription) === "ESSAI").length;
  const actif = users.filter((u) =>
    ["ACTIF", "ESSAI"].includes(getSubscriptionStatus(u.subscription)),
  ).length;
  const bientot = users.filter(
    (u) => getSubscriptionStatus(u.subscription) === "EXPIRE_BIENTOT",
  ).length;
  const revenue = payingRevenue(users);

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="حالة القاعة اليوم — حضور، اشتراكات و تنبيهات"
        actions={
          <Button asChild>
            <Link href="/users/new">
              <UserPlus />
              أضف عضو
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ClickableStat
          href="/users"
          label="إجمالي الأعضاء"
          value={users.length}
          icon={<Users />}
        />
        <ClickableStat
          href="/users"
          label="اشتراك نشط"
          value={actif}
          icon={<UserCheck />}
          hint={trial > 0 ? `منهم ${trial} فترة تجريبية` : undefined}
          className="border-emerald-500/30"
        />
        <ClickableStat
          href="/notifications"
          label="ينتهي خلال 7 أيام"
          value={bientot}
          icon={<AlertTriangle />}
          className="border-amber-500/40 bg-amber-500/[0.06]"
        />
        <ClickableStat
          href="/users"
          label="الإيراد الشهري"
          value={`${revenue.total} د.ت`}
          icon={<Coins />}
          hint={`${revenue.payers} مشترك حالي`}
          className="border-primary/30"
        />
      </div>

      <TodayAttendanceCard users={users} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemberGrowthChart users={users} />
        </div>
        <SubscriptionStatusChart users={users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TierDistributionCard users={users} />
        <AlertsMiniList users={users} />
        <UnreadMessagesCard />
      </div>
    </div>
  );
}
