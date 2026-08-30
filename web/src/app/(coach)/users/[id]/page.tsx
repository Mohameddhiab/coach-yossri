"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  Copy,
  Dumbbell,
  Edit3,
  FileDown,
  KeyRound,
  Mail,
  Phone,
  Send,
  ShieldAlert,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/shared/components/page-loader";
import { cn } from "@/lib/utils";
import { BackButton } from "@/shared/components/back-button";
import { UserAvatar } from "@/shared/components/user-avatar";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { SubscriptionBadge } from "@/features/subscriptions/components/subscription-badge";
import { TierBadge } from "@/features/subscriptions/components/tier-badge";
import { RenewDialog } from "@/features/subscriptions/components/renew-dialog";
import { FidelityCard } from "@/features/subscriptions/components/fidelity-card";
import { PauseSubscriptionButton } from "@/features/subscriptions/components/pause-subscription-button";
import { WeeklyReport } from "@/features/subscriptions/components/weekly-report";
import { CoachGoalCard } from "@/features/goals/components/coach-goal-card";
import { NotesPanel } from "@/features/users/components/notes-panel";
import { MemberTimeline } from "@/features/users/components/member-timeline";
import { ReferralCard } from "@/features/users/components/referral-card";
import { WeightChart } from "@/features/progress/components/weight-chart";
import { WeightProjectionCard } from "@/features/progress/components/weight-projection-card";
import { WeightTargetCard } from "@/features/progress/components/weight-target-card";
import { PhotoGallery } from "@/features/progress/components/photo-gallery";
import { MacrosCards } from "@/features/meal-plans/components/macros-cards";
import { MealPlanDayView } from "@/features/meal-plans/components/meal-plan-day-view";
import { PlanPdfDocument, downloadPlanPdf } from "@/features/meal-plans/components/plan-pdf";
import { WorkoutPlanDayView } from "@/features/workout-plans/components/workout-plan-day-view";
import { WorkoutPlanPdfDocument, downloadWorkoutPdf } from "@/features/workout-plans/components/workout-plan-pdf";
import { useWorkoutPlan } from "@/features/workout-plans/hooks/useWorkoutPlan";
import { FollowUpCoachCard } from "@/features/follow-ups/components/follow-up-coach-card";
import {
  useDeleteUser,
  useResetPassword,
  useResendVerifyEmail,
  useUpdateUser,
  useUser,
} from "@/features/users/hooks/useUsers";
import { usePlan } from "@/features/meal-plans/hooks/useMealPlan";
import { useWeightLogs } from "@/features/progress/hooks/useProgress";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { listSubscriptions } from "@/features/subscriptions/api/subscriptions.api";
import {
  getSubscriptionStatus,
  daysLeft,
  effectiveDateFin,
  getActiveTier,
  isPaused,
  OBJECTIVE_LABELS,
  PAYMENT_MODE_LABELS,
  SEXE_LABELS,
  WEEK_DAY_LABELS,
  todayWeekDay,
  type User,
} from "@/shared/lib/domain";
import { formatDate } from "@/lib/utils";

