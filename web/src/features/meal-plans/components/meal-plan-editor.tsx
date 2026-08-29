"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Copy, Loader2, Plus, Printer, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActiviteLevel, MealPlan, MealType, PlanObjective, WeekDay } from "@/shared/lib/domain";
import {
  ACTIVITE_LABELS,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  OBJECTIVE_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  todayWeekDay,
} from "@/shared/lib/domain";
import {
  useCreatePlan,
  useDuplicatePlan,
  usePlan,
  usePlanVersions,
  useTemplates,
  useUpdatePlan,
} from "@/features/meal-plans/hooks/useMealPlan";
import {
  getCalorieNeeds,
  type CalorieSuggestion,
  type MealInput,
} from "@/features/meal-plans/api/mealPlans.api";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/shared/components/empty-state";
import { MealPlanPrintView } from "@/features/meal-plans/components/meal-plan-print-view";

type DraftMeal = MealInput & { id?: string };

type MacroState = {
  calories_cible: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
};

type MealMacroKey = "calories" | "proteines_g" | "glucides_g" | "lipides_g";

function emptyMeal(jour: WeekDay, type: MealType): DraftMeal {
  return {
    jour_semaine: jour,
    type_repas: type,
    description: "",
    calories: null,
    proteines_g: null,
    glucides_g: null,
    lipides_g: null,
    alternatives: null,
  };
}

const PLAN_MACRO_FIELDS: { key: keyof MacroState; label: string; unit: string }[] = [
  { key: "calories_cible", label: "سعرات", unit: "سعرة" },
  { key: "proteines_g", label: "بروتين", unit: "غ" },
  { key: "glucides_g", label: "كربوهيدرات", unit: "غ" },
  { key: "lipides_g", label: "دهون", unit: "غ" },
];

const MEAL_MACRO_FIELDS: { key: MealMacroKey; label: string; unit: string }[] = [
  { key: "calories", label: "سعرات", unit: "سعرة" },
  { key: "proteines_g", label: "بروتين", unit: "غ" },
  { key: "glucides_g", label: "كربوهيدرات", unit: "غ" },
  { key: "lipides_g", label: "دهون", unit: "غ" },
];

function mealId(meal: DraftMeal): string {
  return meal.id ?? `${meal.jour_semaine}-${meal.type_repas}-${meal.description.slice(0, 10)}`;
}

function draftFromPlan(plan: MealPlan | null): {
  titre: string;
  objectif: PlanObjective;
  macros: MacroState;
  meals: DraftMeal[];
} {
  if (!plan) {
    return {
      titre: "",
      objectif: "PRISE_DE_MASSE",
      macros: { calories_cible: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 },
      meals: [],
    };
  }
  return {
    titre: plan.titre,
    objectif: plan.objectif,
    macros: {
      calories_cible: plan.calories_cible,
      proteines_g: plan.proteines_g,
      glucides_g: plan.glucides_g,
      lipides_g: plan.lipides_g,
    },
    meals: plan.meals.map((m) => ({
      id: m.id,
      jour_semaine: m.jour_semaine,
      type_repas: m.type_repas,
      description: m.description,
      calories: m.calories,
      proteines_g: m.proteines_g,
      glucides_g: m.glucides_g,
      lipides_g: m.lipides_g,
      alternatives: m.alternatives,
    })),
  };
}

