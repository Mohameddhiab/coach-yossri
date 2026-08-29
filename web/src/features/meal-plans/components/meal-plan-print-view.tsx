import type { MealPlan, WeekDay } from "@/shared/lib/domain";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  OBJECTIVE_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
} from "@/shared/lib/domain";

export function MealPlanPrintView({ plan }: { plan: MealPlan }) {
  return (
    <div className="print-area mx-auto max-w-3xl space-y-6 p-8 text-sm">
      <header className="border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-black">Coach Yosri — الخطة الغذائية</h1>
        <div className="mt-1 text-muted-foreground">
          {plan.titre} · {OBJECTIVE_LABELS[plan.objectif]} · الإصدار {plan.version}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          ماكروز يومياً: {plan.calories_cible} سعرة · {plan.proteines_g}غ بروتين ·{" "}
          {plan.glucides_g}غ كربوهيدرات · {plan.lipides_g}غ دهون
        </div>
      </header>

      {WEEK_DAYS.map((day: WeekDay) => {
        const dayMeals = plan.meals.filter(
          (m) => m.jour_semaine === day || m.jour_semaine === "TOUS_LES_JOURS",
        );
        return (
          <section key={day}>
            <h2 className="mb-2 text-base font-extrabold">
              {day === "TOUS_LES_JOURS" ? "جميع الأيام" : WEEK_DAY_LABELS[day]}
            </h2>
            {dayMeals.length === 0 ? (
              <p className="text-muted-foreground">لا توجد وجبات مسجلة</p>
            ) : (
              <div className="space-y-2">
                {MEAL_TYPE_ORDER.map((type) => {
                  const meals = dayMeals.filter((m) => m.type_repas === type);
                  if (meals.length === 0) return null;
                  return (
                    <div key={type} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                          {MEAL_TYPE_LABELS[type]}
                        </span>
                        {meals[0].calories ? (
                          <span className="text-xs text-muted-foreground">
                            {meals[0].calories} سعرة
                          </span>
                        ) : null}
                      </div>
                      {meals.map((meal) => (
                        <div key={meal.id} className="mb-1.5 last:mb-0">
                          <p className="leading-relaxed">{meal.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {meal.proteines_g ? `${meal.proteines_g}غ بروتين` : ""}
                            {meal.proteines_g && meal.glucides_g ? " · " : ""}
                            {meal.glucides_g ? `${meal.glucides_g}غ كربوهيدرات` : ""}
                            {meal.glucides_g && meal.lipides_g ? " · " : ""}
                            {meal.lipides_g ? `${meal.lipides_g}غ دهون` : ""}
                          </p>
                          {meal.alternatives && (
                            <p className="text-xs text-muted-foreground">
                              البديل المتاح: {meal.alternatives}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <footer className="border-t border-border pt-3 text-center text-xs text-muted-foreground">
        مع تمنياتنا لك بدوام الصحة والقوة — Coach Yosri
      </footer>
    </div>
  );
}