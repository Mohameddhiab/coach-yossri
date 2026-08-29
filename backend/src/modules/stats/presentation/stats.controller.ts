import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/common/guards/roles.guard';
import { CoachOwnershipGuard } from '@/shared/common/guards/coach-ownership.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import { GetSummaryUseCase } from '../application/use-cases/get-summary.use-case';
import { GetGrowthUseCase } from '../application/use-cases/get-growth.use-case';
import { GetRevenueUseCase } from '../application/use-cases/get-revenue.use-case';
import { GetAttendanceUseCase } from '../application/use-cases/get-attendance.use-case';
import { GetMembersUseCase } from '../application/use-cases/get-members.use-case';
import { GetMemberUseCase } from '../application/use-cases/get-member.use-case';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(
    private readonly summary: GetSummaryUseCase,
    private readonly growth: GetGrowthUseCase,
    private readonly revenue: GetRevenueUseCase,
    private readonly attendance: GetAttendanceUseCase,
    private readonly members: GetMembersUseCase,
    private readonly member: GetMemberUseCase,
  ) {}

  @Get('summary')
  @Roles('COACH')
  async summaryStats(@CurrentUser() auth: AuthUser) {
    return this.summary.execute(auth.userId);
  }

  @Get('growth')
  @Roles('COACH')
  async growthStats(
    @CurrentUser() auth: AuthUser,
    @Query('months') months?: string,
  ) {
    return this.growth.execute(auth.userId, months);
  }

  @Get('revenue')
  @Roles('COACH')
  async revenueStats(
    @CurrentUser() auth: AuthUser,
    @Query('months') months?: string,
  ) {
    return this.revenue.execute(auth.userId, months);
  }

  @Get('attendance')
  @Roles('COACH')
  async attendanceStats(
    @CurrentUser() auth: AuthUser,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attendance.execute(auth.userId, days, limit);
  }

  @Get('members')
  @Roles('COACH')
  async membersStats(@CurrentUser() auth: AuthUser) {
    return this.members.execute(auth.userId);
  }

  @Get('member/:userId')
  @Roles('COACH')
  @UseGuards(CoachOwnershipGuard)
  async memberStats(
    @Param('userId') userId: string,
    @CurrentUser() auth: AuthUser,
  ) {
    return this.member.execute(userId, auth);
  }

  @Get('me')
  @Roles('USER')
  async meStats(@CurrentUser() auth: AuthUser) {
    return this.member.execute(auth.userId, auth);
  }
}
