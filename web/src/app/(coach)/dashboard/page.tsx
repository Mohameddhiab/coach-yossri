"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Coins,
  ScanLine,
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
import { useSummary, useGrowth } from "@/features/stats/hooks/useStats";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useAuth } from "@/shared/lib/auth-context";

function ClickableStat({
  href,
  ...props
}: React.ComponentProps<typeof StatCard> & { href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <StatCard {...props} />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useSummary();
  const { data: growth, isLoading: loadingGrowth } = useGrowth(12);
  const { data: users } = useUsers("", "TOUS");

  if (loadingSummary || loadingGrowth || !summary || !growth) return <PageLoader />;

  if (summary.total === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="لوحة التحكم"
          description="إحصائيات عامة على المنصة"
          actions={
            <Button asChild className="gap-2">
              <Link href="/users/new">
                <UserPlus className="size-4" />
                أضف أول عضو
              </Link>
            </Button>
          }
        />
        <EmptyState
          title="لا يوجد أعضاء حاليًا"
          description="أضف أول عضو لتبدأ بمتابعة الاشتراكات والبرامج والحضور."
          action={
            <Button asChild className="gap-2 font-bold">
              <Link href="/users/new">
                <UserPlus className="size-4" />
                أضف عضو الآن
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const actif = summary.actifs;
  const bientot = summary.expirant7j;
  const revenue = {
    total: summary.revenue_mensuel,
    payers: summary.membres_actifs,
  };

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير والنشاط" : hour < 18 ? "مساء الخير والقوة" : "مساء الهمّة";

  return (
    <div className="space-y-6">
      {/* Coach Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-10 -top-10 size-48 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-primary">
                {greeting}
              </span>
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              كابتن {user?.prenom ?? "يسري"} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              لديك <strong className="text-foreground">{actif} عضو نشط</strong> اليوم.
              {bientot > 0 && (
                <span className="ms-1 text-amber-600 dark:text-amber-400 font-semibold">
                  (هناك {bientot} اشتراك ينتهي هذا الأسبوع)
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-xl border-border/80 bg-background/60 shadow-sm backdrop-blur"
            >
              <Link href="/pointage">
                <ScanLine className="size-4 text-primary" />
                تسجيل الحضور
              </Link>
            </Button>
            <Button
              asChild
              className="gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700"
            >
              <Link href="/users/new">
                <UserPlus className="size-4" />
                أضف عضو جديد
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ClickableStat
          href="/users"
          label="إجمالي الأعضاء"
          value={summary.total}
          icon={<Users className="size-6" />}
          hint={
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-3 text-emerald-500" />
              <span>قاعدة المشتركين الكلية</span>
            </span>
          }
        />
        <ClickableStat
          href="/users"
          label="اشتراك نشط"
          value={actif}
          icon={<UserCheck className="size-6" />}
          hint="التزام ممتاز"
          className="border-emerald-500/30 dark:border-emerald-500/20"
        />
        <ClickableStat
          href="/notifications"
          label="ينتهي خلال 7 أيام"
          value={bientot}
          icon={<AlertTriangle className="size-6" />}
          hint={bientot > 0 ? "يحتاجون تذكير بالتجديد" : "لا يوجد انتهاء قريب"}
          className={
            bientot > 0
              ? "border-amber-500/50 bg-amber-500/[0.04] text-amber-700 dark:text-amber-300"
              : undefined
          }
        />
        <ClickableStat
          href="/users"
          label="الإيراد الشهري المقدر"
          value={`${revenue.total} د.ت`}
          icon={<Coins className="size-6" />}
          hint={`${revenue.payers} عضو يدفع حالياً`}
          className="border-primary/40 bg-primary/[0.03]"
        />
      </div>

      {/* Quick Attendance Widget */}
      <TodayAttendanceCard activeCount={summary.membres_actifs} />

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemberGrowthChart growth={growth} />
        </div>
        <SubscriptionStatusChart summary={summary} />
      </div>

      {/* Actionable Insights Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TierDistributionCard users={users ?? []} />
        <AlertsMiniList users={users ?? []} />
        <UnreadMessagesCard />
      </div>
    </div>
  );
}
