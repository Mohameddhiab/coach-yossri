"use client";
/* eslint-disable react-hooks/set-state-in-effect -- sync form from server plan */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Dumbbell,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed,
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

export function WorkoutPlanEditor({ userId }: { userId: string }) {
  const { data: plan, isLoading } = useWorkoutPlan(userId);
  const createPlan = useCreateWorkoutPlan(userId);
  const updatePlan = useUpdateWorkoutPlan(userId);
  const { data: curatedAll } = useLocalExercises("");

  const curatedByCategory = useMemo(() => {
    if (!curatedAll?.length) return {} as Record<string, typeof curatedAll>;
    const grouped: Record<string, typeof curatedAll> = {};
    for (const ex of curatedAll) {
      const cat = ex.category ?? "Autre";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ex);
    }
    // trier selon CATEGORY_ORDER
    return grouped;
  }, [curatedAll]);

  const findCuratedByName = (name: string) =>
    curatedAll?.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;

  const initial = useMemo(() => draftFromPlan(plan ?? null), [plan]);
  const [titre, setTitre] = useState(initial.titre);
  const [objectif, setObjectif] = useState<PlanObjective>(initial.objectif);
  const [exercises, setExercises] = useState<DraftExercise[]>(initial.exercises);
  const [day, setDay] = useState<WeekDay>(todayWeekDay());

  // sync when plan loads / changes
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

  const addRow = () => setExercises((rows) => [...rows, emptyExercise(day)]);

  const patch = (idx: number, p: Partial<DraftExercise>) =>
    setExercises((rows) => rows.map((r, i) => (i === idx ? { ...r, ...p } : r)));

  const remove = (idx: number) =>
    setExercises((rows) => rows.filter((_, i) => i !== idx));

  const handleSelectExercise = (idx: number, selectedName: string) => {
    const hit = findCuratedByName(selectedName);
    if (hit) {
      patch(idx, {
        nom: hit.name,
        image_url: hit.imageUrl ?? fallbackForCategory(hit.category) ?? null,
      });
    } else {
      patch(idx, { nom: selectedName });
    }
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <Tabs value={day} onValueChange={(v) => setDay(v as WeekDay)}>
            <TabsList
              variant="line"
              className="w-full justify-start gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-none border-b bg-transparent p-0 h-auto"
            >
              {WEEK_DAYS.map((d) => {
                const count = exercises.filter((e) => e.jour_semaine === d).length;
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
              {!dayRows.length ? (
                <EmptyState
                  title={`لا يوجد تمارين يوم ${WEEK_DAY_LABELS[day]}`}
                  description="أضف تمرينًا من القائمة المخصصة"
                  action={
                    <Button onClick={addRow}>
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
                          <th className={`${TH} w-10`} />
                        </tr>
                      </thead>
                      <tbody>
                        {dayRows.map(({ e, idx }) => {
                          const curatedHit = findCuratedByName(e.nom);
                          const displayImage = e.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category) ?? null;
                          const isFallback = !e.image_url && !!displayImage;
                          const isCustomValue = e.nom && !curatedHit;
                          return (
                            <tr key={e.key} className="align-top">
                              <td className={TD}>
                                <div className="min-w-[200px]">
                                  <Select
                                    value={curatedHit ? e.nom : e.nom ? "__custom__" : ""}
                                    onValueChange={(v) => {
                                      if (v === "__custom__") return;
                                      handleSelectExercise(idx, v);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm font-medium">
                                      <SelectValue placeholder="اختر تمرينًا" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80">
                                      {isCustomValue && (
                                        <SelectItem value="__custom__" disabled>
                                          {e.nom} (مخصص)
                                        </SelectItem>
                                      )}
                                      {CATEGORY_ORDER.map((cat) => {
                                        const list = curatedByCategory[cat];
                                        if (!list?.length) return null;
                                        return (
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
                                        );
                                      })}
                                      {/* Autres sans catégorie */}
                                      {Object.keys(curatedByCategory)
                                        .filter((c) => !CATEGORY_ORDER.includes(c as never))
                                        .map((cat) => (
                                          <SelectGroup key={cat}>
                                            <SelectLabel>{cat}</SelectLabel>
                                            {(curatedByCategory[cat] ?? []).map((ex) => (
                                              <SelectItem key={ex.id} value={ex.name}>
                                                {ex.name}
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </td>
                              <td className={TD}>
                                <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                  {displayImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={displayImage}
                                      alt={e.nom || "exercice"}
                                      className={`h-full w-full object-cover ${isFallback ? "opacity-90" : ""}`}
                                      onError={(ev) => {
                                        (ev.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <ImageIcon className="size-5 text-muted-foreground" />
                                  )}
                                </div>
                              </td>
                              <td className={TD}>
                                <Input
                                  value={e.charge ?? ""}
                                  onChange={(ev) => patch(idx, { charge: ev.target.value || null })}
                                  placeholder="15 kg"
                                  className="h-8 min-w-[80px]"
                                />
                              </td>
                              <td className={TD}>
                                <Textarea
                                  value={e.repetitions ?? ""}
                                  onChange={(ev) => patch(idx, { repetitions: ev.target.value || null })}
                                  placeholder="Entre 6 et 12 échec&#10;Si >12 augmente charge&#10;Si <5 Diminue charge"
                                  rows={3}
                                  className="min-h-[72px] min-w-[160px] text-xs leading-4"
                                />
                              </td>
                              <td className={TD}>
                                <Input
                                  value={e.series ?? ""}
                                  onChange={(ev) => patch(idx, { series: ev.target.value || null })}
                                  placeholder="4 3 2"
                                  dir="ltr"
                                  className="h-8 min-w-[70px] tabular-nums"
                                />
                              </td>
                              <td className={TD}>
                                <Input
                                  value={e.tempo ?? ""}
                                  onChange={(ev) => patch(idx, { tempo: ev.target.value || null })}
                                  placeholder="3-1-3-1"
                                  dir="ltr"
                                  className="h-8 min-w-[90px] font-mono text-xs"
                                />
                              </td>
                              <td className={TD}>
                                <Input
                                  value={e.repos ?? ""}
                                  onChange={(ev) => patch(idx, { repos: ev.target.value || null })}
                                  placeholder="1 min entre série"
                                  className="h-8 min-w-[120px] text-xs"
                                />
                              </td>
                              <td className={TD}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="حذف"
                                  onClick={() => remove(idx)}
                                  className="size-8"
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile stacked */}
                  <div className="space-y-3 md:hidden">
                    {dayRows.map(({ e, idx }) => {
                      const curatedHit = findCuratedByName(e.nom);
                      const displayImage = e.image_url ?? curatedHit?.imageUrl ?? fallbackForCategory(curatedHit?.category) ?? null;
                      const isFallback = !e.image_url && !!displayImage;
                      const isCustomValue = e.nom && !curatedHit;
                      return (
                        <div key={e.key} className="space-y-2.5 rounded-xl border p-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Nom exercice</Label>
                            <Select
                              value={curatedHit ? e.nom : e.nom ? "__custom__" : ""}
                              onValueChange={(v) => {
                                if (v === "__custom__") return;
                                handleSelectExercise(idx, v);
                              }}
                            >
                              <SelectTrigger className="h-9 font-medium">
                                <SelectValue placeholder="اختر تمرينًا" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {isCustomValue && (
                                  <SelectItem value="__custom__" disabled>
                                    {e.nom} (مخصص)
                                  </SelectItem>
                                )}
                                {CATEGORY_ORDER.map((cat) => {
                                  const list = curatedByCategory[cat];
                                  if (!list?.length) return null;
                                  return (
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
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                              {displayImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={displayImage}
                                  alt={e.nom || "exercice"}
                                  className={`h-full w-full object-cover ${isFallback ? "opacity-90" : ""}`}
                                />
                              ) : (
                                <ImageIcon className="size-6 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">charge</Label>
                              <Input value={e.charge ?? ""} onChange={(ev) => patch(idx, { charge: ev.target.value || null })} placeholder="15 kg" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Nbre serie</Label>
                              <Input value={e.series ?? ""} onChange={(ev) => patch(idx, { series: ev.target.value || null })} placeholder="4 3 2" dir="ltr" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">tempo</Label>
                              <Input value={e.tempo ?? ""} onChange={(ev) => patch(idx, { tempo: ev.target.value || null })} placeholder="3-1-3-1" dir="ltr" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">rest</Label>
                              <Input value={e.repos ?? ""} onChange={(ev) => patch(idx, { repos: ev.target.value || null })} placeholder="1 min entre série" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">reps</Label>
                            <Textarea
                              value={e.repetitions ?? ""}
                              onChange={(ev) => patch(idx, { repetitions: ev.target.value || null })}
                              placeholder="Entre 6 et 12 échec — Si >12 augmente charge — Si <5 Diminue charge"
                              rows={3}
                              className="text-xs"
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => remove(idx)} className="h-8 w-full">
                            <Trash2 className="size-4 text-destructive" /> حذف
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <Button variant="outline" onClick={addRow} className="mt-3">
                    <Plus /> أضف تمرين
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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
                <UtensilsCrossed className="size-3.5" />
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
          {OBJECTIVE_LABELS[t.objectif]} • الإصدار {t.version}
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {formatDateShort(t.updated_at)}
      </Badge>
    </button>
  );
}
