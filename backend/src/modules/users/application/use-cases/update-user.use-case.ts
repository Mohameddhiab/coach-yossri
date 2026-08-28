import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(
    userId: string,
    patch: {
      nom?: string;
      prenom?: string;
      telephone?: string;
      dateNaissance?: string | null;
      sexe?: string | null;
      tailleCm?: number | null;
    },
  ) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }
    const sexe =
      patch.sexe === undefined || patch.sexe === null
        ? undefined
        : patch.sexe === 'HOMME' || patch.sexe === 'FEMME'
          ? patch.sexe
          : fail(400, 'VALIDATION', 'قيمة الجنس غير صحيحة');
    const tailleCm =
      patch.tailleCm === undefined || patch.tailleCm === null
        ? undefined
        : Number.isFinite(patch.tailleCm) &&
            patch.tailleCm >= 100 &&
            patch.tailleCm <= 250
          ? patch.tailleCm
          : fail(400, 'VALIDATION', 'الطول يجب أن يكون بين 100 و 250 سم');
    return this.users.update(userId, {
      nom: patch.nom !== undefined ? patch.nom.trim() || user.nom : undefined,
      prenom:
        patch.prenom !== undefined
          ? patch.prenom.trim() || user.prenom
          : undefined,
      telephone:
        patch.telephone !== undefined ? patch.telephone.trim() : undefined,
      dateNaissance:
        patch.dateNaissance === undefined
          ? undefined
          : patch.dateNaissance
            ? new Date(patch.dateNaissance)
            : null,
      sexe,
      tailleCm,
    });
  }
}
