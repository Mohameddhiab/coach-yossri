import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import { PASSWORD_HASHER, type PasswordHasher } from '@/shared/domain/password';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '@/shared/domain/token-service.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import type { User } from '@/shared/domain/entities';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user) {
      fail(401, 'INVALID_CREDENTIALS', 'البريد أو كلمة السر غير صحيحة');
    }
    const ok = await this.hasher.verify(password, user.passwordHash);
    if (!ok) {
      fail(401, 'INVALID_CREDENTIALS', 'البريد أو كلمة السر غير صحيحة');
    }
    const auth = { userId: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(auth),
      this.tokens.signRefresh(auth),
    ]);
    return { user, accessToken, refreshToken };
  }
}
