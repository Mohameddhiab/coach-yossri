export type Role = "COACH" | "USER";
export type SubscriptionStatus = "ACTIF" | "EXPIRE" | "EXPIRE_BIENTOT" | "ESSAI";
export type PaymentMode = "ESPECE" | "ESSAI";
export type SubscriptionTier = "BASIC" | "PREMIUM" | "ELITE";
export type PlanObjective = "PRISE_DE_MASSE" | "SECHE" | "MAINTIEN";
export type Sexe = "HOMME" | "FEMME";
export type MealPlanStatus = "ACTIF" | "ARCHIVE";
export type WeekDay =
  | "LUN"
  | "MAR"
  | "MER"
  | "JEU"
  | "VEN"
  | "SAM"
  | "DIM"
  | "TOUS_LES_JOURS";
export type MealType = "PETIT_DEJ" | "DEJEUNER" | "DINER" | "COLLATION";

export const WEEK_DAYS: WeekDay[] = [
  "LUN",
  "MAR",
  "MER",
  "JEU",
  "VEN",
  "SAM",
  "DIM",
  "TOUS_LES_JOURS",
];

export const MEAL_TYPES: MealType[] = ["PETIT_DEJ", "DEJEUNER", "DINER", "COLLATION"];

export function todayWeekDay(): WeekDay {
  const days: WeekDay[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  return days[new Date().getDay()] ?? "TOUS_LES_JOURS";
}