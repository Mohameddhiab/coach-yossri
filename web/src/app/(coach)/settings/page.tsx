"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Loader2, RotateCcw, Save, User2, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { ErrorState } from "@/shared/components/error-state";
import { useAuth } from "@/shared/lib/auth-context";
import { apiClient } from "@/shared/lib/api-client";

interface CoachSettings {
  motivation_message: string;
  rappel_interval_jours: number;
  send_motivation: boolean;
  message_templates: string[];
  total_seats: number;
  remaining_seats: number;
}

interface Draft {
  motivation_message: string;
  rappel_interval_jours: number;
  send_motivation: boolean;
  templatesText: string;
  total_seats: number;
  remaining_seats: number;
}

const clampInterval = (n: number) => Math.min(365, Math.max(1, Math.round(n) || 7));
const clampTotal = (n: number) => Math.min(1000, Math.max(1, Math.round(n) || 15));
const clampRemaining = (n: number, total: number) =>
  Math.min(total, Math.max(0, Math.round(n) || 0));

type Edits = Partial<Draft>;

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["coach-settings"],
    queryFn: () => apiClient<CoachSettings>("GET", "/coach/settings"),
  });

  const [edits, setEdits] = useState<Edits>({});

  const base: Draft | null = settings
    ? {
        motivation_message: settings.motivation_message,
        rappel_interval_jours: settings.rappel_interval_jours,
        send_motivation: settings.send_motivation,
        templatesText: (settings.message_templates ?? []).join("\n"),
        total_seats: settings.total_seats,
        remaining_seats: settings.remaining_seats,
      }
    : null;

  const value: Draft | null = base ? { ...base, ...edits } : null;

  const isDirty =
    !!base &&
    !!value &&
    (value.motivation_message !== base.motivation_message ||
      value.rappel_interval_jours !== base.rappel_interval_jours ||
      value.send_motivation !== base.send_motivation ||
      value.templatesText !== base.templatesText ||
      value.total_seats !== base.total_seats ||
      value.remaining_seats !== base.remaining_seats);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const reset = () => setEdits({});

  const save = useMutation({
    mutationFn: (body: CoachSettings) => apiClient("PUT", "/coach/settings", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-settings"] });
      setEdits({});
      toast.success("تم حفظ الإعدادات");
    },
  });

  const handleSave = () => {
    if (!value) return;
    save.mutate({
      motivation_message: value.motivation_message.trim(),
      rappel_interval_jours: clampInterval(value.rappel_interval_jours),
      send_motivation: value.send_motivation,
      message_templates: value.templatesText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20),
      total_seats: clampTotal(value.total_seats),
      remaining_seats: clampRemaining(
        value.remaining_seats,
        clampTotal(value.total_seats),
      ),
    });
  };

  if (isLoading) return <PageLoader rows={2} />;
  if (isError) return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;
  if (!base || !value) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title="الإعدادات" description="ملفك الشخصي وإعدادات الإشعارات" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="size-4 text-primary" />
            الملف الشخصي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم الأول</Label>
              <Input value={user?.prenom ?? ""} readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label>اللقب</Label>
              <Input value={user?.nom ?? ""} readOnly className="bg-muted/40" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input value={user?.email ?? ""} readOnly dir="ltr" className="bg-muted/40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-primary" />
            إشعارات البريد التلقائية
          </CardTitle>
          <CardDescription>
            تُرسل هذه الإشعارات في وضع الموك الحالي (تظهر هنا فقط كإعدادات).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-sm">إرسال رسائل تحفيزية دورية</div>
              <div className="text-xs text-muted-foreground">
                رسالة مشجعة للأعضاء النشطين
              </div>
            </div>
            <Switch
              checked={value.send_motivation}
              onCheckedChange={(v: boolean) =>
                setEdits((prev) => ({ ...prev, send_motivation: v }))
              }
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>رسالة التحفيز</Label>
            <Textarea
              rows={2}
              value={value.motivation_message}
              onChange={(e) =>
                setEdits((prev) => ({ ...prev, motivation_message: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>تذكير الوزن بعد (أيام)</Label>
            <Input
              type="number"
              min={1}
              max={365}
              inputMode="numeric"
              dir="ltr"
              className="w-32 tabular-nums"
              value={value.rappel_interval_jours}
              onChange={(e) => {
                const n = Number(e.target.value);
                setEdits((prev) => ({
                  ...prev,
                  rappel_interval_jours: Number.isFinite(n) ? n : 1,
                }));
              }}
              onBlur={() =>
                setEdits((prev) => ({
                  ...prev,
                  rappel_interval_jours: clampInterval(
                    prev.rappel_interval_jours ?? value.rappel_interval_jours,
                  ),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            أماكن باقة بريم كوتش
          </CardTitle>
          <CardDescription>
            عدد أماكن باقة «بريميوم كوتش» الظاهرة على صفحة الوصول — خفّض «المتبقية» عند كل حجز جديد؛ عند الصفر تظهر «مكتمل» وزر الاتصال بالمدرب.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>إجمالي الأماكن</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                inputMode="numeric"
                dir="ltr"
                className="w-32 tabular-nums"
                value={value.total_seats}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setEdits((prev) => ({
                    ...prev,
                    total_seats: Number.isFinite(n) ? n : 1,
                  }));
                }}
                onBlur={() =>
                  setEdits((prev) => ({
                    ...prev,
                    total_seats: clampTotal(prev.total_seats ?? value.total_seats),
                    remaining_seats: clampRemaining(
                      prev.remaining_seats ?? value.remaining_seats,
                      clampTotal(prev.total_seats ?? value.total_seats),
                    ),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>الأماكن المتبقية</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                dir="ltr"
                className="w-32 tabular-nums"
                value={value.remaining_seats}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setEdits((prev) => ({
                    ...prev,
                    remaining_seats: Number.isFinite(n) ? n : 0,
                  }));
                }}
                onBlur={() =>
                  setEdits((prev) => ({
                    ...prev,
                    remaining_seats: clampRemaining(
                      prev.remaining_seats ?? value.remaining_seats,
                      clampTotal(prev.total_seats ?? value.total_seats),
                    ),
                  }))
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-bold">{value.total_seats}</span>
            <span>مكان إجمالي</span>
            <span className="opacity-50">•</span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-bold">{value.remaining_seats}</span>
            <span>متبقية</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" />
            ردود سريعة (نماذج رسائل)
          </CardTitle>
          <CardDescription>
            تظهر كنقرة واحدة في ملاحظات العضو. المتغيرات: {"{prenom}"} و{"{jours}"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>نموذج واحد في كل سطر</Label>
          <Textarea
            rows={5}
            dir="rtl"
            value={value.templatesText}
            onChange={(e) => setEdits((prev) => ({ ...prev, templatesText: e.target.value }))}
          />
        </CardContent>
      </Card>

      {isDirty && (
        <div className="sticky bottom-4 z-30 mt-auto flex items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <span className="text-sm font-medium">لديك تعديلات غير محفوظة</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={save.isPending}>
              <RotateCcw />
              تراجع
            </Button>
            <Button size="sm" onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              احفظ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
