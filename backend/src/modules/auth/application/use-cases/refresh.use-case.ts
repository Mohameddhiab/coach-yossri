import { Inject, Injectable } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '@/shared/domain/token-service.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
}

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<RefreshResult> {
    const auth = await this.tokens.verifyRefresh(refreshToken);
    const user = await this.users.findById(auth.userId);
    if (!user) {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    const [accessToken, newRefresh] = await Promise.all([
      this.tokens.signAccess({ userId: user.id, role: user.role }),
      this.tokens.signRefresh({ userId: user.id, role: user.role }),
    ]);
    return {
      accessToken,
      refreshToken: newRefresh,
      userId: user.id,
      role: user.role,
    };
  }
}
