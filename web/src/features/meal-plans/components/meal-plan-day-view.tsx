import type { MealPlan, MealType, WeekDay } from "@/shared/lib/domain";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  WEEK_DAY_LABELS,
} from "@/shared/lib/domain";
import { Apple, Coffee, Moon, Sun, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  PETIT_DEJ: Coffee,
  DEJEUNER: Sun,
  DINER: Moon,
  COLLATION: Apple,
};

const MEAL_COLORS: Record<MealType, { border: string; icon: string; chip: string }> = {
  PETIT_DEJ: { border: "border-l-amber-500", icon: "text-amber-500", chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  DEJEUNER: { border: "border-l-emerald-500", icon: "text-emerald-500", chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  DINER: { border: "border-l-sky-500", icon: "text-sky-500", chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  COLLATION: { border: "border-l-orange-500", icon: "text-orange-500", chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
};

function MacroChip({ label, value, color }: { label: string; value?: number | null; color: string }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs tabular-nums font-medium ${color}`}>
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {label} {value}غ
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
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60">
          <UtensilsCrossed className="size-5 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            لا توجد وجبات مسجلة
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            ليوم {WEEK_DAY_LABELS[day]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", accent && "animate-fade-in")}>
      {MEAL_TYPE_ORDER.map((type) => {
        const meals = dayMeals.filter((m) => m.type_repas === type);
        if (meals.length === 0) return null;
        const Icon = MEAL_ICONS[type];
        const colors = MEAL_COLORS[type];
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`flex size-6 items-center justify-center rounded-md bg-muted/60`}>
                <Icon className={`size-3.5 ${colors.icon}`} />
              </div>
              <span className="text-sm font-bold">{MEAL_TYPE_LABELS[type]}</span>
              {meals[0].calories ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {meals[0].calories} سعرة
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={cn(
                    "rounded-xl border-l-2 border border-r-0 border-t-0 border-b-0 bg-card p-3.5 transition-shadow hover:shadow-sm",
                    colors.border,
                    highlightToday && "bg-primary/5",
                  )}
                >
                  <p className="text-sm leading-relaxed text-foreground">{meal.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <MacroChip label="بروتين" value={meal.proteines_g} color="text-emerald-600 dark:text-emerald-400" />
                    <MacroChip label="كربوهيدرات" value={meal.glucides_g} color="text-sky-600 dark:text-sky-400" />
                    <MacroChip label="دهون" value={meal.lipides_g} color="text-orange-600 dark:text-orange-400" />
                  </div>
                  {meal.alternatives && (
                    <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-xs">بدائل متاحة:</span>
                      <span>{meal.alternatives}</span>
                    </div>
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
