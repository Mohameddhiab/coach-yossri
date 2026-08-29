import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  generatePassword,
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@/shared/domain/password';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from '@/shared/domain/ports/subscription-repository.port';
import { EmailService } from '@/shared/email/email.service';
import type { User } from '@/shared/domain/entities';

import { isSubscriptionTier } from '@/shared/domain/subscription-tier';
import type { SubscriptionTier } from '@/shared/domain/domain-types';

export interface CreateUserInput {
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: Date | null;
  referredBy: string | null;
  tier?: string;
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
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subs: SubscriptionRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly email: EmailService,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    const email = input.email.trim();
    if (!email) {
      fail(400, 'VALIDATION', 'البريد الإلكتروني مطلوب');
    }
    const existing = await this.users.findByEmail(email.toLowerCase());
    if (existing) {
      fail(400, 'EMAIL_TAKEN', 'هذا البريد موجود مسبقاً');
    }

    const password = generatePassword();
    const user = await this.users.create({
      email: email.toLowerCase(),
      nom: input.nom || '—',
      prenom: input.prenom || 'مستخدم',
      telephone: input.telephone,
      dateNaissance: input.dateNaissance,
      coachId: input.coachId,
      referredBy: input.referredBy,
      passwordHash: await this.hasher.hash(password),
      createdAt: new Date(),
    });

    if (input.dateDebut && input.dateFin) {
      const d1 = new Date(input.dateDebut);
      const d2 = new Date(input.dateFin);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
        fail(400, 'VALIDATION', 'تاريخ البداية أو النهاية غير صحيح');
      }
      if (d2 <= d1) {
        fail(400, 'VALIDATION', 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية');
      }
      const tier: SubscriptionTier = isSubscriptionTier(input.tier)
        ? input.tier
        : 'ONLINE';
      await this.subs.create({
        userId: user.id,
        dateDebut: d1,
        dateFin: d2,
        montant: input.montant,
        tier,
        modePaiement: 'ESPECE',
        statut: 'ACTIF',
        createdBy: input.coachId,
      });
    } else if (input.dateDebut || input.dateFin) {
      fail(400, 'VALIDATION', 'يُرجى إدخال تاريخي البداية والنهاية معًا أو تركهما فارغين');
    }

    try {
      await this.email.sendWelcome(user.email, password);
    } catch (e) {
      // L'email ne doit pas faire échouer la création utilisateur
      console.warn(
        '[CreateUser] sendWelcome failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return { user, password };
  }
}
