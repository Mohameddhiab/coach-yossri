import { Global, Module } from '@nestjs/common';
import { PrismaGoalRepositoryProvider } from './infrastructure/prisma-goal.repository';
import { GetGoalUseCase } from './application/use-cases/get-goal.use-case';
import { SetGoalUseCase } from './application/use-cases/set-goal.use-case';
import { CheckinGoalUseCase } from './application/use-cases/checkin-goal.use-case';
import { GoalsController } from './presentation/goals.controller';

@Global()
@Module({
  controllers: [GoalsController],
  providers: [
    PrismaGoalRepositoryProvider,
    GetGoalUseCase,
    SetGoalUseCase,
    CheckinGoalUseCase,
  ],
  exports: [PrismaGoalRepositoryProvider],
})
export class GoalsModule {}
