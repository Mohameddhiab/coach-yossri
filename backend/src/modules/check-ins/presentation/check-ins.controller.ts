import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/common/guards/roles.guard';
import { SubscriptionGuard } from '@/shared/common/guards/subscription.guard';
import { CoachOwnershipGuard } from '@/shared/common/guards/coach-ownership.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import {
  CreateCheckInUseCase,
  ListMyCheckInsUseCase,
  ListTodayCheckInsUseCase,
  ResolveMemberUseCase,
} from '../application/use-cases/check-ins.use-cases';

@Controller()
@UseGuards(JwtAuthGuard)
export class CheckInsController {
  constructor(
    private readonly resolveUseCase: ResolveMemberUseCase,
    private readonly createUseCase: CreateCheckInUseCase,
    private readonly myUseCase: ListMyCheckInsUseCase,
    private readonly todayUseCase: ListTodayCheckInsUseCase,
  ) {}

  @Get('check-ins/resolve/:userId')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async resolve(@Param('userId') userId: string) {
    return this.resolveUseCase.execute(userId);
  }

  @Post('users/:userId/check-ins')
  @Roles('COACH')
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async create(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    const checkIn = await this.createUseCase.execute(userId, auth.userId);
    return {
      id: checkIn.id,
      user_id: checkIn.userId,
      coach_id: checkIn.coachId,
      checked_at: checkIn.checkedAt.toISOString(),
    };
  }

  @Get('me/check-ins')
  @UseGuards(SubscriptionGuard)
  async mine(@CurrentUser() auth: AuthUser) {
    const rows = await this.myUseCase.execute(auth.userId);
    return rows.map((c) => ({
      id: c.id,
      checked_at: c.checkedAt.toISOString(),
    }));
  }

  @Get('check-ins/today')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async today(@CurrentUser() auth: AuthUser) {
    const rows = await this.todayUseCase.execute(auth.userId);
    return rows.map((c) => ({
      id: c.id,
      user_id: c.userId,
      user_name: `${c.userPrenom} ${c.userName}`,
      checked_at: c.checkedAt.toISOString(),
    }));
  }
}
