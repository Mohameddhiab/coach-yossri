"use client";

import { useRouter } from "next/navigation";
import { CalendarX2, LogOut, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/shared/components/logo";
import { useAuth } from "@/shared/lib/auth-context";
import type { Subscription, User } from "@/shared/lib/domain";
import { formatDate } from "@/lib/utils";

export function ExpiredScreen({
  coach,
  subscription = null,
}: {
  coach: User | null;
  subscription?: Subscription | null;
}) {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md border-destructive/30 text-center shadow-xl shadow-destructive/5">
        <CardContent className="space-y-5 p-8">
          <Logo className="justify-center" />
          <div className="space-y-2">
            <h1 className="flex items-center justify-center gap-2 text-xl font-extrabold text-destructive">
              <CalendarX2 className="size-5" />
              انتهت صلاحية اشتراكك
            </h1>
            <p className="text-sm text-muted-foreground">
              انتهت فترة اشتراكك. يُرجى التجديد مع مدربك للاستمرار في متابعة خطتك وسجلات أوزانك وتقدمك الرياضي.
            </p>
          </div>

          {subscription && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">تاريخ انتهاء الاشتراك</div>
                <div className="mt-0.5 font-bold tabular-nums">
                  {formatDate(subscription.date_fin)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">مبلغ آخر اشتراك</div>
                <div className="mt-0.5 font-bold tabular-nums">{subscription.montant} د.ت</div>
              </div>
            </div>
          )}

          {coach && (
            <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
              <div className="font-bold">
                {coach.prenom} {coach.nom}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span dir="ltr">{coach.telephone}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="size-4" />
                <span dir="ltr">{coach.email}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {coach?.telephone && (
              <Button
                className="w-full"
                asChild
              >
                <a href={`tel:${coach.telephone}`}>
                  <Phone />
                  التواصل مع المدرب للتجديد
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await logout();
                router.push("/login");
                router.refresh();
              }}
            >
              <LogOut />
              تسجيل الخروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}