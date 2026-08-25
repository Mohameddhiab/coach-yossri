"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Keyboard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/shared/components/page-header";
import { TierBadge } from "@/features/subscriptions/components/tier-badge";
import {
  useCreateCheckIn,
  useResolveMember,
  useTodayCheckIns,
} from "@/features/check-ins/hooks/useCheckIns";
import { SUBSCRIPTION_STATUS_LABELS } from "@/shared/lib/domain";
import { formatTime } from "@/lib/utils";

export default function PointagePage() {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const createCheckIn = useCreateCheckIn();
  const { data: member, isLoading: memberLoading, error } = useResolveMember(scannedId);
  const { data: today } = useTodayCheckIns(30000);

  useEffect(() => {
    if (scannedId) {
      confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scannedId]);

  const reset = () => {
    setScannedId(null);
  };

  const submitManual = () => {
    const id = manualId.trim();
    if (!id) return;
    setScannedId(id);
    setManualId("");
  };

  const confirm = async () => {
    if (!scannedId) return;
    try {
      await createCheckIn.mutateAsync(scannedId);
      toast.success("تم تسجيل الحضور ✓");
      reset();
    } catch {
      toast.error("تعذر تسجيل الحضور");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تسجيل الحضور"
        description="سجّل حضور الأعضاء في القاعة بإدخال معرّفهم"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="size-5 text-primary" />
            إدخال معرف العضو
          </CardTitle>
          <CardDescription>أدخل معرّف العضو ثم اضغط تحقّق لتأكيد الحضور</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="mx-auto flex w-full max-w-sm items-center gap-2">
            <Input
              dir="ltr"
              placeholder="معرّف العضو…"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              aria-label="معرّف العضو"
            />
            <Button variant="outline" size="sm" onClick={submitManual} disabled={!manualId.trim()}>
              تحقّق
            </Button>
          </div>
        </CardContent>
      </Card>

      {scannedId ? (
        <Card>
          <div ref={confirmRef}>
            <CardHeader>
              <CardTitle>تأكيد الحضور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {memberLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : error || !member ? (
                <div className="flex flex-wrap items-center gap-2 text-destructive">
                  <XCircle className="size-5" />
                  عضو غير موجود — تحقق من المعرّف
                  <Button variant="outline" size="sm" onClick={reset}>
                    رجوع
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                    <div>
                      <div className="font-bold">
                        {member.prenom} {member.nom}
                      </div>
                      <TierBadge tier={member.tier} className="mt-1" />
                    </div>
                    <div
                      className={
                        member.statut === "EXPIRE"
                          ? "flex items-center gap-1.5 text-destructive"
                          : "flex items-center gap-1.5 text-emerald-600"
                      }
                    >
                      {member.statut === "EXPIRE" ? (
                        <XCircle className="size-5" />
                      ) : (
                        <CheckCircle2 className="size-5" />
                      )}
                      <span className="text-sm font-semibold">
                        {SUBSCRIPTION_STATUS_LABELS[member.statut] ?? member.statut}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={confirm}
                      disabled={member.statut === "EXPIRE" || createCheckIn.isPending}
                    >
                      تسجيل الحضور
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      إلغاء
                    </Button>
                    {member.statut === "EXPIRE" && (
                      <Button asChild variant="outline">
                        <Link href={`/users/${member.id}`}>افتح ملف العضو</Link>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>حضور اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          {!today?.length ? (
            <p className="py-4 text-center text-sm text-muted-foreground">لم يحضر أحد اليوم</p>
          ) : (
            <ul className="divide-y divide-border">
              {today.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{c.user_name}</span>
                  <span dir="ltr" className="text-muted-foreground tabular-nums">
                    {formatTime(c.checked_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
