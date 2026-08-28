import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsNumber, IsString, Min } from 'class-validator';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/common/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import {
  GOAL_REPOSITORY,
  type GoalRepository,
} from '@/shared/domain/ports/goal-repository.port';
import { Inject } from '@nestjs/common';
import { fail } from '@/shared/common/errors/domain-exception';
import type { MonthlyGoal } from '@/shared/domain/entities';

function toGoalApi(g: MonthlyGoal) {
  return {
    id: g.id,
    user_id: g.userId,
    titre: g.titre,
    mois: g.mois,
    cible: g.cible,
    checkins: g.checkins,
    created_at: g.createdAt.toISOString(),
  };
}

class SetGoalDto {
  @IsString() titre!: string;
  @IsNumber() @Min(1) cible!: number;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

@Controller()
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goals: GoalRepository,
  ) {}

  private resolve(userId: string, auth: AuthUser): string {
    const resolved = userId === 'me' ? auth.userId : userId;
    if (auth.role === 'USER' && resolved !== auth.userId) {
      fail(403, 'FORBIDDEN', 'غير مصرح به');
    }
    return resolved;
  }

  @Get('users/:userId/goal')
  async get(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    const goal = await this.goals.ofMonth(
      this.resolve(userId, auth),
      currentMonth(),
    );
    return goal ? toGoalApi(goal) : null;
  }

  @Put('users/:userId/goal')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async setWeb(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: SetGoalDto,
  ) {
    return this.set(auth, userId, dto);
  }

  @Post('users/:userId/goal')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async setMobile(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: SetGoalDto,
  ) {
    return this.set(auth, userId, dto);
  }

  private async set(auth: AuthUser, userId: string, dto: SetGoalDto) {
    const resolved = this.resolve(userId, auth);
    const titre = String(dto.titre ?? '').trim();
    const cible = Number(dto.cible ?? 0);
    if (!titre || cible <= 0) {
      fail(400, 'VALIDATION', 'هدف الشهر يحتاج عنواناً وعدد حصص صحيح');
    }
    const goal = await this.goals.replace(
      resolved,
      currentMonth(),
      titre,
      cible,
    );
    return toGoalApi(goal);
  }

  @Post('users/:userId/goal/checkin')
  async checkin(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
  ) {
    const resolved = this.resolve(userId, auth);
    const goal = await this.goals.ofMonth(resolved, currentMonth());
    if (!goal) {
      fail(404, 'NO_GOAL', 'لا يوجد هدف لهذا الشهر');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (goal.checkins.some((c) => c.slice(0, 10) === today)) {
      fail(400, 'ALREADY_CHECKED', 'تم تسجيل حصتك لليوم بالفعل');
    }
    const updated = await this.goals.checkin(
      resolved,
      currentMonth(),
      new Date(),
    );
    return toGoalApi(updated);
  }
}
