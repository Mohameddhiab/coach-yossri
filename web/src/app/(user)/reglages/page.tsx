"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/shared/components/page-header";
import { InstallAppCard } from "@/shared/components/install-app-card";
import { PageLoader } from "@/shared/components/page-loader";
import { ErrorState } from "@/shared/components/error-state";
import { useAuth } from "@/shared/lib/auth-context";
import { apiClient } from "@/shared/lib/api-client";
import type { NotificationPrefs } from "@/shared/lib/domain";

const PREFS_LABELS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "rappel_poids", label: "تذكير الوزن الأسبوعي", desc: "إذا لم أسجل وزني منذ أسبوع" },
  { key: "motivation", label: "رسائل تحفيزية", desc: "رسائل تشجيعية دورية من المدرب" },
  { key: "expiration_proche", label: "تنبيه قرب انتهاء الاشتراك", desc: "قبل 3 أيام من الانتهاء" },
  { key: "nouveau_plan", label: "خطة جديدة", desc: "عند نشر خطة جديدة أو تعديلها" },
];

export default function MySettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["me", "prefs"],
    queryFn: () => apiClient<NotificationPrefs>("GET", "/auth/prefs"),
  });

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<keyof NotificationPrefs | null>(null);

  const changePassword = useMutation({
    mutationFn: () => apiClient("POST", "/auth/change-password", { current, next }),
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور");
      setCurrent("");
      setNext("");
      setConfirm("");
      setPwError(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "خطأ"),
  });

  const savePrefs = useMutation({
    mutationFn: (body: NotificationPrefs) => apiClient("PUT", "/auth/prefs", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "prefs"] });
      toast.success("تم حفظ التفضيلات");
    },
    onError: () => toast.error("تعذر الحفظ — حاول مرة أخرى"),
    onSettled: () => setPendingKey(null),
  });

  const togglePref = (key: keyof NotificationPrefs, v: boolean) => {
    if (!prefs) return;
    setPendingKey(key);
    savePrefs.mutate({ ...prefs, [key]: v });
  };

  const submitPassword = () => {
    if (next.length < 6) {
      setPwError("يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل");
      return;
    }
    if (next !== confirm) {
      setPwError("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }
    setPwError(null);
    changePassword.mutate();
  };

  if (isLoading) return <PageLoader rows={2} />;
  if (isError) return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;
  if (!prefs) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="كلمة السر و الإشعارات" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="size-4 text-primary" />
            حسابي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="font-semibold">{user?.prenom} {user?.nom}</div>
          <div className="text-muted-foreground" dir="ltr">
            {user?.email}
          </div>
          <div className="text-muted-foreground" dir="ltr">
            {user?.telephone}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" />
            تغيير كلمة السر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>كلمة السر الحالية</Label>
            <Input
              type="password"
              dir="ltr"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>كلمة السر الجديدة</Label>
              <Input
                type="password"
                dir="ltr"
                value={next}
                onChange={(e) => {
                  setNext(e.target.value);
                  setPwError(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة السر</Label>
              <Input
                type="password"
                dir="ltr"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setPwError(null);
                }}
              />
            </div>
          </div>
          {pwError && <p className="text-xs font-medium text-destructive">{pwError}</p>}
          {!pwError && next && next.length < 6 && (
            <p className="text-xs text-muted-foreground">يجب أن تتكون كلمة المرور من 6 أحرف على الأقل</p>
          )}
          <Button
            disabled={
              changePassword.isPending || !current || !next || !confirm
            }
            onClick={submitPassword}
          >
            {changePassword.isPending ? <Loader2 className="animate-spin" /> : null}
            تغيير كلمة السر
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الإشعارات</CardTitle>
          <CardDescription>اختر ما ترغب في استلامه عبر البريد الإلكتروني</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREFS_LABELS.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <span className="flex items-center gap-2">
                  {pendingKey === item.key && (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  )}
                  <Switch
                    checked={prefs[item.key]}
                    onCheckedChange={(v: boolean) => togglePref(item.key, v)}
                    disabled={pendingKey !== null}
                  />
                </span>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      <InstallAppCard />
    </div>
  );
}