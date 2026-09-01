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
import { RequestEmailVerificationUseCase } from './verify-email.use-case';
import {
  RefreshSessionRepository,
  hashRefreshToken,
} from '../../infrastructure/refresh-session.repository';

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
    private readonly requestEmailVerification: RequestEmailVerificationUseCase,
    private readonly refreshSessions: RefreshSessionRepository,
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

    const firstLogin = user.lastLoginAt === null;

    try {
      await this.users.touchLastLogin(user.id, new Date());
    } catch (e) {
      // ne jamais faire échouer le login à cause de la persistance de la date
      console.warn(
        '[Login] touchLastLogin failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    if (firstLogin && !user.emailVerified) {
      try {
        await this.requestEmailVerification.execute(user.id);
      } catch (e) {
        // échec non-bloquant : le membre pourra renvoyer le lien depuis l'app
        console.warn(
          '[Login] requestEmailVerification failed:',
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    const auth = { userId: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(auth),
      this.tokens.signRefresh(auth),
    ]);
    try {
      await this.refreshSessions.create({
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });
    } catch (e) {
      console.warn('[Login] refresh session create failed:', e);
    }
    return { user, accessToken, refreshToken };
  }
}
