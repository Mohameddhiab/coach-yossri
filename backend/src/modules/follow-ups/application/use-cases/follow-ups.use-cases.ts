import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  FOLLOWUP_REPOSITORY,
  type FollowUpRepository,
} from '@/shared/domain/ports/workout-plan-repository.port';

@Injectable()
export class CreateFollowUpUseCase {
  constructor(
    @Inject(FOLLOWUP_REPOSITORY) private readonly repo: FollowUpRepository,
  ) {}

  async execute(
    coachId: string,
    userId: string,
    input: { periode?: string; bilan?: string; ajustements?: string | null },
  ) {
    const periode = String(input.periode ?? '').trim();
    const bilan = String(input.bilan ?? '').trim();
    if (!periode || !bilan) {
      fail(400, 'VALIDATION', 'الفترة والتقييم مطلوبان');
    }
    return this.repo.create(
      userId,
      coachId,
      periode,
      bilan,
      typeof input.ajustements === 'string' && input.ajustements.trim()
        ? input.ajustements.trim()
        : null,
    );
  }
}

@Injectable()
export class ListMyFollowUpsUseCase {
  constructor(
    @Inject(FOLLOWUP_REPOSITORY) private readonly repo: FollowUpRepository,
  ) {}

  async execute(userId: string) {
    return this.repo.listByUser(userId);
  }
}

@Injectable()
export class ListUserFollowUpsUseCase {
  constructor(
    @Inject(FOLLOWUP_REPOSITORY) private readonly repo: FollowUpRepository,
  ) {}

  async execute(userId: string) {
    return this.repo.listByUser(userId, 100);
  }
}

@Injectable()
export class DeleteFollowUpUseCase {
  constructor(
    @Inject(FOLLOWUP_REPOSITORY) private readonly repo: FollowUpRepository,
  ) {}

  async execute(coachId: string, id: string) {
    const ok = await this.repo.delete(id, coachId);
    if (!ok) fail(404, 'NOT_FOUND', 'التقييم غير موجود');
    return { ok: true };
  }
}
