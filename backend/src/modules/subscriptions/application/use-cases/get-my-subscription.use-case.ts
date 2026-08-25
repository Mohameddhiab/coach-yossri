import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from "@/shared/domain/ports/subscription-repository.port";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";

@Injectable()
export class GetMySubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: SubscriptionRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const [subscription, history] = await Promise.all([
      this.subs.latest(user.id),
      this.subs.list(user.id),
    ]);
    const coach = user.coachId ? await this.users.findById(user.coachId) : null;
    return { subscription, history, user, coach };
  }
}