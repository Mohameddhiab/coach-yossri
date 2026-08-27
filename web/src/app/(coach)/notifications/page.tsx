"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  ChevronLeft,
  UserX,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { ErrorState } from "@/shared/components/error-state";
import { EmptyState } from "@/shared/components/empty-state";
import { useUsers } from "@/features/users/hooks/useUsers";
import { computeAlerts, type AlertKind } from "@/shared/lib/insights";

const KIND_META: Record<
  AlertKind,
  { label: string; icon: React.ReactNode; iconClass: string }
> = {
  expired: {
    label: "اشتراكات منتهية",
    icon: <UserX className="size-4" />,
    iconClass: "bg-destructive/12 text-destructive",
  },
  expiring: {
    label: "أوشكوا على الانتهاء",
    icon: <AlertTriangle className="size-4" />,
    iconClass: "bg-amber-500/15 text-amber-500",
  },
  stale: {
    label: "متأخرون في تسجيل الوزن",
    icon: <BellRing className="size-4" />,
    iconClass: "bg-muted text-muted-foreground",
  },
};

const KIND_ORDER: AlertKind[] = ["expired", "expiring", "stale"];

export default function NotificationsPage() {
  const { data: users, isLoading, isError, refetch, isRefetching } = useUsers("", "TOUS");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const alerts = computeAlerts(users ?? []).filter((a) => !dismissed.has(a.key));
    return KIND_ORDER.map((kind) => ({
      kind,
      alerts: alerts.filter((a) => a.kind === kind),
    })).filter((g) => g.alerts.length > 0);
  }, [users, dismissed]);

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;

  const total = groups.reduce((sum, g) => sum + g.alerts.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description="كل ما يحتاج انتباهك من أعضائك"
        actions={
          total > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(new Set())}
              disabled={dismissed.size === 0}
            >
              استرجاع الكل
            </Button>
          ) : undefined
        }
      />

      {!total ? (
        <EmptyState
          title="لا يوجد تنبيهات"
          description="كل شيء على ما يرام — لا يوجد عضو يحتاج تدخلًا حاليًا"
        />
      ) : (
        <Accordion
          type="multiple"
          defaultValue={groups
            .filter((g) => g.kind === "expired" || g.kind === "expiring")
            .map((g) => g.kind)}
          className="rounded-xl border px-4"
        >
          {groups.map(({ kind, alerts }) => (
            <AccordionItem key={kind} value={kind}>
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex size-8 items-center justify-center rounded-full ${KIND_META[kind].iconClass}`}
                  >
                    {KIND_META[kind].icon}
                  </span>
                  <span className="font-semibold">{KIND_META[kind].label}</span>
                  <Badge variant="secondary" className="tabular-nums">
                    {alerts.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.key} className="flex items-center gap-1">
                    <Link
                      href={`/users/${a.userId}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-sm font-semibold">{a.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.description}
                        </div>
                      </div>
                      {a.badge && <Badge variant="outline">{a.badge}</Badge>}
                      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="إخفاء التنبيه"
                      title="إخفاء التنبيه هذه المرة"
                      onClick={() =>
                        setDismissed((prev) => new Set(prev).add(a.key))
                      }
                    >
                      <X className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
