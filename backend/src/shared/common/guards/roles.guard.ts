import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { fail } from "../errors/domain-exception";
import type { Role } from "@/shared/domain/domain-types";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const req = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
    if (!req.user || !roles.includes(req.user.role)) {
      fail(403, "FORBIDDEN", "غير مصرح به");
    }
    return true;
  }
}