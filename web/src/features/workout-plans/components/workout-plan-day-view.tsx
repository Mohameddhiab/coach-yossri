"use client";

import { Dumbbell, ImageIcon, Weight, Repeat, Layers, Timer, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WeekDay } from "@/shared/lib/domain";
import { WEEK_DAY_LABELS } from "@/shared/lib/domain";
import type { WorkoutExercise } from "@/features/workout-plans/api/workoutPlans.api";
import { useLocalExercises } from "@/features/exercises/hooks/useExercises";
import { fallbackForCategory } from "@/shared/lib/exercise-fallbacks";
import { getGuideExercise, getGuideImageUrl, getGuideImageUrls } from "@/shared/lib/exercise-guide-map";
import { getExerciseInstruction } from "@/shared/lib/exercise-instructions";
import { AnimatedExerciseImage } from "@/shared/components/animated-exercise-image";

export function WorkoutPlanDayView({
  day,
  exercises,
}: {
  day: WeekDay;
  exercises: WorkoutExercise[];
}) {
  const { data: library } = useLocalExercises("");
  const getSystemImage = (nom: string): string | null => {
    const q = nom.trim().toLowerCase();
    if (!q || !library?.length) return null;
    const hit = library.find((l) => l.name.trim().toLowerCase() === q);
    return hit?.imageUrl ?? hit?.imageThumbUrl ?? null;
  };

  const findCurated = (nom: string) =>
    library?.find((l) => l.name.trim().toLowerCase() === nom.trim().toLowerCase()) ?? null;

  const displayImage = (e: WorkoutExercise): string | null =>
    getGuideImageUrl(e.nom, 1) ?? e.image_url ?? getSystemImage(e.nom) ?? fallbackForCategory(findCurated(e.nom)?.category) ?? null;

  const rows = [
    ...exercises.filter((e) => e.jour_semaine === day),
    ...exercises.filter((e) => e.jour_semaine === "TOUS_LES_JOURS"),
  ];

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <Dumbbell className="size-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">لا تمارين اليوم</p>
          <p className="mt-1 text-xs text-muted-foreground">
            استراحة — {WEEK_DAY_LABELS[day]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((e, idx) => {
        const img = displayImage(e);
        const guideEx = getGuideExercise(e.nom);
        const instruction = getExerciseInstruction(e.nom);
        return (
          <div
            key={e.id}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_4px_24px_-8px_rgba(245,158,11,0.15)] hover:-translate-y-0.5"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* subtle accent line */}
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-white p-1 shadow-sm">
                {(() => {
                  const urls = getGuideImageUrls(e.nom);
                  if (urls.length === 3) {
                    return <AnimatedExerciseImage urls={urls} alt={e.nom} sizeClass="size-16" intervalMs={650} />;
                  }
                  return img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={e.nom}
                      className="size-16 object-contain invert p-1"
                      loading="lazy"
                      crossOrigin="anonymous"
                      onError={(ev) => {
                        (ev.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground/30" />
                  );
                })()}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-black leading-tight text-foreground">{e.nom}</h4>
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    #{idx + 1}
                  </span>
                </div>

                {guideEx && (
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-xs px-2 py-0">
                      {guideEx.primaryMuscle}
                    </Badge>
                    {guideEx.secondaryMuscles.slice(0, 2).map((m) => (
                      <Badge key={m} variant="outline" className="text-xs border-border/60 text-muted-foreground px-1.5 py-0">
                        {m}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs bg-card border-amber-500/20 text-amber-600 dark:text-amber-400">
                      {guideEx.equipment}
                    </Badge>
                  </div>
                )}

                {instruction && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {instruction}
                  </p>
                )}
              </div>
            </div>

            {/* prescription pills */}
            <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border/40 pt-3">
              <div className="rounded-xl bg-muted/40 px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Weight className="size-3" /> الحمل
                </div>
                <div className="mt-1 text-sm font-black tabular-nums text-foreground">{e.charge ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Repeat className="size-3" /> تكرار
                </div>
                <div className="mt-1 whitespace-pre-line text-xs font-bold leading-tight text-foreground">{e.repetitions ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Layers className="size-3" /> مجموعات
                </div>
                <div className="mt-1 text-sm font-black tabular-nums text-foreground">{e.series ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Timer className="size-3" /> راحة
                </div>
                <div className="mt-1 text-xs font-bold text-foreground">{e.repos ?? e.tempo ?? "—"}</div>
              </div>
            </div>

            {e.tempo && e.repos && (
              <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="size-3" />
                  tempo {e.tempo}
                </span>
                <span className="size-1 rounded-full bg-border" />
                <span>راحة {e.repos}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
