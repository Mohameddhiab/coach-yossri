"use client";
/* eslint-disable react-hooks/set-state-in-effect -- sync form from server plan */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Copy,
  Dumbbell,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/shared/components/empty-state";
import {
  OBJECTIVE_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  todayWeekDay,
  type PlanObjective,
  type WeekDay,
} from "@/shared/lib/domain";
import {
  useCreateWorkoutPlan,
  useDuplicateWorkoutPlan,
  useUpdateWorkoutPlan,
  useWorkoutPlan,
  useWorkoutTemplates,
} from "@/features/workout-plans/hooks/useWorkoutPlan";
import type { WorkoutExerciseInput, WorkoutPlan } from "@/features/workout-plans/api/workoutPlans.api";
import { useLocalExercises } from "@/features/exercises/hooks/useExercises";
import type { Exercise } from "@/features/exercises/api/exercises.api";
import { fallbackForCategory } from "@/shared/lib/exercise-fallbacks";
import { getGuideExercise, getGuideImageUrl, getGuideImageUrls } from "@/shared/lib/exercise-guide-map";
import { getExerciseInstruction } from "@/shared/lib/exercise-instructions";
import { AnimatedExerciseImage } from "@/shared/components/animated-exercise-image";
import { formatDateShort } from "@/lib/utils";

type DraftExercise = WorkoutExerciseInput & { key: string };

function newKey() {
  return `draft-${crypto.randomUUID().slice(0, 8)}`;
}

function emptyExercise(jour: WeekDay): DraftExercise {
  return {
    key: newKey(),
    jour_semaine: jour,
    nom: "",
    charge: null,
    repetitions: null,
    series: null,
    tempo: null,
    repos: null,
    groupe_musculaire: null,
    notes: null,
    image_url: null,
  };
}

function draftFromPlan(plan: WorkoutPlan | null): {
  titre: string;
  objectif: PlanObjective;
  exercises: DraftExercise[];
} {
  if (!plan) {
    return { titre: "", objectif: "PRISE_DE_MASSE", exercises: [] };
  }
  return {
    titre: plan.titre,
    objectif: plan.objectif,
    exercises: plan.exercises.map((e) => ({
      key: e.id,
      jour_semaine: e.jour_semaine,
      nom: e.nom,
      charge: e.charge,
      repetitions: e.repetitions,
      series: e.series,
      tempo: e.tempo,
      repos: e.repos,
      groupe_musculaire: e.groupe_musculaire,
      notes: e.notes,
      image_url: e.image_url,
    })),
  };
}

const TH = "whitespace-nowrap border-b bg-muted px-2 py-2 text-xs font-bold text-muted-foreground";
const TD = "border-b px-2 py-2 align-top";

const CATEGORY_ORDER = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Abs"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  Chest: "Chest",
  Back: "Back",
  Shoulders: "Shoulders",
  Biceps: "Biceps",
  Triceps: "Triceps",
  Legs: "Legs",
  Abs: "Abs",
};

const DURATION_OPTIONS = [
  { value: 3, label: "3 أيام", days: ["DIM", "MAR", "VEN"] as WeekDay[] },
  { value: 5, label: "5 أيام", days: ["SAM", "DIM", "LUN", "MAR", "MER"] as WeekDay[] },
  { value: 7, label: "7 أيام", days: WEEK_DAYS },
  { value: 8, label: "٧ أيام + جميع الأيام", days: [...WEEK_DAYS, "TOUS_LES_JOURS" as WeekDay] },
] as const;

