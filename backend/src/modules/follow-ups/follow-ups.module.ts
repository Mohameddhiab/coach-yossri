import { Module } from '@nestjs/common';
import { PrismaFollowUpRepositoryProvider } from '../chat/infrastructure/prisma-chat.repository';
import {
  CreateFollowUpUseCase,
  DeleteFollowUpUseCase,
  ListMyFollowUpsUseCase,
  ListUserFollowUpsUseCase,
} from './application/use-cases/follow-ups.use-cases';
import { FollowUpsController } from './presentation/follow-ups.controller';

@Module({
  controllers: [FollowUpsController],
  providers: [
    PrismaFollowUpRepositoryProvider,
    CreateFollowUpUseCase,
    ListMyFollowUpsUseCase,
    ListUserFollowUpsUseCase,
    DeleteFollowUpUseCase,
  ],
})
export class FollowUpsModule {}
