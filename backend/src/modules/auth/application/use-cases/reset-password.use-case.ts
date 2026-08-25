import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import { PASSWORD_HASHER, type PasswordHasher } from "@/shared/domain/password";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { PasswordResetTokenRepository } from "../../infrastructure/password-reset-token.repository";
import { hashResetToken } from "./request-password-reset.use-case";

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly tokens: PasswordResetTokenRepository,
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 6) {
      fail(400, "WEAK_PASSWORD", "كلمة السر قصيرة جداً (6 أحرف على الأقل)");
    }
    const record = await this.tokens.findValid(hashResetToken(token));
    if (!record) {
      fail(400, "INVALID_TOKEN", "الرابط غير صحيح ولا منتهي الصلاحية — أعد الطلب");
    }
    const user = await this.users.findById(record.userId);
    if (!user) {
      fail(400, "INVALID_TOKEN", "الرابط غير صحيح ولا منتهي الصلاحية — أعد الطلب");
    }
    await this.users.updatePassword(user.id, await this.hasher.hash(newPassword));
    await this.tokens.markUsed(record.id);
  }
}
