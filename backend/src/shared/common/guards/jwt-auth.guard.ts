import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { fail } from '../errors/domain-exception';
import type { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const ACCESS_COOKIE = 'coachyosri_access';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(req);
    if (!token) {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: string;
        type?: string;
      }>(token);
      if (payload.type && payload.type !== 'access') {
        fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
      }
      req.user = {
        userId: payload.sub,
        role: payload.role as AuthUser['role'],
      };
      return true;
    } catch {
      fail(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
  }

  private extractToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    const cookie = (req.cookies as Record<string, string> | undefined)?.[
      ACCESS_COOKIE
    ];
    if (cookie) return cookie;
    return null;
  }
}
