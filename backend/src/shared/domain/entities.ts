import type {
  MealPlanStatus,
  MealType,
  PaymentMode,
  PlanObjective,
  Role,
  Sexe,
  SubscriptionStatus,
  SubscriptionTier,
  WeekDay,
} from './domain-types';

export interface User {
  id: string;
  role: Role;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: Date | null;
  sexe: Sexe | null;
  tailleCm: number | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  coachId: string | null;
  referredBy: string | null;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  dateDebut: Date;
  dateFin: Date;
  montant: number;
  tier: SubscriptionTier;
  modePaiement: PaymentMode;
  statut: SubscriptionStatus;
  createdBy: string;
  pauseStart: Date | null;
  pauseDays: number;
  createdAt: Date;
}

export interface Meal {
  id: string;
  mealPlanId: string;
  jourSemaine: WeekDay;
  typeRepas: MealType;
  description: string;
  calories: number | null;
  proteinesG: number | null;
  glucidesG: number | null;
  lipidesG: number | null;
  alternatives: string | null;
}

export interface MealPlanVersion {
  version: number;
  snapshot: unknown;
  updatedAt: Date;
}

export interface MealPlan {
  id: string;
  userId: string;
  coachId: string;
  titre: string;
  objectif: PlanObjective;
  caloriesCible: number;
  proteinesG: number;
  glucidesG: number;
  lipidesG: number;
  statut: MealPlanStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: Date;
  poidsKg: number;
  note: string | null;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  date: Date;
  url: string;
  note: string | null;
}

export interface CoachNote {
  id: string;
  coachId: string;
  userId: string;
  contenu: string;
  createdAt: Date;
}

export interface MonthlyGoal {
  id: string;
  userId: string;
  titre: string;
  mois: string;
  cible: number;
  checkins: string[];
  createdAt: Date;
}

export interface WeightTarget {
  id: string;
  userId: string;
  poidsKg: number;
  date: Date;
}

export interface CoachSettings {
  id: string;
  motivationMessage: string;
  rappelIntervalJours: number;
  sendMotivation: boolean;
  messageTemplates: string[];
  totalSeats: number;
  remainingSeats: number;
  updatedAt: Date;
}

export interface CheckIn {
  id: string;
  userId: string;
  coachId: string;
  checkedAt: Date;
}

export interface WorkoutExercise {
  id: string;
  workoutPlanId: string;
  jourSemaine: WeekDay;
  nom: string;
  charge: string | null;
  repetitions: string | null;
  series: string | null;
  tempo: string | null;
  repos: string | null;
  groupeMusculaire: string | null;
  notes: string | null;
  imageUrl: string | null;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  coachId: string;
  titre: string;
  objectif: PlanObjective;
  statut: MealPlanStatus;
  isTemplate: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutPlanVersion {
  version: number;
  snapshot: unknown;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  coachId: string;
  userId: string;
  lastMessageAt: Date | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  contenu: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  lu: boolean;
  createdAt: Date;
}

export interface FollowUp {
  id: string;
  userId: string;
  coachId: string;
  periode: string;
  bilan: string;
  ajustements: string | null;
  createdAt: Date;
}

export interface NotificationPrefs {
  userId: string;
  rappelPoids: boolean;
  motivation: boolean;
  expirationProche: boolean;
  nouveauPlan: boolean;
}

export const DEFAULT_PREFS: Omit<NotificationPrefs, 'userId'> = {
  rappelPoids: true,
  motivation: true,
  expirationProche: true,
  nouveauPlan: true,
};
