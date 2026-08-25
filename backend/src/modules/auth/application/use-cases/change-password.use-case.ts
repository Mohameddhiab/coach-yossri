import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import { PASSWORD_HASHER, type PasswordHasher } from "@/shared/domain/password";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(userId: string, current: string, next: string): Promise<void> {
    if (next.length < 6) {
      fail(400, "WEAK_PASSWORD", "كلمة السر الجديدة قصيرة جداً (6 أحرف على الأقل)");
    }
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const stored = await this.users.findByEmail(user.email);
    if (!stored) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const ok = await this.hasher.verify(current, stored.passwordHash);
    if (!ok) {
      fail(400, "INVALID_CURRENT", "كلمة السر الحالية غير صحيحة");
    }
    await this.users.updatePassword(userId, await this.hasher.hash(next));
  }
}