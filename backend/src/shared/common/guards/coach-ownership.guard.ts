import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { fail } from "../errors/domain-exception";
import type { AuthUser } from "../decorators/current-user.decorator";
import type { Request } from "express";

@Injectable()
export class CoachOwnershipGuard implements CanActivate {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const auth = req.user;
    if (!auth) {
      fail(401, "UNAUTHORIZED", "يجب تسجيل الدخول");
    }
    if (auth!.role === "USER") return true;

    const userId = typeof req.params.userId === "string" ? req.params.userId : undefined;
    if (!userId) return true;

    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    if (user!.coachId !== auth!.userId) {
      fail(403, "FORBIDDEN", "غير مصرح به");
    }
    return true;
  }
}
