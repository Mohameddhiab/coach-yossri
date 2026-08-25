import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Role } from "@/shared/domain/domain-types";

export interface AuthUser {
  userId: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return req.user;
  },
);