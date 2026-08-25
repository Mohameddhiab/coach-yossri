"use client";

import { ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WeekDay } from "@/shared/lib/domain";
import type { WorkoutExercise } from "@/features/workout-plans/api/workoutPlans.api";
import { useLocalExercises } from "@/features/exercises/hooks/useExercises";

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
    <div className="overflow-x-auto rounded-xl border">
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
          {rows.map((e) => (
            <tr key={e.id} className="hover:bg-muted/20">
              <td className={`${TD} font-semibold`}>{e.nom}</td>
              <td className={TD}>
                {(() => {
                  const displayImage = e.image_url ?? getSystemImage(e.nom);
                  return (
                    <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                      {displayImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayImage}
                          alt={e.nom}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(ev) => {
                            (ev.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageIcon className="size-5 text-muted-foreground" />
                      )}
                    </div>
                  );
                })()}
              </td>
              <td className={`${TD} tabular-nums`}>{e.charge ?? "—"}</td>
              <td className={`${TD} whitespace-pre-line text-xs leading-4`}>{e.repetitions ?? "—"}</td>
              <td className={`${TD} tabular-nums`}>{e.series ?? "—"}</td>
              <td className={`${TD} font-mono text-xs`}>{e.tempo ?? "—"}</td>
              <td className={`${TD} text-xs`}>{e.repos ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
