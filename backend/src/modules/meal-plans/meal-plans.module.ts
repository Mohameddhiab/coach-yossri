import { Global, Module } from '@nestjs/common';
import { PrismaMealPlanRepositoryProvider } from './infrastructure/prisma-meal-plan.repository';
import {
  GetPlanUseCase,
  CreatePlanUseCase,
  UpdatePlanUseCase,
  DuplicatePlanUseCase,
  VersionsUseCase,
} from './application/use-cases/meal-plans.use-cases';
import { MealPlansController } from './presentation/meal-plans.controller';

@Global()
@Module({
  controllers: [MealPlansController],
  providers: [
    PrismaMealPlanRepositoryProvider,
    GetPlanUseCase,
    CreatePlanUseCase,
    UpdatePlanUseCase,
    DuplicatePlanUseCase,
    VersionsUseCase,
  ],
  exports: [PrismaMealPlanRepositoryProvider],
})
export class MealPlansModule {}
