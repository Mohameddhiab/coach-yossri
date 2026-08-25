"use client";
/* eslint-disable react-hooks/set-state-in-effect -- sync form from server plan */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Copy,
  Dumbbell,
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

const TH = "whitespace-nowrap border-b bg-muted/60 px-2 py-2 text-xs font-bold text-muted-foreground";
const TD = "border-b px-1.5 py-1.5 align-top";

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
  { value: 8, label: "7 + كل الأيام", days: [...WEEK_DAYS, "TOUS_LES_JOURS" as WeekDay] },
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
  const displayImage = data.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category ?? null) ?? null;

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
            <Label>اليوم</Label>
            <Select value={data.jour_semaine} onValueChange={(v) => onChange({ jour_semaine: v as WeekDay })}>
              <SelectTrigger>
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
            <Label>Nom exercice *</Label>
            <Input
              value={search || data.nom}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) onChange({ nom: "" });
              }}
              onFocus={() => setSearch("")}
              placeholder="ابحث بالاسم..."
              className="mb-1"
            />
            <Select
              value={data.nom || ""}
              onValueChange={(v) => {
                const hit = Object.values(curatedByCategory)
                  .flat()
                  .find((c: Exercise) => c.name === v) as unknown as
                  | { name: string; imageUrl: string | null; category: string | null }
                  | undefined;
                onChange({
                  nom: v,
                  image_url: hit?.imageUrl ?? fallbackForCategory(hit?.category ?? null) ?? null,
                });
                setSearch("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر تمرينًا من القائمة" />
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
                    {list.map((ex) => (
                      <SelectItem key={ex.id} value={ex.name}>
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt={data.nom || "exercice"} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>charge</Label>
              <Input value={data.charge ?? ""} onChange={(e) => onChange({ charge: e.target.value || null })} placeholder="15 kg" />
            </div>
            <div className="space-y-1.5">
              <Label>Nbre serie</Label>
              <Input value={data.series ?? ""} onChange={(e) => onChange({ series: e.target.value || null })} placeholder="4 3 2" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>tempo</Label>
              <Input value={data.tempo ?? ""} onChange={(e) => onChange({ tempo: e.target.value || null })} placeholder="3-1-3-1" dir="ltr" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>rest</Label>
              <Input value={data.repos ?? ""} onChange={(e) => onChange({ repos: e.target.value || null })} placeholder="1 min entre série" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>reps</Label>
            <Textarea
              value={data.repetitions ?? ""}
              onChange={(e) => onChange({ repetitions: e.target.value || null })}
              placeholder="Entre 6 et 12 échec&#10;Si >12 augmente charge&#10;Si <5 Diminue charge"
              rows={3}
              className="text-sm leading-4"
            />
          </div>
        </div>
        <DialogFooter>
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
    const finalImage = formData.image_url ?? hit?.imageUrl ?? fallbackForCategory(hit?.category ?? null) ?? null;
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
      toast.error("أضف تمرينًا واحدًا على الأقل");
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
        image_url: e.image_url ?? findCuratedByName(e.nom)?.imageUrl ?? fallbackForCategory(findCuratedByName(e.nom)?.category) ?? null,
      })),
    };
    try {
      if (plan) {
        await updatePlan.mutateAsync(payload);
        toast.success(`تحنّت خطة التمارين ✓ (الإصدار ${plan.version + 1})`);
      } else {
        await createPlan.mutateAsync(payload);
        toast.success("تصنعت خطة تمارين جديدة ✓");
      }
    } catch {
      toast.error("تعذر حفظ الخطة — حاول مرة أخرى");
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
          <Badge variant="secondary" className="me-auto">
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
                          className={`ms-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
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

            <TabsContent value={day} className="pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  تمارين يوم {WEEK_DAY_LABELS[day]}
                  {day === "TOUS_LES_JOURS" && <span className="ms-2 text-xs text-muted-foreground">(تُطبّق كل يوم)</span>}
                </h3>
                <Button size="sm" onClick={openAddForm}>
                  <Plus /> إضافة تمرين
                </Button>
              </div>

              {!dayRows.length ? (
                <EmptyState
                  title={`لا يوجد تمارين يوم ${WEEK_DAY_LABELS[day]}`}
                  description="أضف تمرينًا من النموذج"
                  action={
                    <Button onClick={openAddForm}>
                      <Plus /> أضف تمرين
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto rounded-xl border md:block">
                    <table className="w-full min-w-[860px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={TH}>Nom exercice</th>
                          <th className={TH}>image</th>
                          <th className={TH}>charge</th>
                          <th className={TH}>reps</th>
                          <th className={TH}>Nbre serie</th>
                          <th className={TH}>tempo</th>
                          <th className={TH}>rest</th>
                          <th className={`${TH} w-20`} />
                        </tr>
                      </thead>
                      <tbody>
                        {dayRows.map(({ e, idx }) => {
                          const curatedHit = findCuratedByName(e.nom);
                          const displayImage = e.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category) ?? null;
                          return (
                            <tr key={e.key} className="align-top hover:bg-muted/20">
                              <td className={`${TD} font-semibold`}>{e.nom}</td>
                              <td className={TD}>
                                <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                  {displayImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={displayImage} alt={e.nom} className="h-full w-full object-cover" />
                                  ) : (
                                    <ImageIcon className="size-5 text-muted-foreground" />
                                  )}
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
                      const displayImage = e.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category) ?? null;
                      return (
                        <div key={e.key} className="space-y-3 rounded-xl border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold">{e.nom}</div>
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
                            <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                              {displayImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={displayImage} alt={e.nom} className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="size-6 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">charge</div>
                              <div className="font-medium">{e.charge ?? "—"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">Nbre serie</div>
                              <div>{e.series ?? "—"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">tempo</div>
                              <div className="font-mono text-xs">{e.tempo ?? "—"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">rest</div>
                              <div>{e.repos ?? "—"}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2 text-sm">
                            <div className="text-xs text-muted-foreground">reps</div>
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
      toast.success("تم نسخ الخطة كنقطة بداية — عدّلها ثم احفظ");
      setOpen(false);
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy />
          انسخ من خطة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>نسخ خطة تمارين كنقطة بداية</DialogTitle>
          <DialogDescription>اختر قالب جاهز أو خطة لعضو آخر، ثم عدّلها لهذا العضو.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isLoading && <Skeleton className="h-10" />}
          {!isLoading && templates?.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد خطط لنسخها حاليًا.</p>
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
                خطط الأعضاء
              </div>
              {members.map((t) => (
                <TemplateRow key={t.id} template={t} selected={selected === t.id} onSelect={() => setSelected(t.id)} />
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={run} disabled={!selected || duplicate.isPending}>
            انسخ الخطة
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
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {formatDateShort(t.updated_at)}
      </Badge>
    </button>
  );
}
