import { Global, Module } from '@nestjs/common';
import { PrismaCoachRepositoryProvider } from './infrastructure/prisma-coach.repository';
import { CoachController } from './presentation/coach.controller';
import { PremiumSeatsController } from './presentation/premium-seats.controller';

@Global()
@Module({
  controllers: [CoachController, PremiumSeatsController],
  providers: [PrismaCoachRepositoryProvider],
  exports: [PrismaCoachRepositoryProvider],
})
export class CoachModule {}
