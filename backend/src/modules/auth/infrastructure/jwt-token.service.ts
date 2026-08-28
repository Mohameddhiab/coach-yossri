import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import type { TokenService } from '@/shared/domain/token-service.port';
import type { AuthUser } from '@/shared/common/decorators/current-user.decorator';
import { fail } from '@/shared/common/errors/domain-exception';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccess(user: AuthUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.userId, role: user.role, type: 'access' },
      {
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_TTL',
          '15m',
        ) as StringValue,
      },
    );
  }

  async signRefresh(user: AuthUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.userId, role: user.role, type: 'refresh' },
      {
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_TTL',
          '7d',
        ) as StringValue,
      },
    );
  }

  async verifyAccess(token: string): Promise<AuthUser> {
    const payload = await this.verify(token, 'access');
    return { userId: payload.sub, role: payload.role };
  }

  async verifyRefresh(token: string): Promise<AuthUser> {
    const payload = await this.verify(token, 'refresh');
    return { userId: payload.sub, role: payload.role };
  }

  private async verify(
    token: string,
    expectedType: string,
  ): Promise<{ sub: string; role: AuthUser['role']; type: string }> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        role: AuthUser['role'];
        type: string;
      }>(token, { secret: this.config.get<string>('JWT_SECRET') });
      if (payload.type !== expectedType) {
        fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
      }
      return payload;
    } catch {
      return fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
  }
}
