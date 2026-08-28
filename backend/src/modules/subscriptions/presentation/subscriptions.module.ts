import { Global, Module } from '@nestjs/common';
import { PrismaSubscriptionRepositoryProvider } from '../infrastructure/prisma-subscription.repository';
import { AddSubscriptionUseCase } from '../application/use-cases/add-subscription.use-case';
import { PauseSubscriptionUseCase } from '../application/use-cases/pause-subscription.use-case';
import { ResumeSubscriptionUseCase } from '../application/use-cases/resume-subscription.use-case';
import { GetMySubscriptionUseCase } from '../application/use-cases/get-my-subscription.use-case';
import { SubscriptionsController } from './subscriptions.controller';

@Global()
@Module({
  controllers: [SubscriptionsController],
  providers: [
    PrismaSubscriptionRepositoryProvider,
    AddSubscriptionUseCase,
    PauseSubscriptionUseCase,
    ResumeSubscriptionUseCase,
    GetMySubscriptionUseCase,
  ],
  exports: [PrismaSubscriptionRepositoryProvider],
})
export class SubscriptionsModule {}
