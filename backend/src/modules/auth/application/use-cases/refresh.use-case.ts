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
import {
  RefreshSessionRepository,
  hashRefreshToken,
} from '../../infrastructure/refresh-session.repository';

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
    private readonly refreshSessions: RefreshSessionRepository,
  ) {}

  async execute(refreshToken: string): Promise<RefreshResult> {
    const auth = await this.tokens.verifyRefresh(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.refreshSessions.findByHash(tokenHash);
    if (!session || session.revokedAt) {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    if (session.expiresAt.getTime() < Date.now()) {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    if (session.userId !== auth.userId) {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    const user = await this.users.findById(auth.userId);
    if (!user) {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    const [accessToken, newRefresh] = await Promise.all([
      this.tokens.signAccess({ userId: user.id, role: user.role }),
      this.tokens.signRefresh({ userId: user.id, role: user.role }),
    ]);
    try {
      await this.refreshSessions.revokeByHash(tokenHash);
      await this.refreshSessions.create({
        userId: user.id,
        tokenHash: hashRefreshToken(newRefresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });
    } catch (e) {
      console.warn('[Refresh] session rotation failed:', e);
    }
    return {
      accessToken,
      refreshToken: newRefresh,
      userId: user.id,
      role: user.role,
    };
  }
}
