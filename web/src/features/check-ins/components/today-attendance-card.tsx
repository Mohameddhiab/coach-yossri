"use client";

import Link from "next/link";
import { ScanLine, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useTodayCheckIns } from "@/features/check-ins/hooks/useCheckIns";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
}

export function TodayAttendanceCard({
  activeCount,
}: {
  activeCount: number;
}) {
  const { data: checkins } = useTodayCheckIns(60000);
  const rows = [...(checkins ?? [])].sort((a, b) => b.checked_at.localeCompare(a.checked_at));

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="size-4 text-primary" />
            حضور اليوم
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {rows.length}/{activeCount}
            </span>
          </CardTitle>
          <CardDescription>المشتركون الذين سجّلوا حضورهم اليوم</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/pointage">
            <ScanLine className="size-4" />
            تسجيل الحضور
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <EmptyState
            title="لم يسجّل أحد حضوره اليوم بعد"
            description="يمكنك تسجيل الحضور من صفحة تسجيل الحضور بإدخال رقم المشترك."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((c) => {
              const [prenom, nom] = splitName(c.user_name);
              return (
                <Link
                  key={c.id}
                  href={`/users/${c.user_id}`}
                  className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <UserAvatar prenom={prenom} nom={nom} className="size-7 text-xs" />
                  <span className="text-sm font-medium">{c.user_name}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">
                    {timeOf(c.checked_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
