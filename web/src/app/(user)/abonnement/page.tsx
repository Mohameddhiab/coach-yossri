"use client";

import { CalendarDays, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { ErrorState } from "@/shared/components/error-state";
import { CoachContactButtons } from "@/shared/components/coach-contact-buttons";
import { FidelityCard } from "@/features/subscriptions/components/fidelity-card";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import {
  getActiveTier,
  getSubscriptionStatus,
  daysLeft,
  OFFRES,
} from "@/shared/lib/domain";
import { formatDate } from "@/lib/utils";

export default function MySubscriptionPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useMySubscription();

  if (isLoading) return <PageLoader rows={2} />;
  if (!data || isError) return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;

  const { subscription, history, coach } = data;
  const status = getSubscriptionStatus(subscription);
  const remaining = daysLeft(subscription);
  const tier = getActiveTier(subscription);
  const tierNom = OFFRES.find((o) => o.tier === tier)?.nom ?? null;

  const total =
    subscription
      ? Math.max(
          1,
          Math.round(
            (new Date(subscription.date_fin).getTime() -
              new Date(subscription.date_debut).getTime()) /
              86400000,
          ),
        )
      : 1;
  const elapsedPct = subscription
    ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="اشتراكي" description="حالة اشتراكك الحالية" />

      <Card className="overflow-hidden">
        <div
          className={
            status === "EXPIRE_BIENTOT"
              ? "h-1.5 bg-gradient-to-l from-amber-400 via-amber-500 to-amber-600"
              : "h-1.5 bg-gradient-to-l from-emerald-400 via-emerald-500 to-emerald-600"
          }
        />
        <CardContent className="space-y-5 p-6 text-center">
          <div className="flex justify-center gap-2">
            <Badge
              variant="outline"
              className={
                status === "EXPIRE_BIENTOT"
                  ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : undefined
              }
            >
              اشتراكك نشط
            </Badge>
            {tierNom && <Badge variant="secondary">{tierNom}</Badge>}
          </div>

          <div>
            <div className="text-5xl font-black tabular-nums text-primary">{remaining}</div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">يوم باقي</div>
          </div>

          <div className="space-y-1.5">
            <Progress value={elapsedPct} />
            <p className="text-xs text-muted-foreground tabular-nums">
              {Math.round(elapsedPct)}% من الفترة انقضى
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" />
            الدفع نقدًا مع مدربك — {subscription?.montant} د.ت / فترة
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">تاريخ البداية</div>
              <div className="mt-0.5 font-semibold">
                {subscription ? formatDate(subscription.date_debut) : "—"}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">تاريخ النهاية</div>
              <div className="mt-0.5 font-semibold">
                {subscription ? formatDate(subscription.date_fin) : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {coach && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مدربك</CardTitle>
            <CardDescription>تواصل معه للتجديد أو لأي استفسار</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="font-bold">
              {coach.prenom} {coach.nom}
            </div>
            <CoachContactButtons telephone={coach.telephone} />
          </CardContent>
        </Card>
      )}

      {history && history.length > 0 && (
        <>
          <FidelityCard history={history} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-primary" />
                سجل الاشتراكات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {history.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="text-muted-foreground">
                      {formatDate(s.date_debut)} → {formatDate(s.date_fin)}
                    </div>
                    <div className="font-semibold tabular-nums">{s.montant} د.ت</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
