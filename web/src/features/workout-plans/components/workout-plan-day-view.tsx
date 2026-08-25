"use client";

import { ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WeekDay } from "@/shared/lib/domain";
import type { WorkoutExercise } from "@/features/workout-plans/api/workoutPlans.api";
import { useLocalExercises } from "@/features/exercises/hooks/useExercises";
import { fallbackForCategory } from "@/shared/lib/exercise-fallbacks";

const TH = "whitespace-nowrap border-b bg-muted/50 px-3 py-2 text-xs font-bold text-muted-foreground";
const TD = "border-b px-3 py-2.5 align-top text-sm";

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
    e.image_url ?? getSystemImage(e.nom) ?? fallbackForCategory(findCurated(e.nom)?.category) ?? null;

  const rows = [
    ...exercises.filter((e) => e.jour_semaine === day),
    ...exercises.filter((e) => e.jour_semaine === "TOUS_LES_JOURS"),
  ];

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          لا يوجد تمارين في هذا اليوم — استراحة 🧘
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className={TH}>Nom exercice</th>
              <th className={TH}>image</th>
              <th className={TH}>charge</th>
              <th className={TH}>reps</th>
              <th className={TH}>Nbre serie</th>
              <th className={TH}>tempo</th>
              <th className={TH}>rest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const img = displayImage(e);
              return (
                <tr key={e.id} className="hover:bg-muted/20">
                  <td className={`${TD} font-semibold`}>{e.nom}</td>
                  <td className={TD}>
                    <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={e.nom}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          crossOrigin="anonymous"
                          onError={(ev) => {
                            (ev.target as HTMLImageElement).style.display = "none";
                          }}
                        />
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((e) => {
          const img = displayImage(e);
          return (
            <div key={e.id} className="rounded-xl border p-3">
              <div className="font-bold">{e.nom}</div>
              <div className="mt-2 flex justify-center">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={e.nom} className="h-full w-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
              <div className="mt-2 rounded-lg bg-muted/50 p-2 text-sm">
                <div className="text-xs text-muted-foreground">reps</div>
                <div className="whitespace-pre-line text-xs leading-4">{e.repetitions ?? "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
