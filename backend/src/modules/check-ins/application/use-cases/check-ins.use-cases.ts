import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  CHECKIN_REPOSITORY,
  type CheckInRepository,
} from '@/shared/domain/ports/checkin-repository.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from '@/shared/domain/ports/subscription-repository.port';
import { getActiveTier } from '@/shared/domain/subscription-tier';
import { getSubscriptionStatus } from '@/shared/domain/subscription-status';

@Injectable()
export class ResolveMemberUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subs: SubscriptionRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || user.role !== 'USER') {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }
    const subscription = await this.subs.latest(userId);
    const statut = getSubscriptionStatus(subscription);
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      tier: getActiveTier(subscription),
      statut,
      date_fin: subscription ? subscription.dateFin.toISOString() : null,
    };
  }
}

@Injectable()
export class CreateCheckInUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly checkins: CheckInRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subs: SubscriptionRepository,
  ) {}

  async execute(userId: string, coachId: string) {
    const subscription = await this.subs.latest(userId);
    if (getSubscriptionStatus(subscription) === 'EXPIRE') {
      fail(
        403,
        'SUBSCRIPTION_EXPIRED',
        'اشتراك العضو منتهي — لا يمكن تسجيل الحضور',
      );
    }
    return this.checkins.create(userId, coachId);
  }
}

@Injectable()
export class ListMyCheckInsUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly checkins: CheckInRepository,
  ) {}

  async execute(userId: string) {
    return this.checkins.listByUser(userId, 50);
  }
}

@Injectable()
export class ListTodayCheckInsUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly checkins: CheckInRepository,
  ) {}

  async execute(coachId: string) {
    return this.checkins.listToday(coachId);
  }
}
