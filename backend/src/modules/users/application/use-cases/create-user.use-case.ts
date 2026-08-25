import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import { generatePassword, PASSWORD_HASHER, type PasswordHasher } from "@/shared/domain/password";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { SUBSCRIPTION_REPOSITORY, type SubscriptionRepository } from "@/shared/domain/ports/subscription-repository.port";
import { EmailService } from "@/shared/email/email.service";
import type { User } from "@/shared/domain/entities";

export interface CreateUserInput {
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: Date | null;
  referredBy: string | null;
  essai: boolean;
  dateDebut?: string;
  dateFin?: string;
  montant: number;
  coachId: string;
}

export interface CreateUserResult {
  user: User;
  password: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: SubscriptionRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly email: EmailService,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    const email = input.email.trim();
    if (!email) {
      fail(400, "VALIDATION", "البريد الإلكتروني مطلوب");
    }
    const existing = await this.users.findByEmail(email.toLowerCase());
    if (existing) {
      fail(400, "EMAIL_TAKEN", "هذا البريد موجود مسبقاً");
    }

    const password = generatePassword();
    const user = await this.users.create({
      email: email.toLowerCase(),
      nom: input.nom || "—",
      prenom: input.prenom || "مستخدم",
      telephone: input.telephone,
      dateNaissance: input.dateNaissance,
      coachId: input.coachId,
      referredBy: input.referredBy,
      passwordHash: await this.hasher.hash(password),
      createdAt: new Date(),
    });

    if (input.essai) {
      const now = new Date();
      await this.subs.create({
        userId: user.id,
        dateDebut: now,
        dateFin: new Date(now.getTime() + 7 * 86400000),
        montant: 0,
        modePaiement: "ESSAI",
        statut: "ESSAI",
        createdBy: input.coachId,
      });
    } else if (input.dateDebut && input.dateFin) {
      await this.subs.create({
        userId: user.id,
        dateDebut: new Date(input.dateDebut),
        dateFin: new Date(input.dateFin),
        montant: input.montant,
        modePaiement: "ESPECE",
        statut: "ACTIF",
        createdBy: input.coachId,
      });
    }

    await this.email.sendWelcome(user.email, password);

    return { user, password };
  }
}