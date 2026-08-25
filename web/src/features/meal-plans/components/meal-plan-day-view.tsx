import type { MealPlan, WeekDay } from "@/shared/lib/domain";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  WEEK_DAY_LABELS,
} from "@/shared/lib/domain";
import { cn } from "@/lib/utils";

function MacroChip({ label, value }: { label: string; value?: number | null }) {
  if (!value) return null;
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
      {label}: {value}غ
    </span>
  );
}

export function MealPlanDayView({
  plan,
  day,
  highlightToday = false,
  accent = false,
}: {
  plan: MealPlan;
  day: WeekDay;
  highlightToday?: boolean;
  accent?: boolean;
}) {
  const dayMeals = plan.meals.filter(
    (m) => m.jour_semaine === day || m.jour_semaine === "TOUS_LES_JOURS",
  );

  if (dayMeals.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        لا يوجد وجبات مبرمجة ليوم {WEEK_DAY_LABELS[day]}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {MEAL_TYPE_ORDER.map((type) => {
        const meals = dayMeals.filter((m) => m.type_repas === type);
        if (meals.length === 0) return null;
        return (
          <div key={type}>
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-bold",
                  accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {MEAL_TYPE_LABELS[type]}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {meals[0].calories ? `${meals[0].calories} سعرة` : ""}
              </span>
            </div>
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={cn(
                    "rounded-xl border p-3",
                    highlightToday ? "border-primary/30 bg-primary/5" : "bg-card",
                  )}
                >
                  <p className="text-sm leading-relaxed">{meal.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <MacroChip label="بروتين" value={meal.proteines_g} />
                    <MacroChip label="كارب" value={meal.glucides_g} />
                    <MacroChip label="دهون" value={meal.lipides_g} />
                  </div>
                  {meal.alternatives && (
                    <p className="mt-2 rounded-lg bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
                      بديل: {meal.alternatives}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}