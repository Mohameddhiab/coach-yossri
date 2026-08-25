import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    return user;
  }
}