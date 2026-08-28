import { Module } from '@nestjs/common';
import { PrismaCheckInRepositoryProvider } from './infrastructure/prisma-check-in.repository';
import {
  CreateCheckInUseCase,
  ListMyCheckInsUseCase,
  ListTodayCheckInsUseCase,
  ResolveMemberUseCase,
} from './application/use-cases/check-ins.use-cases';
import { CheckInsController } from './presentation/check-ins.controller';

@Module({
  controllers: [CheckInsController],
  providers: [
    PrismaCheckInRepositoryProvider,
    ResolveMemberUseCase,
    CreateCheckInUseCase,
    ListMyCheckInsUseCase,
    ListTodayCheckInsUseCase,
  ],
})
export class CheckInsModule {}