const editSchema = z.object({
  prenom: z.string().min(1, "الاسم الأول مطلوب"),
  nom: z.string().min(1, "اللقب مطلوب"),
  telephone: z.string().min(1, "اكتب رقم الهاتف"),
  date_naissance: z.string().optional(),
  sexe: z.string().optional(),
  taille_cm: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const router = useRouter();

  const { data: user, isLoading, isError, refetch, isRefetching } = useUser(userId);
  const { data: plan } = usePlan(userId);
  const { data: workout } = useWorkoutPlan(userId);
  const { data: weightLogs } = useWeightLogs(userId);
  const { data: goal } = useGoal(userId);
  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: () => listSubscriptions(userId),
    enabled: !!userId,
  });
  const resetPassword = useResetPassword();
  const resendVerifyEmail = useResendVerifyEmail();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser(userId);

  const [editOpen, setEditOpen] = useState(false);
  const [passwordResult, setPasswordResult] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<"meal" | "workout" | null>(null);
  const mealPdfRef = useRef<HTMLDivElement>(null);
  const workoutPdfRef = useRef<HTMLDivElement>(null);

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      telephone: "",
      date_naissance: "",
      sexe: "",
      taille_cm: "",
    },
  });

  useEffect(() => {
    if (editOpen && user) {
      editForm.reset({
        prenom: user.prenom,
        nom: user.nom,
        telephone: user.telephone,
        date_naissance: toDateInput(user.date_naissance),
        sexe: user.sexe ?? "",
        taille_cm: user.taille_cm ? String(user.taille_cm) : "",
      });
    }
  }, [editOpen, user, editForm]);

  if (isError) {
    return (
      <div className="space-y-6">
        <BackButton fallback="/users" />
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      </div>
    );
  }

  if (isLoading || !user) return <PageLoader />;

  const status = getSubscriptionStatus(user.subscription);
  const remaining = daysLeft(user.subscription);
  const tier = getActiveTier(user.subscription);

  const saveEdit = async (values: EditValues) => {
    try {
      await updateUser.mutateAsync({
        ...values,
        date_naissance: values.date_naissance || null,
        sexe: (values.sexe as User["sexe"]) || null,
        taille_cm: values.taille_cm ? Number(values.taille_cm) : null,
      });
      toast.success("تم تسجيل التحديث");
      setEditOpen(false);
    } catch {
      toast.error("تعذر حفظ التعديلات");
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await resetPassword.mutateAsync(userId);
      setPasswordResult(res.password);
    } catch {
      toast.error("تعذر تغيير كلمة المرور — حاول مرة أخرى");
    }
  };

  const handleResendVerify = async () => {
    try {
      await resendVerifyEmail.mutateAsync(userId);
      toast.success("تم إعادة إرسال رابط التفعيل");
    } catch {
      toast.error("تعذر إرسال الرابط — حاول مرة أخرى");
    }
  };

  const handlePdfDownload = async (kind: "meal" | "workout") => {
    const el =
      kind === "meal"
        ? (mealPdfRef.current?.firstElementChild as HTMLElement | null)
        : (workoutPdfRef.current?.firstElementChild as HTMLElement | null);
    if (!el || (kind === "meal" ? !plan : !workout)) return;
    setPdfBusy(kind);
    try {
      if (kind === "meal") {
        await downloadPlanPdf(
          el,
          `plan-${plan!.titre.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
        );
      } else {
        await downloadWorkoutPdf(
          el,
          `workout-${workout!.titre.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
        );
      }
      toast.success("تم تحميل PDF");
    } catch {
      toast.error("تعذر تحويل ملف PDF — حاول مرة أخرى");
    } finally {
      setPdfBusy(null);
    }
  };

  return (
      <div className="space-y-6">
        <BackButton fallback="/users" />

        {/* Member 360 Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <UserAvatar
                  prenom={user.prenom}
                  nom={user.nom}
                  className={cn(
                    "size-16 ring-4 ring-offset-2 ring-offset-card sm:size-20",
                    status === "ACTIF" && "ring-emerald-500",
                    status === "EXPIRE_BIENTOT" && "ring-amber-500",
                    status === "EXPIRE" && "ring-destructive",
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-foreground sm:text-3xl">
                    {user.prenom} {user.nom}
                  </h1>
                  <SubscriptionBadge status={status} />
                  <TierBadge tier={tier} />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" dir="ltr">
                    <Mail className="size-3.5 text-primary" />
                    {user.email}
                  </span>
                  {!user.email_verified && (
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="border-destructive/40 text-destructive">
                        <ShieldAlert className="size-3" />
                        بريد غير مؤكد
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleResendVerify}
                        disabled={resendVerifyEmail.isPending}
                        className="h-6 gap-1 text-xs"
                      >
                        <Send className="size-3" />
                        {resendVerifyEmail.isPending ? "جارٍ الإرسال..." : "إعادة إرسال التفعيل"}
                      </Button>
                    </span>
                  )}
                  <span className="flex items-center gap-1" dir="ltr">
                    <Phone className="size-3.5 text-primary" />
                    {user.telephone}
                  </span>
                  <span>عضو منذ {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <RenewDialog userId={userId} userName={`${user.prenom} ${user.nom}`} />
              <Button asChild variant="outline" className="gap-1.5 rounded-xl">
                <Link href={`/users/${userId}/plan`}>
                  <UtensilsCrossed className="size-4 text-primary" />
                  <span>الخطة الغذائية</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-1.5 rounded-xl">
                <Link href={`/users/${userId}/exercices`}>
                  <Dumbbell className="size-4 text-primary" />
                  <span>خطة التمارين</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList aria-label="أقسام الملف" className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-muted/60 p-1.5 sm:w-auto">
            <TabsTrigger
              value="overview"
              className="gap-2 rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <span>نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger
              value="suivi"
              className="gap-2 rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <span>المتابعة والملاحظات</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="gap-2 rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <span>التقدّم والوزن</span>
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="gap-2 rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <span>البرامج والتمارين</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-[15px] font-bold">معلومات العضو</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <UserAvatar prenom={user.prenom} nom={user.nom} className="size-12" />
                  <div>
                    <div className="font-bold">{user.prenom} {user.nom}</div>
                    <div className="text-xs text-muted-foreground">
                      عضو من {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span dir="ltr">{user.email}</span>
                  {!user.email_verified && (
                    <Badge variant="outline" className="border-destructive/40 text-destructive">
                      غير مؤكد
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span dir="ltr">{user.telephone}</span>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    <Edit3 className="size-4" />
                    تعديل المعلومات
                  </Button>
                  <Dialog
                    open={!!passwordResult}
                    onOpenChange={(o: boolean) => {
                      if (!o) setPasswordResult(null);
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={resetPassword.isPending}
                    >
                      <KeyRound className="size-4" />
                      {resetPassword.isPending ? "جارٍ التغيير..." : "غيّر كلمة السر"}
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>كلمة السر الجديدة</DialogTitle>
                        <DialogDescription>
                          تظهر مرة واحدة فقط — سلمها للعضو. (في الوضع التجريبي: سيتم إرسالها عبر البريد الإلكتروني لاحقًا)
                        </DialogDescription>
                      </DialogHeader>
                      {passwordResult && (
                        <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3">
                          <code dir="ltr" className="flex-1 text-center text-lg font-bold text-primary">
                            {passwordResult}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="انسخ كلمة السر"
                            onClick={() => {
                              navigator.clipboard.writeText(passwordResult);
                              toast.success("تنسخت");
                            }}
                          >
                            <Copy />
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="ms-auto">
                        <Trash2 className="size-4" />
                        احذف العضو
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تم الحذف {user.prenom} {user.nom}؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف الحساب والخطة والأوزان والصور نهائيًا. لا يمكن التراجع عن هذه العملية.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              await deleteUser.mutateAsync(userId);
                              toast.success("تم حذف العضو");
                              router.push("/dashboard");
                            } catch {
                              toast.error("تعذر حذف العضو — حاول مرة أخرى");
                            }
                          }}
                        >
                          احذف نهائياً
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px] font-bold">الاشتراك الحالي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {user.subscription ? (
                  <>
                    <div className="flex items-center gap-2">
                      <SubscriptionBadge status={status} />
                      {isPaused(user.subscription) && (
                        <Badge variant="outline" className="border-sky-500/40 text-sky-600 dark:text-sky-400">
                          مجمّد — الأيام محفوظة
                        </Badge>
                      )}
                      {remaining > 0 && (
                        <span className="font-bold tabular-nums">{remaining} يوم باقي</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        <div className="text-xs">البداية</div>
                        <div className="font-medium text-foreground">
                          {formatDate(user.subscription.date_debut)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs">النهاية {isPaused(user.subscription) && "(بعد الفك)"}</div>
                        <div className="font-medium text-foreground">
                          {formatDate(effectiveDateFin(user.subscription).toISOString())}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs">المبلغ</div>
                        <div className="font-medium text-foreground tabular-nums">
                          {user.subscription.montant} د.ت
                        </div>
                      </div>
                      <div>
                        <div className="text-xs">طريقة الدفع</div>
                        <div className="font-medium text-foreground">
                          {PAYMENT_MODE_LABELS[user.subscription.mode_paiement]}
                        </div>
                      </div>
                    </div>
                    <PauseSubscriptionButton
                      userId={userId}
                      subscription={user.subscription}
                    />
                  </>
                ) : (
                  <p className="text-muted-foreground">لا يوجد اشتراك مسجّل.</p>
                )}
                {subscriptions && subscriptions.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                      سجل الدفوعات
                    </div>
                    <div className="space-y-1.5">
                      {subscriptions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs"
                        >
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            {formatDate(s.date_debut)} → {formatDate(s.date_fin)}
                          </span>
                          <span className="font-semibold tabular-nums">{s.montant} د.ت</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suivi" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CoachGoalCard userId={userId} />
            <FidelityCard history={subscriptions} />
            <ReferralCard user={user} />
            <FollowUpCoachCard userId={userId} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MemberTimeline userId={userId} />
            <NotesPanel
              userId={userId}
              userName={`${user.prenom} ${user.nom}`}
              daysLeft={remaining}
            />
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <WeightTargetCard userId={userId} logs={weightLogs} canEdit />
          <WeightProjectionCard logs={weightLogs} />
          <WeeklyReport
            userName={`${user.prenom} ${user.nom}`}
            logs={weightLogs}
            goal={goal}
            subscription={user.subscription}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">منحنى الوزن</CardTitle>
            </CardHeader>
            <CardContent>
              {weightLogs && weightLogs.length > 0 ? (
                <>
                  <WeightChart logs={weightLogs} />
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {weightLogs.slice(0, 6).map((log) => (
                      <Badge key={log.id} variant="secondary">
                        {formatDate(log.date)}: {log.poids_kg} كغ
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="لا يوجد أوزان مسجلة بعد"
                  description="يقوم العضو بتسجيل وزنه بنفسه من تطبيقه"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <PhotoGallery userId={userId} canEdit={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {workout ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="size-4 text-primary" />
                    {workout.titre}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-1">
                      {OBJECTIVE_LABELS[workout.objectif]}
                    </Badge>{" "}
                    <span className="text-xs">الإصدار {workout.version}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePdfDownload("workout")}
                    disabled={pdfBusy === "workout"}
                    className="gap-1.5"
                  >
                    {pdfBusy === "workout" ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <FileDown className="size-4" />
                    )}
                    PDF تمارين
                  </Button>
                  <Button asChild>
                    <Link href={`/users/${userId}/exercices`}>تعديل التمارين</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WorkoutPlanDayView day={todayWeekDay()} exercises={workout.exercises} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="لا يوجد خطة تمارين بعد"
              description="صيّر خطة تمارين مخصصة لهذا العضو"
              action={
                <Button asChild>
                  <Link href={`/users/${userId}/exercices`}>صيّر خطة التمارين</Link>
                </Button>
              }
            />
          )}
          {plan ? (
            <>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{plan.titre}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {OBJECTIVE_LABELS[plan.objectif]}
                      </Badge>{" "}
                      <span className="text-xs">الإصدار {plan.version}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePdfDownload("meal")}
                      disabled={pdfBusy === "meal"}
                      className="gap-1.5"
                    >
                      {pdfBusy === "meal" ? (
                        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <FileDown className="size-4" />
                      )}
                      PDF وجبات
                    </Button>
                    <Button asChild>
                      <Link href={`/users/${userId}/plan`}>تعديل الخطة</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
              <MacrosCards
                calories={plan.calories_cible}
                proteines={plan.proteines_g}
                glucides={plan.glucides_g}
                lipides={plan.lipides_g}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    وجبات اليوم — {WEEK_DAY_LABELS[todayWeekDay()]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MealPlanDayView plan={plan} day={todayWeekDay()} />
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              title="لا يوجد خطة غذائية بعد"
              description="صيّر خطة مخصصة لهذا العضو"
              action={
                <Button asChild>
                  <Link href={`/users/${userId}/plan`}>صيّر الخطة</Link>
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>

      {plan && (
        <div
          ref={mealPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 opacity-0"
        >
          <PlanPdfDocument plan={plan} logs={weightLogs ?? []} target={null} goal={goal ?? null} />
        </div>
      )}
      {workout && (
        <div
          ref={workoutPdfRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 opacity-0"
        >
          <WorkoutPlanPdfDocument plan={workout} />
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المعلومات</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اللقب</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الهاتف</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="date_naissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الميلاد (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="date" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="sexe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس (لحساب السعرات)</FormLabel>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(SEXE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="taille_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الطول (سم، اختياري)</FormLabel>
                      <FormControl>
                        <Input type="number" dir="ltr" min={100} max={250} placeholder="170" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  حفظ
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}