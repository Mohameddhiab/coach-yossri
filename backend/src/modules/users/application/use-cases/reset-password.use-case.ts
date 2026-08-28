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

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(userId: string): Promise<{ password: string }> {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, 'NOT_FOUND', 'المستخدم غير موجود');
    }
    const password = generatePassword();
    await this.users.updatePassword(userId, await this.hasher.hash(password));
    return { password };
  }
}