function ExerciseFormDialog({
  open,
  onOpenChange,
  data,
  onChange,
  onSubmit,
  curatedByCategory,
  activeDays,
  isEditing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: DraftExercise;
  onChange: (p: Partial<DraftExercise>) => void;
  onSubmit: () => void;
  curatedByCategory: Record<string, Exercise[]>;
  activeDays: readonly WeekDay[];
  isEditing: boolean;
}) {
  const [search, setSearch] = useState("");
  const curatedHit = data.nom
    ? (Object.values(curatedByCategory)
        .flat()
        .find((c: Exercise) => c.name.trim().toLowerCase() === data.nom.trim().toLowerCase()) as unknown as
        | { imageUrl: string | null; category: string | null }
        | undefined)
    : null;
  const guideExercise = data.nom ? getGuideExercise(data.nom) : null;
  const guideImageUrl = data.nom ? getGuideImageUrl(data.nom, 1) : null;
  const guideImageUrls = data.nom ? getGuideImageUrls(data.nom) : [];
  const instruction = data.nom ? getExerciseInstruction(data.nom) : null;
  const displayImage = guideImageUrl ?? data.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category ?? null) ?? null;

  const filteredByCategory = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result: Record<string, Exercise[]> = {};
    for (const cat of CATEGORY_ORDER) {
      const list = curatedByCategory[cat];
      if (!list?.length) continue;
      const filtered = q ? list.filter((ex) => ex.name.toLowerCase().includes(q)) : list;
      if (filtered.length) result[cat] = filtered;
    }
    return result;
  }, [curatedByCategory, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل التمرين" : "إضافة تمرين جديد"}</DialogTitle>
          <DialogDescription>اختر التمرين من القائمة المخصصة وحدد التفاصيل</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ex-day">اليوم</Label>
            <Select value={data.jour_semaine} onValueChange={(v) => onChange({ jour_semaine: v as WeekDay })}>
              <SelectTrigger id="ex-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeDays.map((d) => (
                  <SelectItem key={d} value={d}>
                    {WEEK_DAY_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-search">اسم التمرين *</Label>
            <Input
              id="ex-search"
              value={search || data.nom}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) onChange({ nom: "" });
              }}
              onFocus={() => setSearch("")}
              placeholder="البحث عن تمرين — اكتب اسم التمرين..."
            />
            <Select
              value={data.nom || ""}
              onValueChange={(v) => {
                const hit = Object.values(curatedByCategory)
                  .flat()
                  .find((c: Exercise) => c.name === v) as unknown as
                  | { name: string; imageUrl: string | null; category: string | null }
                  | undefined;
                const gUrl = getGuideImageUrl(v, 1);
                onChange({
                  nom: v,
                  image_url: gUrl ?? hit?.imageUrl ?? fallbackForCategory(hit?.category ?? null) ?? null,
                });
                setSearch("");
              }}
            >
              <SelectTrigger>
                {data.nom ? (
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded bg-white border">
                      {guideImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={guideImageUrl} alt="" className="size-4 object-contain invert" />
                      ) : curatedHit?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={curatedHit.imageUrl} alt="" className="size-4 object-contain" />
                      ) : (
                        <ImageIcon className="size-3 text-muted-foreground" />
                      )}
                    </span>
                    <span className="truncate">{data.nom}</span>
                  </span>
                ) : (
                  <SelectValue placeholder="أو اختر التمرين من القائمة" />
                )}
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.keys(filteredByCategory).length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</div>
                )}
                {Object.entries(filteredByCategory).map(([cat, list]) => (
                  <SelectGroup key={cat}>
                    <SelectLabel className="text-xs font-bold text-primary">
                      {CATEGORY_LABEL[cat]} ({list.length})
                    </SelectLabel>
                    {list.map((ex) => {
                      const gUrl = getGuideImageUrl(ex.name, 1);
                      const img = gUrl ?? ex.imageUrl ?? fallbackForCategory(ex.category);
                      const isGuide = !!gUrl;
                      return (
                        <SelectItem key={ex.id} value={ex.name}>
                          <span className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded bg-white border">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="" className={`size-5 object-contain ${isGuide ? "invert" : ""}`} />
                              ) : (
                                <ImageIcon className="size-3 text-muted-foreground" />
                              )}
                            </span>
                            <span>{ex.name}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-center gap-3">
            {guideImageUrls.length === 3 ? (
              <div className="rounded-xl border-2 border-border bg-white p-1 shadow-sm">
                <AnimatedExerciseImage urls={guideImageUrls} alt={data.nom || "exercice"} sizeClass="size-28" />
              </div>
            ) : (
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-white shadow-sm">
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayImage} alt={data.nom || "exercice"} className="h-full w-full object-contain p-1 invert" />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
            )}
            {guideExercise && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <Badge variant="secondary" className="text-[11px]">
                  {guideExercise.primaryMuscle}
                </Badge>
                {guideExercise.secondaryMuscles.map((m) => (
                  <Badge key={m} variant="outline" className="text-[11px]">
                    {m}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[11px]">
                  {guideExercise.equipment}
                </Badge>
              </div>
            )}
            {instruction && (
              <p className="max-w-[320px] rounded-lg bg-muted/50 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground">
                {instruction}
              </p>
            )}
            {!guideExercise && !instruction && data.nom && (
              <p className="text-center text-xs text-muted-foreground">Image et description automatiques depuis la bibliothèque</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-charge">الوزن / الحِمل (Charge)</Label>
              <Input id="ex-charge" value={data.charge ?? ""} onChange={(e) => onChange({ charge: e.target.value || null })} placeholder="15 kg" inputMode="decimal" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-series">عدد الجولات (Séries)</Label>
              <Input id="ex-series" value={data.series ?? ""} onChange={(e) => onChange({ series: e.target.value || null })} placeholder="4 3 2" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-tempo">الإيقاع الحركي (Tempo)</Label>
              <Input id="ex-tempo" value={data.tempo ?? ""} onChange={(e) => onChange({ tempo: e.target.value || null })} placeholder="3-1-3-1" dir="ltr" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-rest">فترة الراحة (Rest)</Label>
              <Input id="ex-rest" value={data.repos ?? ""} onChange={(e) => onChange({ repos: e.target.value || null })} placeholder="1 min entre série" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-reps">التكرارات (Reps)</Label>
            <Textarea
              id="ex-reps"
              value={data.repetitions ?? ""}
              onChange={(e) => onChange({ repetitions: e.target.value || null })}
              placeholder="سطر لكل جولة — مثال: ٦-١٢ تكرار حتى الإخفاق العضلي"
              maxLength={300}
              rows={3}
              className="text-sm leading-4"
            />
            <p className="text-xs text-muted-foreground">سطر لكل جولة: ٦-١٢ حتى الإخفاق، {">"}١٢ زيادة الحمل، {"<"}٥ تخفيف الحمل</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onSubmit} disabled={!data.nom.trim()}>
            {isEditing ? "حفظ التعديل" : "إضافة التمرين"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkoutPlanEditor({ userId }: { userId: string }) {
  const { data: plan, isLoading } = useWorkoutPlan(userId);
  const createPlan = useCreateWorkoutPlan(userId);
  const updatePlan = useUpdateWorkoutPlan(userId);
  const { data: curatedAll } = useLocalExercises("");

  const curatedByCategory = useMemo(() => {
    if (!curatedAll?.length) return {} as Record<string, Exercise[]>;
    const grouped: Record<string, Exercise[]> = {};
    for (const ex of curatedAll) {
      const cat = ex.category ?? "Autre";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ex);
    }
    return grouped;
  }, [curatedAll]);

  const findCuratedByName = (name: string) =>
    curatedAll?.find((c: Exercise) => c.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;

  const initial = useMemo(() => draftFromPlan(plan ?? null), [plan]);
  const [titre, setTitre] = useState(initial.titre);
  const [objectif, setObjectif] = useState<PlanObjective>(initial.objectif);
  const [exercises, setExercises] = useState<DraftExercise[]>(initial.exercises);
  const [day, setDay] = useState<WeekDay>(todayWeekDay());

  const [duree, setDuree] = useState<3 | 5 | 7 | 8>(() => {
    if (!plan) return 7;
    const daysInPlan = new Set(plan.exercises.map((e) => e.jour_semaine));
    if (daysInPlan.has("TOUS_LES_JOURS")) return 8;
    return daysInPlan.size <= 3 ? 3 : daysInPlan.size <= 5 ? 5 : 7;
  });

  const activeDays = useMemo(() => {
    const opt = DURATION_OPTIONS.find((o) => o.value === duree);
    return opt ? opt.days : WEEK_DAYS;
  }, [duree]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [formData, setFormData] = useState<DraftExercise>(emptyExercise(todayWeekDay()));
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);

  useEffect(() => {
    setTitre(initial.titre);
    setObjectif(initial.objectif);
    setExercises(initial.exercises);
  }, [initial.titre, initial.objectif, initial.exercises]);

  const saving = createPlan.isPending || updatePlan.isPending;

  const dirty = useMemo(
    () => JSON.stringify({ titre, objectif, exercises }) !== JSON.stringify(initial),
    [titre, objectif, exercises, initial],
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

  const openAddForm = () => {
    setFormData(emptyExercise(day));
    setEditingIdx(null);
    setFormOpen(true);
  };

  const openEditForm = (idx: number) => {
    setFormData({ ...exercises[idx] });
    setEditingIdx(idx);
    setFormOpen(true);
  };

  const handleFormSubmit = () => {
    if (!formData.nom.trim()) {
      toast.error("اختر اسم التمرين");
      return;
    }
    const hit = findCuratedByName(formData.nom);
    const guideUrl = getGuideImageUrl(formData.nom, 1);
    const finalImage = guideUrl ?? formData.image_url ?? hit?.imageUrl ?? fallbackForCategory(hit?.category ?? null) ?? null;
    const toSave: DraftExercise = {
      ...formData,
      key: editingIdx !== null ? exercises[editingIdx].key : newKey(),
      image_url: finalImage,
    };
    if (editingIdx !== null) {
      setExercises((rows) => rows.map((r, i) => (i === editingIdx ? toSave : r)));
    } else {
      setExercises((rows) => [...rows, toSave]);
    }
    setFormOpen(false);
    setEditingIdx(null);
  };

  const remove = (idx: number) =>
    setExercises((rows) => rows.filter((_, i) => i !== idx));

  const duplicateExercise = (idx: number) => {
    const src = exercises[idx];
    const dup: DraftExercise = { ...src, key: newKey() };
    setExercises((rows) => {
      const next = [...rows];
      next.splice(idx + 1, 0, dup);
      return next;
    });
    toast.success("تم نسخ التمرين");
  };

  const handleSave = async () => {
    const rows = exercises.filter((e) => e.nom.trim());
    if (!rows.length) {
      toast.error("يُرجى إضافة تمرين واحد على الأقل");
      return;
    }
    const payload = {
      titre: titre.trim() || "خطة تمارين",
      objectif,
      exercises: rows.map((e) => ({
        jour_semaine: e.jour_semaine,
        nom: e.nom,
        charge: e.charge,
        repetitions: e.repetitions,
        series: e.series,
        tempo: e.tempo,
        repos: e.repos,
        groupe_musculaire: null,
        notes: e.notes,
        image_url: getGuideImageUrl(e.nom, 1) ?? e.image_url ?? findCuratedByName(e.nom)?.imageUrl ?? fallbackForCategory(findCuratedByName(e.nom)?.category) ?? null,
      })),
    };
    try {
      if (plan) {
        await updatePlan.mutateAsync(payload);
        toast.success(`تم تحديث خطة التمارين بنجاح (الإصدار ${plan.version + 1})`);
      } else {
        await createPlan.mutateAsync(payload);
        toast.success("تم إنشاء خطة تمارين جديدة بنجاح");
      }
    } catch {
      toast.error("تعذّر حفظ الخطة — يُرجى المحاولة مرة أخرى");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const dayRows = exercises
    .map((e, idx) => ({ e, idx }))
    .filter(({ e }) => e.jour_semaine === day);

  const today = todayWeekDay();

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-30 flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-background/90 px-3 py-2 backdrop-blur">
        {plan ? (
          <Badge variant="outline" className="me-auto tabular-nums">
            الإصدار {plan.version}
          </Badge>
        ) : (
          <Badge variant="outline" className="me-auto">
            جديدة
          </Badge>
        )}
        <CopyTemplateDialog userId={userId} />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {plan ? "حفظ التعديلات" : "إنشاء الخطة"}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>عنوان الخطة</Label>
              <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="خطة تمارين" />
            </div>
            <div className="space-y-1.5">
              <Label>الهدف</Label>
              <Select value={objectif} onValueChange={(v) => setObjectif(v as PlanObjective)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(OBJECTIVE_LABELS) as PlanObjective[]).map((o) => (
                    <SelectItem key={o} value={o}>
                      {OBJECTIVE_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Calendar className="size-3.5" /> مدة البرنامج
              </Label>
              <Select value={String(duree)} onValueChange={(v) => setDuree(Number(v) as 3 | 5 | 7 | 8)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={day} onValueChange={(v) => setDay(v as WeekDay)}>
            <TabsList
              variant="line"
              aria-label="أيام التمارين"
              className="w-full justify-start gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-none border-b bg-transparent p-0 h-auto"
            >
              {activeDays.map((d) => {
                const count = exercises.filter((e) => e.jour_semaine === d || (d === "TOUS_LES_JOURS" && e.jour_semaine === "TOUS_LES_JOURS")).length;
                const isActive = d === day;
                const isToday = d === today;
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

            <TabsContent value={day} className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  تمارين يوم {WEEK_DAY_LABELS[day]}
                  {day === "TOUS_LES_JOURS" && <span className="ms-2 text-xs text-muted-foreground">(تُطبّق في جميع الأيام)</span>}
                </h3>
                <Button size="sm" onClick={openAddForm}>
                  <Plus /> إضافة تمرين
                </Button>
              </div>

              {!dayRows.length ? (
                <div className="py-10">
                  <EmptyState
                    title={`لا توجد تمارين مسجلة ليوم ${WEEK_DAY_LABELS[day]}`}
                    description="أضف تمرينًا باستخدام زر الإضافة أعلاه"
                    action={
                      <Button onClick={openAddForm}>
                        <Plus /> إضافة تمرين
                      </Button>
                    }
                  />
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto rounded-xl border md:block">
                    <table className="w-full min-w-[860px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={TH}>التمرين</th>
                          <th className={TH}>الصورة</th>
                          <th className={TH}>الحمل (كغم)</th>
                          <th className={TH}>التكرارات</th>
                          <th className={TH}>الجولات</th>
                          <th className={TH}>الإيقاع</th>
                          <th className={TH}>الراحة</th>
                          <th className={`${TH} w-20`} />
                        </tr>
                      </thead>
                      <tbody>
                        {dayRows.map(({ e, idx }) => {
                          const curatedHit = findCuratedByName(e.nom);
                          const guideUrl = getGuideImageUrl(e.nom, 1);
                          const displayImage = guideUrl ?? e.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category) ?? null;
                          return (
                             <tr key={e.key} className="animate-fade-in align-top transition-colors hover:bg-primary/5">
                                <td className={`${TD} font-semibold`}>
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="size-4 cursor-grab text-muted-foreground/60" aria-hidden="true" />
                                    {e.nom}
                                  </div>
                                </td>
                               <td className={TD}>
                                <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-white p-1">
                                  {(() => {
                                    const urls = getGuideImageUrls(e.nom);
                                    if (urls.length === 3) {
                                      return <AnimatedExerciseImage urls={urls} alt={e.nom} sizeClass="size-12" intervalMs={600} />;
                                    }
                                    return displayImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={displayImage} alt={e.nom} className="h-full w-full object-contain p-0.5 invert" />
                                    ) : (
                                      <ImageIcon className="size-5 text-muted-foreground" />
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className={`${TD} tabular-nums`}>{e.charge ?? "—"}</td>
                              <td className={`${TD} whitespace-pre-line text-xs leading-4`}>{e.repetitions ?? "—"}</td>
                              <td className={`${TD} tabular-nums`}>{e.series ?? "—"}</td>
                              <td className={`${TD} font-mono text-xs`}>{e.tempo ?? "—"}</td>
                              <td className={`${TD} text-xs`}>{e.repos ?? "—"}</td>
                              <td className={TD}>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditForm(idx)}>
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="size-8" onClick={() => duplicateExercise(idx)}>
                                    <Copy className="size-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setRemoveIdx(idx)}>
                                    <Trash2 className="size-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {dayRows.map(({ e, idx }) => {
                      const curatedHit = findCuratedByName(e.nom);
                      const guideUrl = getGuideImageUrl(e.nom, 1);
                      const displayImage = guideUrl ?? e.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category) ?? null;
                      const guideEx = getGuideExercise(e.nom);
                      const instruction = getExerciseInstruction(e.nom);
                      return (
                         <div key={e.key} className="space-y-3 rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md">
                          <div className="flex items-start justify-between gap-2">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 font-bold">
                                  <GripVertical className="size-4 text-muted-foreground/60" aria-hidden="true" />
                                  {e.nom}
                                </div>
                                {guideEx && (
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="secondary" className="text-[10px]">{guideEx.primaryMuscle}</Badge>
                                    <Badge variant="outline" className="text-[10px]">{guideEx.equipment}</Badge>
                                  </div>
                                )}
                              </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditForm(idx)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => duplicateExercise(idx)}>
                                <Copy className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => setRemoveIdx(idx)}>
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border bg-white p-1">
                              {(() => {
                                const urls = getGuideImageUrls(e.nom);
                                if (urls.length === 3) {
                                  return <AnimatedExerciseImage urls={urls} alt={e.nom} sizeClass="size-20" intervalMs={600} />;
                                }
                                return displayImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={displayImage} alt={e.nom} className="h-full w-full object-contain p-1 invert" />
                                ) : (
                                  <ImageIcon className="size-6 text-muted-foreground" />
                                );
                              })()}
                            </div>
                          </div>
                          {instruction && (
                            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">{instruction}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">الحمل</div>
                              <div className="font-medium">{e.charge ?? "—"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">الجولات</div>
                              <div>{e.series ?? "—"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">الإيقاع</div>
                              <div className="font-mono text-xs">{e.tempo ?? "—"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">الراحة</div>
                              <div>{e.repos ?? "—"}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2 text-sm">
                            <div className="text-xs text-muted-foreground">التكرارات</div>
                            <div className="whitespace-pre-line text-xs leading-4">{e.repetitions ?? "—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          <div className="flex justify-center border-t pt-4">
            <Button size="lg" onClick={handleSave} disabled={saving} className="w-full sm:w-auto min-w-[200px] gap-2 text-base">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {plan ? "حفظ التعديلات" : "إنشاء الخطة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExerciseFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingIdx(null);
        }}
        data={formData}
        onChange={(p) => setFormData((prev) => ({ ...prev, ...p }))}
        onSubmit={handleFormSubmit}
        curatedByCategory={curatedByCategory}
        activeDays={activeDays}
        isEditing={editingIdx !== null}
      />

      <AlertDialog open={removeIdx !== null} onOpenChange={(o) => { if (!o) setRemoveIdx(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التمرين</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد حذف التمرين &laquo;{removeIdx !== null ? exercises[removeIdx]?.nom : ""}&raquo;؟ هذا الإجراء لا رجعة فيه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeIdx !== null) remove(removeIdx);
                setRemoveIdx(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CopyTemplateDialog({ userId }: { userId: string }) {
  const { data: templates, isLoading } = useWorkoutTemplates();
  const duplicate = useDuplicateWorkoutPlan(userId);
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);

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
          <DialogTitle>نسخ خطة تمارين كنقطة بداية</DialogTitle>
          <DialogDescription>اختر قالبًا جاهزًا أو خطة لمشترك آخر، ثم عدّلها بما يناسب هذا المشترك.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isLoading && <Skeleton className="h-10" />}
          {!isLoading && templates?.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">لا توجد خطط متاحة للنسخ حاليًا.</p>
          )}
          {presets.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Dumbbell className="size-3.5" />
                قوالب جاهزة
              </div>
              {presets.map((t) => (
                <TemplateRow key={t.id} template={t} selected={selected === t.id} onSelect={() => setSelected(t.id)} />
              ))}
            </>
          )}
          {members.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 pt-2 text-xs font-semibold text-muted-foreground">
                <Users className="size-3.5" />
                خطط المشتركين
              </div>
              {members.map((t) => (
                <TemplateRow key={t.id} template={t} selected={selected === t.id} onSelect={() => setSelected(t.id)} />
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={run} disabled={!selected || duplicate.isPending}>
            نسخ الخطة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateRow({
  template: t,
  selected,
  onSelect,
}: {
  template: {
    id: string;
    titre: string;
    objectif: PlanObjective;
    version: number;
    updated_at: string;
    user_name: string;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-start transition-colors ${
        selected ? "border-primary bg-primary/10" : "hover:bg-muted/50"
      }`}
    >
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold">{t.titre}</div>
        <div className="truncate text-xs text-muted-foreground">
          {OBJECTIVE_LABELS[t.objectif]} · الإصدار {t.version}
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {formatDateShort(t.updated_at)}
      </Badge>
    </button>
  );
}
