import type {
  ChatMessage,
  Conversation,
  FollowUp,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutPlanVersion,
} from '../entities';

export const WORKOUT_PLAN_REPOSITORY = Symbol('WorkoutPlanRepository');

export interface WorkoutPlanWithExercises extends WorkoutPlan {
  exercises: WorkoutExercise[];
}

export interface WorkoutPlanSnapshot {
  id: string;
  userId: string;
  coachId: string;
  titre: string;
  objectif: string;
  statut: string;
  version: number;
  exercises: {
    jourSemaine: string;
    nom: string;
    charge: string | null;
    repetitions: string | null;
    series: string | null;
    tempo: string | null;
    repos: string | null;
    groupeMusculaire: string | null;
    notes: string | null;
    imageUrl: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutPlanInput {
  userId: string;
  coachId: string;
  titre: string;
  objectif: string;
}

export interface WorkoutPlanTemplateRow {
  id: string;
  titre: string;
  objectif: string;
  version: number;
  updatedAt: Date;
  userName: string;
  isTemplate: boolean;
}

export interface WorkoutPlanRepository {
  findActive(userId: string): Promise<WorkoutPlanWithExercises | null>;
  archiveActive(userId: string): Promise<void>;
  create(
    input: CreateWorkoutPlanInput,
    exercises: WorkoutExercise[],
  ): Promise<WorkoutPlanWithExercises>;
  updatePlanAndExercises(
    planId: string,
    patch: Partial<CreateWorkoutPlanInput>,
    exercises: WorkoutExercise[],
  ): Promise<WorkoutPlanWithExercises>;
  bumpVersion(planId: string, oldSnapshot: WorkoutPlanSnapshot): Promise<void>;
  findById(id: string): Promise<WorkoutPlanWithExercises | null>;
  templates(): Promise<WorkoutPlanTemplateRow[]>;
  versions(planId: string): Promise<WorkoutPlanVersion[]>;
}

export const CHAT_REPOSITORY = Symbol('ChatRepository');

export interface ConversationWithMeta extends Conversation {
  userName: string;
  userPrenom: string;
  unreadCount: number;
  lastMessage: string | null;
}

export interface ChatRepository {
  findOrCreate(coachId: string, userId: string): Promise<Conversation>;
  findForCoach(coachId: string): Promise<ConversationWithMeta[]>;
  findByUsers(coachId: string, userId: string): Promise<Conversation | null>;
  findById(id: string): Promise<Conversation | null>;
  messagesAfter(
    conversationId: string,
    afterIso: string | null,
  ): Promise<(ChatMessage & { senderRole: 'COACH' | 'USER' })[]>;
  addMessage(
    conversationId: string,
    senderId: string,
    contenu: string,
  ): Promise<ChatMessage>;
  markRead(conversationId: string, viewerId: string): Promise<void>;
  unreadCount(conversationId: string, ownerId: string): Promise<number>;
}

export const FOLLOWUP_REPOSITORY = Symbol('FollowUpRepository');

export interface FollowUpRepository {
  create(
    userId: string,
    coachId: string,
    periode: string,
    bilan: string,
    ajustements: string | null,
  ): Promise<FollowUp>;
  listByUser(
    userId: string,
    limit?: number,
  ): Promise<(FollowUp & { coachName: string })[]>;
  delete(id: string, coachId: string): Promise<boolean>;
}
