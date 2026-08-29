import { Global, Module } from '@nestjs/common';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import { PrismaStatsRepository } from './infrastructure/prisma-stats.repository';
import { StatsController } from './presentation/stats.controller';
import { GetSummaryUseCase } from './application/use-cases/get-summary.use-case';
import { GetGrowthUseCase } from './application/use-cases/get-growth.use-case';
import { GetRevenueUseCase } from './application/use-cases/get-revenue.use-case';
import { GetAttendanceUseCase } from './application/use-cases/get-attendance.use-case';
import { GetMembersUseCase } from './application/use-cases/get-members.use-case';
import { GetMemberUseCase } from './application/use-cases/get-member.use-case';
import { StatsData } from './application/stats-data';

@Global()
@Module({
  controllers: [StatsController],
  providers: [
    {
      provide: STATS_REPOSITORY,
      useClass: PrismaStatsRepository,
    },
    StatsData,
    GetSummaryUseCase,
    GetGrowthUseCase,
    GetRevenueUseCase,
    GetAttendanceUseCase,
    GetMembersUseCase,
    GetMemberUseCase,
  ],
  exports: [STATS_REPOSITORY],
})
export class StatsModule {}

export type { StatsRepository };
