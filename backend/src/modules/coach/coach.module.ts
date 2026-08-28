import { Global, Module } from '@nestjs/common';
import { PrismaCoachRepositoryProvider } from './infrastructure/prisma-coach.repository';
import { CoachController } from './presentation/coach.controller';

@Global()
@Module({
  controllers: [CoachController],
  providers: [PrismaCoachRepositoryProvider],
  exports: [PrismaCoachRepositoryProvider],
})
export class CoachModule {}
