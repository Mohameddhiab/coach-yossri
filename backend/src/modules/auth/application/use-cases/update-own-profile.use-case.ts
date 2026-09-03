import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import type { User } from '@/shared/domain/entities';
import type { Sexe } from '@/shared/domain/domain-types';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';

export interface UpdateOwnProfileInput {
  nom?: string;
  prenom?: string;
  telephone?: string;
  sexe?: string | null;
  tailleCm?: number | null;
  dateNaissance?: Date | null;
}

@Injectable()
export class UpdateOwnProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string, patch: UpdateOwnProfileInput) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }

    const updatePatch: Partial<
      Pick<
        User,
        'nom' | 'prenom' | 'telephone' | 'dateNaissance' | 'sexe' | 'tailleCm'
      >
    > = {};
    if (patch.nom !== undefined) updatePatch.nom = patch.nom;
    if (patch.prenom !== undefined) updatePatch.prenom = patch.prenom;
    if (patch.telephone !== undefined) updatePatch.telephone = patch.telephone;
    if (patch.sexe !== undefined)
      updatePatch.sexe = patch.sexe as Sexe | null;
    if (patch.tailleCm !== undefined) updatePatch.tailleCm = patch.tailleCm;
    if (patch.dateNaissance !== undefined)
      updatePatch.dateNaissance = patch.dateNaissance;

    if (Object.keys(updatePatch).length === 0) {
      fail(400, 'VALIDATION', 'لم يتم تقديم أي تعديل');
    }

    return this.users.update(userId, updatePatch);
  }
}
