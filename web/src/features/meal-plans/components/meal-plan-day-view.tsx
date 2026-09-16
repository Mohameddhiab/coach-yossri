import type { MealPlan, MealType, WeekDay } from "@/shared/lib/domain";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  WEEK_DAY_LABELS,
} from "@/shared/lib/domain";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const MEAL_EMOJI: Record<MealType, string> = {
  PETIT_DEJ: "🌅",
  DEJEUNER: "🍛",
  DINER: "🌙",
  COLLATION: "🍎",
};

const MEAL_TIME: Record<MealType, string> = {
  PETIT_DEJ: "07:00",
  COLLATION: "10:00",
  DEJEUNER: "13:00",
  DINER: "19:30",
};

const MEAL_COLORS: Record<MealType, { border: string; icon: string; chip: string }> = {
  PETIT_DEJ: { border: "border-amber-500/20", icon: "text-amber-500", chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  DEJEUNER: { border: "border-emerald-500/20", icon: "text-emerald-500", chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  DINER: { border: "border-sky-500/20", icon: "text-sky-500", chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  COLLATION: { border: "border-orange-500/20", icon: "text-orange-500", chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
};

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

  const sortedMeals = [...dayMeals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.type_repas) - MEAL_TYPE_ORDER.indexOf(b.type_repas),
  );

  return (
    <div className={cn("space-y-2.5", accent && "animate-fade-in")}>
      {sortedMeals.map((meal) => {
        const colors = MEAL_COLORS[meal.type_repas];
        const time = MEAL_TIME[meal.type_repas];
        return (
          <div
            key={meal.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 transition-shadow hover:shadow-sm",
              colors.border,
              highlightToday && "bg-primary/[0.03]",
            )}
          >
            {/* Right: emoji + name + time (RTL) */}
            <div className="flex min-w-0 shrink-0 items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-sm">
                {MEAL_EMOJI[meal.type_repas]}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold">{MEAL_TYPE_LABELS[meal.type_repas]}</div>
                <div className="text-xs tabular-nums text-muted-foreground">{time}</div>
              </div>
            </div>
            {/* Center: description */}
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-sm leading-relaxed text-muted-foreground">{meal.description}</p>
            </div>
            {/* Left: kcal + macros */}
            <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
              {meal.calories ? <span className="font-bold">{meal.calories} kcal</span> : null}
              {meal.proteines_g ? <span className="text-emerald-600 dark:text-emerald-400">P:{meal.proteines_g}غ</span> : null}
              {meal.glucides_g ? <span className="text-sky-600 dark:text-sky-400">C:{meal.glucides_g}غ</span> : null}
              {meal.lipides_g ? <span className="text-orange-600 dark:text-orange-400">F:{meal.lipides_g}غ</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
