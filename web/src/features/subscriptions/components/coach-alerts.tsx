"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  ChevronLeft,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import type { UserWithSubscription } from "@/shared/lib/domain";
import { computeAlerts, type AlertKind } from "@/shared/lib/insights";

const KIND_STYLES: Record<AlertKind, { icon: React.ReactNode; iconClass: string }> = {
  expired: {
    icon: <UserX className="size-4" />,
    iconClass: "bg-destructive/12 text-destructive",
  },
  expiring: {
    icon: <AlertTriangle className="size-4" />,
    iconClass: "bg-amber-500/15 text-amber-500",
  },
  stale: {
    icon: <BellRing className="size-4" />,
    iconClass: "bg-muted text-muted-foreground",
  },
};

export function CoachAlerts({ users }: { users: UserWithSubscription[] }) {
  const alerts = computeAlerts(users);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="size-4 text-primary" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="لا يوجد تنبيهات"
            description="كل شيء على ما يرام — لا يوجد عضو يحتاج تدخلًا حاليًا"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4 text-primary" />
          يحتاج انتباهك
          <Badge variant="secondary" className="tabular-nums">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a) => (
          <Link
            key={a.key}
            href={`/users/${a.userId}`}
            className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${KIND_STYLES[a.kind].iconClass}`}
            >
              {KIND_STYLES[a.kind].icon}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{a.title}</div>
              <div className="truncate text-xs text-muted-foreground">{a.description}</div>
            </div>
            {a.badge && <Badge variant="outline">{a.badge}</Badge>}
            <ChevronLeft className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
