export type Role = "COACH" | "USER";

export type SubscriptionStatus = "ACTIF" | "EXPIRE" | "EXPIRE_BIENTOT";

export type PaymentMode = "ESPECE";

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  ESPECE: "نقداً",
};

export type SubscriptionTier = "ONLINE" | "PREMIUM_COACH";

export const TIER_RANK: Record<SubscriptionTier, number> = {
  ONLINE: 1,
  PREMIUM_COACH: 2,
};

export interface Offre {
  tier: SubscriptionTier;
  prix: number;
  nom: string;
  features: string[];
}

export const OFFRES: Offre[] = [
  {
    tier: "ONLINE",
    prix: 60,
    nom: "أونلاين",
    features: ["خطة غذائية", "خطة تمارين"],
  },
  {
    tier: "PREMIUM_COACH",
    prix: 150,
    nom: "بريميوم كوتش",
    features: ["خطة غذائية", "خطة تمارين", "متابعة شخصية", "محادثة مباشرة مع المدرب"],
  },
];

export type TierFeature = "meal-plan" | "workout-plan" | "chat" | "follow-up";

const FEATURE_MIN_TIER: Record<TierFeature, SubscriptionTier> = {
  "meal-plan": "ONLINE",
  "workout-plan": "ONLINE",
  chat: "PREMIUM_COACH",
  "follow-up": "PREMIUM_COACH",
};

export function getActiveTier(sub: Subscription | null): SubscriptionTier | null {
  if (!sub) return null;
  if (getSubscriptionStatus(sub) === "EXPIRE") return null;
  return sub.tier ?? "ONLINE";
}

export function tierAllows(tier: SubscriptionTier | null, feature: TierFeature): boolean {
  if (!tier) return false;
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

export type PlanObjective = "PRISE_DE_MASSE" | "SECHE" | "MAINTIEN";

export type Sexe = "HOMME" | "FEMME";

export type ActiviteLevel = "SEDENTAIRE" | "LEGER" | "MODERE" | "INTENSE";

export const ACTIVITE_LABELS: Record<ActiviteLevel, string> = {
  SEDENTAIRE: "خامل (جلوس طوال اليوم)",
  LEGER: "نشاط خفيف (1 - 3 مرات في الأسبوع)",
  MODERE: "نشاط متوسط (3 - 5 مرات في الأسبوع)",
  INTENSE: "نشاط مرتفع (6 - 7 مرات في الأسبوع)",
};

export const SEXE_LABELS: Record<Sexe, string> = {
  HOMME: "ذكر",
  FEMME: "أنثى",
};

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
  sexe?: Sexe | null;
  taille_cm?: number | null;
  email_verified: boolean;
  email_verified_at?: string | null;
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
  tier?: SubscriptionTier;
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

export interface MealPlanVersion {
  version: number;
  snapshot: Omit<MealPlan, "versions">;
  updated_at: string;
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
  versions: MealPlanVersion[];
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

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  url: string;
  note?: string | null;
}

export interface CoachNote {
  id: string;
  coach_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
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
  const now = Date.now();
  const finDate = effectiveDateFin(sub);
  finDate.setHours(23, 59, 59, 999);
  const fin = finDate.getTime();
  const debutDate = new Date(sub.date_debut);
  debutDate.setHours(0, 0, 0, 0);
  const debut = debutDate.getTime();
  if (fin < now) return "EXPIRE";
  if (debut > now) return "EXPIRE";
  const daysLeft = Math.ceil((fin - now) / 86400000);
  if (daysLeft <= 7) return "EXPIRE_BIENTOT";
  return "ACTIF";
}

export function daysLeft(sub: Subscription | null): number {
  if (!sub) return 0;
  const finDate = effectiveDateFin(sub);
  finDate.setHours(23, 59, 59, 999);
  return Math.max(0, Math.ceil((finDate.getTime() - Date.now()) / 86400000));
}

export function todayWeekDay(): WeekDay {
  const days: WeekDay[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  return days[new Date().getDay()];
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIF: "نشط",
  EXPIRE_BIENTOT: "ينتهي قريباً",
  EXPIRE: "منتهي",
};