export function MealPlanEditor({ userId }: { userId: string }) {
  const { data: plan, isLoading } = usePlan(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return <PlanEditorInner key={plan?.id ?? "new"} plan={plan ?? null} userId={userId} />;
}

function PlanEditorInner({ plan, userId }: { plan: MealPlan | null; userId: string }) {
  const createPlan = useCreatePlan(userId);
  const updatePlan = useUpdatePlan(userId);
  const initial = useMemo(() => draftFromPlan(plan), [plan]);

  const [titre, setTitre] = useState(initial.titre);
  const [objectif, setObjectif] = useState<PlanObjective>(initial.objectif);
  const [macros, setMacros] = useState<MacroState>(initial.macros);
  const [meals, setMeals] = useState<DraftMeal[]>(initial.meals);
  const [activeDay, setActiveDay] = useState<WeekDay>(
    plan ? todayWeekDay() : "TOUS_LES_JOURS",
  );
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify({ titre, objectif, macros, meals }) !== JSON.stringify(initial),
    [titre, objectif, macros, meals, initial],
  );

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const today = todayWeekDay();
  const mealsForDay = useMemo(
    () => meals.filter((m) => m.jour_semaine === activeDay),
    [meals, activeDay],
  );

  const updateMeal = (key: string, patch: Partial<DraftMeal>) => {
    setMeals((prev) => prev.map((m) => (mealId(m) === key ? { ...m, ...patch } : m)));
  };

  const removeMeal = (key: string) => {
    setMeals((prev) => prev.filter((m) => mealId(m) !== key));
  };

  const addMeal = (type: MealType) => {
    const day = activeDay === "TOUS_LES_JOURS" ? "TOUS_LES_JOURS" : activeDay;
    setMeals((prev) => [
      ...prev,
      { ...emptyMeal(day, type), id: `draft-${crypto.randomUUID().slice(0, 6)}` },
    ]);
  };

  const save = async () => {
    const filled = meals.filter((m) => m.description.trim());
    if (filled.length === 0) {
      toast.error("يُرجى إضافة وجبة واحدة على الأقل");
      return;
    }
    setSaving(true);
    try {
      const input = {
        titre: titre.trim() || "خطة غذائية",
        objectif,
        calories_cible: macros.calories_cible,
        proteines_g: macros.proteines_g,
        glucides_g: macros.glucides_g,
        lipides_g: macros.lipides_g,
        meals: filled,
      };
      if (plan) {
        await updatePlan.mutateAsync(input);
        toast.success(`تم حفظ الخطة بنجاح (الإصدار ${plan.version + 1})`);
      } else {
        await createPlan.mutateAsync(input);
        toast.success("تم إنشاء الخطة بنجاح");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const dayTabs: WeekDay[] = [...WEEK_DAYS, "TOUS_LES_JOURS"];

  const applyCalories = (s: CalorieSuggestion) => {
    setMacros({
      calories_cible: s.calories,
      proteines_g: s.proteines_g,
      glucides_g: s.glucides_g,
      lipides_g: s.lipides_g,
    });
    toast.success("تم تطبيق السعرات المقترحة على الخطة بنجاح");
  };

  const printPlan = useMemo(() => {
    const filled = meals.filter((m) => m.description.trim());
    const now = new Date().toISOString();
    return {
      id: plan?.id ?? "draft",
      user_id: userId,
      coach_id: plan?.coach_id ?? "",
      titre: titre.trim() || "خطة غذائية",
      objectif,
      calories_cible: macros.calories_cible,
      proteines_g: macros.proteines_g,
      glucides_g: macros.glucides_g,
      lipides_g: macros.lipides_g,
      statut: "ACTIF" as const,
      version: plan?.version ?? 1,
      meals: filled.map((m) => ({
        ...m,
        id: m.id ?? `m-${crypto.randomUUID().slice(0, 8)}`,
        meal_plan_id: plan?.id ?? "draft",
      })),
      versions: [],
      created_at: plan?.created_at ?? now,
      updated_at: now,
    };
  }, [plan, userId, titre, objectif, macros, meals]);

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-background/90 px-3 py-2 backdrop-blur">
        {plan && (
          <Badge variant="outline" className="me-auto tabular-nums">
            الإصدار {plan.version}
          </Badge>
        )}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 p-1">
          <CalorieDialog userId={userId} objectif={objectif} onApply={applyCalories} />
          <CopyPlanDialog userId={userId} />
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            طباعة
          </Button>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {plan ? "حفظ التعديلات" : "إنشاء الخطة"}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">عنوان الخطة</Label>
              <Input
                placeholder="مثال: خطة زيادة الكتلة — المرحلة 1"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">الهدف</Label>
              <Select value={objectif} onValueChange={(v: string) => setObjectif(v as PlanObjective)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OBJECTIVE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLAN_MACRO_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-semibold">{field.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    dir="ltr"
                    min={0}
                    inputMode="numeric"
                    value={macros[field.key] || ""}
                    placeholder="0"
                    onChange={(e) =>
                      setMacros((prev) => ({
                        ...prev,
                        [field.key]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                  <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">الوجبات</CardTitle>
          <CardDescription className="text-xs">
            تنظيم الوجبات بحسب اليوم — «جميع الأيام» تعني تكرار الوجبة يوميًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeDay}
            onValueChange={(v: string) => setActiveDay(v as WeekDay)}
          >
            <TabsList
              variant="line"
              aria-label="أيام الوجبات"
              className="w-full justify-start gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-none border-b bg-transparent p-0 h-auto"
            >
              {dayTabs.map((d) => {
                const isActive = d === activeDay;
                const isToday = d === today;
                const count = d === "TOUS_LES_JOURS"
                  ? meals.length
                  : meals.filter((m) => m.jour_semaine === d).length;
                return (
                  <TabsTrigger
                    key={d}
                    value={d}
                    className="shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {isToday ? (
                        <span className={`size-1.5 shrink-0 rounded-full ${isActive ? "bg-primary" : "bg-primary/60"}`} />
                      ) : null}
                      {WEEK_DAY_LABELS[d]}
                      {count ? (
                        <span
                          className={`ms-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeDay} className="space-y-4 pt-4">
              {mealsForDay.length === 0 && (
                <EmptyState
                  title={`لا توجد وجبات مسجلة ليوم ${WEEK_DAY_LABELS[activeDay]}`}
                  description="أضف وجبة من الخيارات أدناه"
                />
              )}

              {MEAL_TYPE_ORDER.map((type) => {
                const typeMeals = mealsForDay.filter((m) => m.type_repas === type);
                if (typeMeals.length === 0) return null;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/12 px-2 py-0.5 text-xs font-bold text-primary">
                        {MEAL_TYPE_LABELS[type]}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => addMeal(type)}>
                        <Plus />
                        إضافة وجبة
                      </Button>
                    </div>
                    {typeMeals.map((meal) => {
                      const key = mealId(meal);
                      return (
                        <div key={key} className="rounded-xl border bg-card p-4">
                          <Textarea
                            id={`meal-desc-${key}`}
                            rows={2}
                            maxLength={400}
                            placeholder="مكونات الوجبة والكميات بالتفصيل..."
                            value={meal.description}
                            onChange={(e) => updateMeal(key, { description: e.target.value })}
                            className="mb-3"
                          />
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MEAL_MACRO_FIELDS.map((field) => (
                              <div key={field.key}>
                                <Input
                                  type="number"
                                  dir="ltr"
                                  min={0}
                                  inputMode="numeric"
                                  aria-label={`${field.label} (${field.unit})`}
                                  placeholder={`${field.label} ${field.unit}`}
                                  value={meal[field.key] ?? ""}
                                  onChange={(e) =>
                                    updateMeal(key, {
                                      [field.key]: e.target.value
                                        ? Math.max(0, Number(e.target.value))
                                        : null,
                                    })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 space-y-2">
                            <Input
                              placeholder="البدائل المتاحة (اختياري): مثل استبدال الدجاج بالتونة أو البيض..."
                              value={meal.alternatives ?? ""}
                              onChange={(e) => updateMeal(key, { alternatives: e.target.value })}
                            />
                            <Button variant="ghost" size="sm" onClick={() => removeMeal(key)}>
                              <Trash2 />
                              حذف الوجبة
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                {MEAL_TYPE_ORDER.map((type) => (
                  <Button key={type} variant="outline" size="sm" onClick={() => addMeal(type)}>
                    <Plus />
                    {MEAL_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-center border-t pt-4">
            <Button size="lg" onClick={save} disabled={saving} className="w-full sm:w-auto min-w-[200px] gap-2 text-base">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {plan ? "حفظ التعديلات" : "إنشاء الخطة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan && <VersionsDialog userId={userId} />}

      <MealPlanPrintView plan={printPlan} />
    </div>
  );
}

function CalorieDialog({
  userId,
  objectif,
  onApply,
}: {
  userId: string;
  objectif: PlanObjective;
  onApply: (s: CalorieSuggestion) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activite, setActivite] = useState<ActiviteLevel>("MODERE");

  const { data, isLoading, error } = useQuery({
    queryKey: ["calorie-needs", userId, activite],
    queryFn: () => getCalorieNeeds(userId, activite),
    enabled: open,
    retry: false,
  });

  const suggestion = data?.suggestions[objectif];
  const blocked = error instanceof Error ? error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Activity className="size-4" />
          حساب السعرات
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حساب السعرات اليومية</DialogTitle>
          <DialogDescription>
            معادلة ميفلين-سانت جيور: آخر وزن مسجل + الطول + العمر + الجنس، مضروبة في معامل النشاط البدني.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>مستوى النشاط</Label>
            <Select value={activite} onValueChange={(v) => setActivite(v as ActiviteLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTIVITE_LABELS) as ActiviteLevel[]).map((a) => (
                  <SelectItem key={a} value={a}>
                    {ACTIVITE_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && <Skeleton className="h-32" />}

          {blocked && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {blocked}
            </p>
          )}

          {data && suggestion && (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-muted/60 p-3">
                  <div className="text-xs text-muted-foreground">معدل الأيض الأساسي (BMR)</div>
                  <div className="text-lg font-extrabold" dir="ltr">
                    {data.bmr} سعرة
                  </div>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <div className="text-xs text-muted-foreground">
                    الاحتياج اليومي ({ACTIVITE_LABELS[data.activite].split(" ")[0]})
                  </div>
                  <div className="text-lg font-extrabold" dir="ltr">
                    {data.tdee} سعرة
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold">مقترح لهدف «{OBJECTIVE_LABELS[objectif]}»</span>
                  <Badge variant="secondary" dir="ltr">
                    {suggestion.calories} سعرة
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span dir="ltr">بروتين {suggestion.proteines_g}غ</span>
                  <span dir="ltr">كربوهيدرات {suggestion.glucides_g}غ</span>
                  <span dir="ltr">دهون {suggestion.lipides_g}غ</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                الوزن {data.poids_kg} كغم • الطول {data.taille_cm} سم • العمر {data.age} سنة
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => suggestion && onApply(suggestion)} disabled={!suggestion}>
            تطبيق على الخطة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CopyPlanDialog({ userId }: { userId: string }) {
  const { data: templates, isLoading } = useTemplates();
  const duplicate = useDuplicatePlan(userId);
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"templates" | "members">("templates");

  const presets = (templates ?? []).filter((t) => t.is_template);
  const members = (templates ?? []).filter((t) => !t.is_template);

  const run = async () => {
    if (!selected) return;
    try {
      await duplicate.mutateAsync(selected);
      toast.success("تم نسخ الخطة بنجاح — يمكنك التعديل عليها ثم الحفظ");
      setOpen(false);
    } catch {
      toast.error("تعذّر نسخ الخطة — يُرجى المحاولة مرة أخرى");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Copy className="size-4" />
          نسخ من خطة سابقة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>نسخ خطة كنقطة بداية</DialogTitle>
          <DialogDescription>
            اختر قالبًا جاهزًا أو خطة لمشترك آخر، ثم عدّلها بما يناسب هذا المشترك.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "templates" | "members")}>
          <TabsList className="w-full">
            <TabsTrigger value="templates" className="flex-1">
              قوالب جاهزة ({presets.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1">
              خطط المشتركين ({members.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="space-y-2 pt-3">
            {isLoading ? (
              <Skeleton className="h-10" />
            ) : presets.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد قوالب جاهزة حاليًا.</p>
            ) : (
              presets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2 text-start transition-colors ${
                    selected === t.id ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted text-lg">
                      🍽️
                    </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.titre}</div>
                    <div className="text-xs text-muted-foreground">
                      {OBJECTIVE_LABELS[t.objectif]} • الإصدار {t.version}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(t.updated_at)}
                  </Badge>
                </button>
              ))
            )}
          </TabsContent>
          <TabsContent value="members" className="space-y-2 pt-3">
            {isLoading ? (
              <Skeleton className="h-10" />
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد خطط مشتركين متاحة للنسخ.</p>
            ) : (
              members.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-start text-sm transition-colors ${
                    selected === t.id ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{t.titre}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.user_name} • {OBJECTIVE_LABELS[t.objectif]} • الإصدار {t.version}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(t.updated_at)}
                  </Badge>
                </button>
              ))
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={run} disabled={!selected || duplicate.isPending}>
            نسخ الخطة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionsDialog({ userId }: { userId: string }) {
  const { data: versions, isLoading } = usePlanVersions(userId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground">
          سجل الإصدارات ({versions?.length ?? 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>سجل الإصدارات</DialogTitle>
          <DialogDescription>كل تعديل يحفظ نسخة سابقة يمكنك الرجوع إليها.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isLoading && <Skeleton className="h-16" />}
          {!isLoading && versions && versions.length === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد إصدارات سابقة حاليًا.</p>
          )}
          {versions?.map((v) => (
            <div key={v.version} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <Badge>الإصدار {v.version}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(v.updated_at)}</span>
              </div>
              <div className="mt-1.5 text-muted-foreground">{v.snapshot.titre}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}