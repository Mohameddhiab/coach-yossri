import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from "@/shared/domain/ports/subscription-repository.port";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { isSubscriptionTier, OFFRES } from "@/shared/domain/subscription-tier";
import type { SubscriptionTier } from "@/shared/domain/domain-types";

export interface AddSubscriptionInput {
  userId: string;
  dateDebut?: string;
  dateFin?: string;
  montant?: number;
  tier?: string;
  createdBy: string;
}

@Injectable()
export class AddSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: SubscriptionRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: AddSubscriptionInput) {
    const user = await this.users.findById(input.userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const tier: SubscriptionTier = isSubscriptionTier(input.tier) ? input.tier : "ONLINE";
    let dateDebut = input.dateDebut;
    let dateFin = input.dateFin;
    if (!dateDebut || !dateFin) {
      fail(400, "VALIDATION", "تواريخ الاشتراك مطلوبة");
    }
    const startDate = new Date(dateDebut!);
    const endDate = new Date(dateFin!);
    if (endDate <= startDate) {
      fail(400, "VALIDATION", "تاريخ النهاية يجب أن يكون بعد البداية");
    }
    return this.subs.create({
      userId: input.userId,
      dateDebut: startDate,
      dateFin: endDate,
      montant: input.montant ?? OFFRES[tier].prix,
      tier,
      modePaiement: "ESPECE",
      statut: "ACTIF",
      createdBy: input.createdBy,
    });
  }
}