"use client";

import { QRCodeSVG } from "qrcode.react";
import { ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { TierBadge } from "@/features/subscriptions/components/tier-badge";
import { useMyCheckIns } from "@/features/check-ins/hooks/useCheckIns";
import { getSubscriptionStatus, SUBSCRIPTION_STATUS_LABELS } from "@/shared/lib/domain";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-TN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MaCartePage() {
  const { data: subData, isLoading } = useMySubscription();
  const { data: checkIns, isLoading: checkInsLoading } = useMyCheckIns();

  if (isLoading || !subData) {
    return <PageLoader />;
  }

  const { user, subscription } = subData;
  const status = getSubscriptionStatus(subscription);

  return (
    <div className="space-y-6">
      <PageHeader
        title="بطقتي"
        description="أظهر هذه البطاقة للمدرب عند مدخل القاعة لتسجيل حضورك"
      />

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-border">
            <QRCodeSVG
              value={user.id}
              size={200}
              level="M"
              marginSize={2}
            />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {user.prenom} {user.nom}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <TierBadge tier={subscription?.tier} />
              <span className="text-xs text-muted-foreground">
                {SUBSCRIPTION_STATUS_LABELS[status]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ScanLine className="size-3.5" />
            يمسح المدرب رمز QR ويسجل حضورك
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حضوري</CardTitle>
          <CardDescription>آخر التسجيلات في القاعة</CardDescription>
        </CardHeader>
        <CardContent>
          {checkInsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !checkIns?.length ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              لم تسجل أي حضور بعد — هيا إلى القاعة!
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {checkIns.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span dir="ltr" className="text-muted-foreground">
                    {formatDate(c.checked_at)}
                  </span>
                  <span className="font-medium text-emerald-600">حاضر ✓</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
