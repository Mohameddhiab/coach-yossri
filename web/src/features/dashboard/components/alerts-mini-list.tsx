"use client";

import Link from "next/link";
import { AlertTriangle, BellRing, ChevronLeft, Flame, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserWithSubscription } from "@/shared/lib/domain";
import { computeAlerts, type AlertKind } from "@/shared/lib/insights";

const KIND_ICONS: Record<AlertKind, React.ReactNode> = {
  expired: <UserX className="size-3.5" />,
  expiring: <AlertTriangle className="size-3.5" />,
  trial: <Flame className="size-3.5" />,
  stale: <BellRing className="size-3.5" />,
};

const KIND_CLASSES: Record<AlertKind, string> = {
  expired: "bg-destructive/12 text-destructive",
  expiring: "bg-amber-500/15 text-amber-500",
  trial: "bg-primary/12 text-primary",
  stale: "bg-muted text-muted-foreground",
};

export function AlertsMiniList({ users }: { users: UserWithSubscription[] }) {
  const alerts = computeAlerts(users).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4 text-primary" />
          يحتاج متابعة
          {alerts.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 tabular-nums dark:text-amber-400">
              {computeAlerts(users).length}
            </span>
          )}
        </CardTitle>
        <Link
          href="/notifications"
          className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          الكل
          <ChevronLeft className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {!alerts.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            كل شيء على ما يرام 👌
          </p>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((a) => (
              <Link
                key={a.key}
                href={`/users/${a.userId}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${KIND_CLASSES[a.kind]}`}
                >
                  {KIND_ICONS[a.kind]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                <ChevronLeft className="size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
