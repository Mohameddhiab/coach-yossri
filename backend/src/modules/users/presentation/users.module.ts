import { Global, Module } from "@nestjs/common";
import { PrismaUserRepositoryProvider } from "@/shared/database/repositories/prisma-user.repository";
import { UsersController } from "./users.controller";
import { ListCoachUsersUseCase } from "../application/use-cases/list-coach-users.use-case";
import { CreateUserUseCase } from "../application/use-cases/create-user.use-case";
import { GetUserUseCase } from "../application/use-cases/get-user.use-case";
import { UpdateUserUseCase } from "../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../application/use-cases/delete-user.use-case";
import { ResetPasswordUseCase } from "../application/use-cases/reset-password.use-case";
import { GetCalorieNeedsUseCase } from "../application/use-cases/get-calorie-needs.use-case";

@Global()
@Module({
  controllers: [UsersController],
  providers: [
    PrismaUserRepositoryProvider,
    ListCoachUsersUseCase,
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ResetPasswordUseCase,
    GetCalorieNeedsUseCase,
  ],
  exports: [PrismaUserRepositoryProvider],
})
export class UsersModule {}