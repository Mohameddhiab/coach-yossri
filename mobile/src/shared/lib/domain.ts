export type Role = "COACH" | "USER";

export type SubscriptionStatus = "ACTIF" | "EXPIRE" | "EXPIRE_BIENTOT" | "ESSAI";

export type PaymentMode = "ESPECE" | "ESSAI";

export type PlanObjective = "PRISE_DE_MASSE" | "SECHE" | "MAINTIEN";

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

export interface User {
  id: string;
  role: Role;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  date_naissance?: string | null;
  coach_id: string | null;
  referred_by?: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  date_debut: string;
  date_fin: string;
  montant: number;
  mode_paiement: PaymentMode;
  statut: SubscriptionStatus;
  created_by: string;
  created_at: string;
  pause_start?: string | null;
  pause_days?: number;
}

export interface Meal {
  id: string;
  meal_plan_id: string;
  jour_semaine: WeekDay;
  type_repas: MealType;
  description: string;
  calories?: number | null;
  proteines_g?: number | null;
  glucides_g?: number | null;
  lipides_g?: number | null;
  alternatives?: string | null;
}

export interface MealPlan {
  id: string;
  user_id: string;
  coach_id: string;
  titre: string;
  objectif: PlanObjective;
  calories_cible: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
  statut: "ACTIF" | "ARCHIVE";
  version: number;
  meals: Meal[];
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  poids_kg: number;
  note?: string | null;
}

export interface MonthlyGoal {
  id: string;
  user_id: string;
  titre: string;
  mois: string;
  cible: number;
  checkins: string[];
  created_at: string;
}

export interface NotificationPrefs {
  rappel_poids: boolean;
  motivation: boolean;
  expiration_proche: boolean;
  nouveau_plan: boolean;
}

export interface Session {
  userId: string;
  role: Role;
}

export interface UserWithSubscription extends User {
  subscription: Subscription | null;
  last_weight: WeightLog | null;
  days_since_last_weight: number | null;
  plan_version: number | null;
  notes_count: number;
}

export interface CoachNote {
  id: string;
  coach_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
}

export interface CoachSettings {
  motivation_message: string;
  rappel_interval_jours: number;
  send_motivation: boolean;
  message_templates: string[];
}

export const WEEK_DAYS: WeekDay[] = ["SAM", "DIM", "LUN", "MAR", "MER", "JEU", "VEN"];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  SAM: "السبت",
  DIM: "الأحد",
  LUN: "الاثنين",
  MAR: "الثلاثاء",
  MER: "الأربعاء",
  JEU: "الخميس",
  VEN: "الجمعة",
  TOUS_LES_JOURS: "جميع الأيام",
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  PETIT_DEJ: "فطور",
  DEJEUNER: "غداء",
  DINER: "عشاء",
  COLLATION: "وجبة خفيفة",
};

export const MEAL_TYPE_ORDER: MealType[] = ["PETIT_DEJ", "DEJEUNER", "DINER", "COLLATION"];

export const OBJECTIVE_LABELS: Record<PlanObjective, string> = {
  PRISE_DE_MASSE: "زيادة الكتلة العضلية",
  SECHE: "تنشيف وتخفيف الدهون",
  MAINTIEN: "المحافظة على الوزن",
};

export function effectiveDateFin(sub: Subscription | null): Date {
  if (!sub) return new Date(0);
  const fin = new Date(sub.date_fin).getTime();
  const extra = (sub.pause_days ?? 0) * 86400000;
  return new Date(fin + extra);
}

export function isPaused(sub: Subscription | null): boolean {
  return !!sub && !!sub.pause_start;
}

export function getSubscriptionStatus(sub: Subscription | null): SubscriptionStatus {
  if (!sub) return "EXPIRE";
  if (sub.statut === "ESSAI" || sub.mode_paiement === "ESSAI") {
    return effectiveDateFin(sub).getTime() < Date.now() ? "EXPIRE" : "ESSAI";
  }
  const now = Date.now();
  const fin = effectiveDateFin(sub).getTime();
  const debut = new Date(sub.date_debut).getTime();
  if (fin < now) return "EXPIRE";
  if (debut > now) return "EXPIRE";
  const daysLeft = Math.ceil((fin - now) / 86400000);
  if (daysLeft <= 7) return "EXPIRE_BIENTOT";
  return "ACTIF";
}

export function isTrial(sub: Subscription | null): boolean {
  return !!sub && (sub.statut === "ESSAI" || sub.mode_paiement === "ESSAI");
}

export function daysLeft(sub: Subscription | null): number {
  if (!sub) return 0;
  return Math.max(0, Math.ceil((effectiveDateFin(sub).getTime() - Date.now()) / 86400000));
}

export function todayWeekDay(): WeekDay {
  const days: WeekDay[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  return days[new Date().getDay()];
}