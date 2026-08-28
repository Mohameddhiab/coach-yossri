import type { AuthUser } from '@/shared/common/decorators/current-user.decorator';

export const TOKEN_SERVICE = Symbol('TokenService');

export interface TokenService {
  signAccess(user: AuthUser): Promise<string>;
  signRefresh(user: AuthUser): Promise<string>;
  verifyAccess(token: string): Promise<AuthUser>;
  verifyRefresh(token: string): Promise<AuthUser>;
}
