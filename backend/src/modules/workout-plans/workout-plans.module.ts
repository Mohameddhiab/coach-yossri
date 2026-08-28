import { Module } from '@nestjs/common';
import { PrismaWorkoutPlanRepositoryProvider } from './infrastructure/prisma-workout-plan.repository';
import {
  CreateWorkoutPlanUseCase,
  DuplicateWorkoutPlanUseCase,
  GetWorkoutPlanUseCase,
  UpdateWorkoutPlanUseCase,
  WorkoutVersionsUseCase,
} from './application/use-cases/workout-plans.use-cases';
import { WorkoutPlansController } from './presentation/workout-plans.controller';

@Module({
  controllers: [WorkoutPlansController],
  providers: [
    PrismaWorkoutPlanRepositoryProvider,
    GetWorkoutPlanUseCase,
    CreateWorkoutPlanUseCase,
    UpdateWorkoutPlanUseCase,
    DuplicateWorkoutPlanUseCase,
    WorkoutVersionsUseCase,
  ],
})
export class WorkoutPlansModule {}
