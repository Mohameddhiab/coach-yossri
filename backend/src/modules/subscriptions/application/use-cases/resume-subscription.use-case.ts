import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from '@/shared/domain/ports/subscription-repository.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';

@Injectable()
export class ResumeSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subs: SubscriptionRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string, subId: string) {
    if (!(await this.users.findById(userId))) {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }
    const sub = await this.subs.findById(subId, userId);
    if (!sub) {
      fail(404, 'NOT_FOUND', 'الاشتراك غير موجود');
    }
    if (!sub.pauseStart) {
      fail(400, 'NOT_PAUSED', 'الاشتراك ليس مجمّداً');
    }
    const pausedDays = Math.max(
      1,
      Math.floor((Date.now() - new Date(sub.pauseStart).getTime()) / 86400000),
    );
    return this.subs.resume(subId, sub.pauseDays + pausedDays);
  }
}
