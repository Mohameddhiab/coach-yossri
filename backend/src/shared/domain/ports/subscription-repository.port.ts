import type { Subscription } from "../entities";
import type { SubscriptionTier } from "../domain-types";

export const SUBSCRIPTION_REPOSITORY = Symbol("SubscriptionRepository");

export interface CreateSubscriptionInput {
  userId: string;
  dateDebut: Date;
  dateFin: Date;
  montant: number;
  tier?: SubscriptionTier;
  modePaiement: Subscription["modePaiement"];
  statut: Subscription["statut"];
  createdBy: string;
}

export interface SubscriptionRepository {
  latest(userId: string): Promise<Subscription | null>;
  list(userId: string): Promise<Subscription[]>;
  create(input: CreateSubscriptionInput): Promise<Subscription>;
  pause(subId: string, pauseStart: Date): Promise<Subscription | null>;
  resume(subId: string, pauseDays: number): Promise<Subscription | null>;
  findById(subId: string, userId: string): Promise<Subscription | null>;
}