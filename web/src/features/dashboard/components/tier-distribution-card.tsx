"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/features/subscriptions/components/tier-badge";
import type { UserWithSubscription } from "@/shared/lib/domain";
import { tierDistribution } from "@/shared/lib/insights";

export function TierDistributionCard({ users }: { users: UserWithSubscription[] }) {
  const rows = tierDistribution(users);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">توزيع المشتركين حسب الباقة</CardTitle>
        <CardDescription>توزيع المشتركين النشطين على الباقات المتاحة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.tier} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <TierBadge tier={r.tier} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {r.count} مشترك · {r.revenue} د.ت
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${Math.round((r.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
