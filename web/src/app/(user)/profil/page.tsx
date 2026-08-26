"use client";

import { Cake, CalendarDays, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { UserAvatar } from "@/shared/components/user-avatar";
import { CoachContactButtons } from "@/shared/components/coach-contact-buttons";
import { ErrorState } from "@/shared/components/error-state";
import { XpBadgesCard } from "@/features/users/components/xp-badges-card";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { formatDate } from "@/lib/utils";

export default function MyProfilePage() {
  const { data, isLoading, isError, refetch, isRefetching } = useMySubscription();

  if (isLoading) return <PageLoader rows={2} />;
  if (!data || isError) return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;

  const { user, coach } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="ملفي" description="معلوماتك الشخصية ومدربك" />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">معلوماتي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-4">
             <div className="rounded-full bg-gradient-to-br from-primary via-ring to-primary p-0.5 animate-float">
               <UserAvatar prenom={user.prenom} nom={user.nom} className="size-14 ring-2 ring-background" />
             </div>
            <div>
              <div className="text-lg font-bold">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-muted-foreground">
                عضو منذ {formatDate(user.created_at)}
              </div>
            </div>
          </div>
          <Separator />
           <div className="flex items-center gap-3 text-muted-foreground">
             <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
               <Mail className="size-4" />
             </span>
            <span dir="ltr">{user.email}</span>
          </div>
           <div className="flex items-center gap-3 text-muted-foreground">
             <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
               <Phone className="size-4" />
             </span>
            <span dir="ltr">{user.telephone}</span>
          </div>
           <div className="flex items-center gap-3 text-muted-foreground">
             <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
               <Cake className="size-4" />
             </span>
            {user.date_naissance ? formatDate(user.date_naissance) : "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            مدربي
          </CardTitle>
          <CardDescription>تواصل معه للتجديد أو لأي استفسار</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {coach ? (
            <>
              <div className="font-bold">
                {coach.prenom} {coach.nom}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span dir="ltr">{coach.telephone}</span>
              </div>
              <CoachContactButtons telephone={coach.telephone} />
            </>
          ) : (
            <p className="text-muted-foreground">لا يوجد المدرب مرتبط بعد.</p>
          )}
        </CardContent>
      </Card>

      <XpBadgesCard />
    </div>
  );
}