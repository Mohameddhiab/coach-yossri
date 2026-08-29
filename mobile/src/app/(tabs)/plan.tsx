import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePlan } from "@/features/meal-plans/hooks/useMealPlan";
import { isSubscriptionExpiredError } from "@/shared/lib/api-client";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  OBJECTIVE_LABELS,
  WEEK_DAY_LABELS,
WEEK_DAYS,
      todayWeekDay,
      type MealType,
      type WeekDay,
    } from "@/shared/lib/domain";
import { motivationOfToday } from "@/shared/lib/motivation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, Loader } from "@/components/ui/loader";
import { Screen } from "@/components/ui/screen";
import { Segmented } from "@/components/ui/segmented";
import { useTheme } from "@/components/ui/theme";
import { ExpiredScreen } from "@/components/expired-screen";
import { F } from "@/fonts";

export default function PlanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: plan, isLoading, isError, error } = usePlan(user?.id ?? "");

  const [day, setDay] = useState(todayWeekDay());

  const dayItems = useMemo(
    () =>
      [
        ...WEEK_DAYS.map((d) => ({ value: d, label: WEEK_DAY_LABELS[d] })),
      ],
    [],
  );

  if (isSubscriptionExpiredError(error)) {
    return <ExpiredScreen />;
  }
  if (isLoading) {
    return (
      <Screen>
        <Loader />
      </Screen>
    );
  }

  if (isError || !plan) {
    return (
      <Screen>
        <EmptyState
          title="لا توجد خطة غذائية حاليًا"
          description="لم يقم المدرب بإضافة خطة غذائية بعد — يُرجى التواصل معه."
        />
      </Screen>
    );
  }

  const meals = plan.meals.filter(
    (m) => day === "TOUS_LES_JOURS" || m.jour_semaine === day || m.jour_semaine === "TOUS_LES_JOURS",
  );
  const byType = MEAL_TYPE_ORDER.map((type) => ({
    type,
    items: meals.filter((m) => m.type_repas === type),
  })).filter((g) => g.items.length > 0);

  return (
    <Screen>
      <Text style={[styles.screenTitle, { color: colors.text }]}>الخطة الغذائية</Text>
      <Text style={[styles.screenSub, { color: colors.muted }]}>{motivationOfToday()}</Text>

      <Card>
        <View style={styles.planRow}>
          <View style={styles.planCol}>
            <Text style={[styles.planTitle, { color: colors.text }]}>{plan.titre}</Text>
            <View style={styles.badges}>
              <Badge label={OBJECTIVE_LABELS[plan.objectif]} variant="active" />
              <Badge label={`الإصدار ${plan.version}`} variant="neutral" />
            </View>
          </View>
        </View>
        <View style={styles.macros}>
          {[
            { label: "سعرات", value: `${plan.calories_cible}` },
            { label: "بروتين", value: `${plan.proteines_g}غ` },
            { label: "كربوهيدرات", value: `${plan.glucides_g}غ` },
            { label: "دهون", value: `${plan.lipides_g}غ` },
          ].map((m) => (
            <View key={m.label} style={styles.macro}>
              <Text style={[styles.macroValue, { color: colors.primary }]}>{m.value}</Text>
              <Text style={[styles.macroLabel, { color: colors.muted }]}>{m.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Segmented
        items={[...dayItems, { value: "TOUS_LES_JOURS", label: "جميع الأيام" }]}
        value={day}
        onChange={(v) => setDay(v as WeekDay | "TOUS_LES_JOURS")}
      />

      {byType.length === 0 ? (
        <EmptyState title="لا توجد وجبات مسجلة لهذا اليوم" />
      ) : (
        byType.map((group) => (
          <Card key={group.type}>
            <MealTypeHeader type={group.type} />
            {group.items.map((meal) => (
              <View key={meal.id} style={styles.meal}>
                <View style={styles.mealRow}>
                  <Text style={[styles.mealDesc, { color: colors.text }]}>
                    {meal.description}
                  </Text>
                  {meal.calories ? (
                    <Text style={[styles.mealCals, { color: colors.muted }]}>
                      {meal.calories} سعرة
                    </Text>
                  ) : null}
                </View>
                {meal.alternatives ? (
                  <Text style={[styles.mealAlt, { color: colors.primary }]}>
                    البديل المتاح: {meal.alternatives}
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        ))
      )}
    </Screen>
  );
}

function MealTypeHeader({ type }: { type: MealType }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.mealType, { color: colors.accent }]}>
      {MEAL_TYPE_LABELS[type]}
    </Text>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 22, fontFamily: F.extrabold },
  screenSub: { fontSize: 12, fontFamily: F.regular, marginTop: -8 },
  planRow: { flexDirection: "row", justifyContent: "space-between" },
  planCol: { flex: 1, gap: 8 },
  planTitle: { fontSize: 16, fontFamily: F.bold },
  badges: { flexDirection: "row", gap: 6 },
  macros: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  macro: { alignItems: "center", gap: 2 },
  macroValue: { fontSize: 16, fontFamily: F.bold },
  macroLabel: { fontSize: 11, fontFamily: F.regular },
  mealType: { fontSize: 13, fontFamily: F.bold, marginBottom: 4 },
  meal: { gap: 4 },
  mealRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  mealDesc: { flex: 1, fontSize: 13, fontFamily: F.regular, lineHeight: 19 },
  mealCals: { fontSize: 11, fontFamily: F.medium },
  mealAlt: { fontSize: 11, fontFamily: F.medium },
});