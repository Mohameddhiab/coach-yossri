import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/common/guards/roles.guard';
import { SubscriptionGuard } from '@/shared/common/guards/subscription.guard';
import { CoachOwnershipGuard } from '@/shared/common/guards/coach-ownership.guard';
import { TierGuard } from '@/shared/common/guards/tier.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import { RequireTier } from '@/shared/common/decorators/require-tier.decorator';
import {
  CreateWorkoutPlanUseCase,
  DuplicateWorkoutPlanUseCase,
  GetWorkoutPlanUseCase,
  UpdateWorkoutPlanUseCase,
  WorkoutVersionsUseCase,
} from '../application/use-cases/workout-plans.use-cases';
import {
  WORKOUT_PLAN_REPOSITORY,
  type WorkoutPlanRepository,
} from '@/shared/domain/ports/workout-plan-repository.port';
import { toWorkoutPlanApi } from '@/shared/mapping/workout.mapper';
import { fail } from '@/shared/common/errors/domain-exception';

export class WorkoutExerciseDto {
  @IsOptional() @IsString() jour_semaine?: string;
  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() charge?: string | null;
  @IsOptional() @IsString() repetitions?: string | null;
  @IsOptional() @IsString() series?: string | null;
  @IsOptional() @IsString() tempo?: string | null;
  @IsOptional() @IsString() repos?: string | null;
  @IsOptional() @IsString() groupe_musculaire?: string | null;
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsString() image_url?: string | null;
  // legacy (anciens clients) — toléré
  @IsOptional() repos_sec?: unknown;
}

export class WorkoutPlanDto {
  @IsOptional() @IsString() titre?: string;
  @IsOptional() @IsString() objectif?: string;
  @IsOptional() exercises?: WorkoutExerciseDto[];
}

export class DuplicateWorkoutPlanDto {
  @IsString() source_plan_id!: string;
}

function toExerciseInput(e: WorkoutExerciseDto) {
  const legacyRepos =
    e.repos ??
    (typeof (e as Record<string, unknown>).repos_sec === 'number'
      ? String((e as Record<string, unknown>).repos_sec)
      : (e as Record<string, unknown>).repos_sec != null
        ? String((e as Record<string, unknown>).repos_sec)
        : null);
  const legacySeries = e.series != null ? String(e.series) : null;
  return {
    jourSemaine: e.jour_semaine,
    nom: e.nom,
    charge: (e as Record<string, unknown>).charge as string | null | undefined,
    repetitions: e.repetitions,
    series: legacySeries,
    tempo: (e as Record<string, unknown>).tempo as string | null | undefined,
    repos: legacyRepos as string | null | undefined,
    groupeMusculaire: e.groupe_musculaire,
    notes: e.notes,
    imageUrl: (e as Record<string, unknown>).image_url as
      string | null | undefined,
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkoutPlansController {
  constructor(
    @Inject(WORKOUT_PLAN_REPOSITORY)
    private readonly plans: WorkoutPlanRepository,
    private readonly getUseCase: GetWorkoutPlanUseCase,
    private readonly createUseCase: CreateWorkoutPlanUseCase,
    private readonly updateUseCase: UpdateWorkoutPlanUseCase,
    private readonly duplicateUseCase: DuplicateWorkoutPlanUseCase,
    private readonly versionsUseCase: WorkoutVersionsUseCase,
  ) {}

  @Get('users/:userId/workout-plan')
  @RequireTier('ONLINE')
  @UseGuards(SubscriptionGuard, TierGuard)
  async get(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    const resolved = userId === 'me' ? auth.userId : userId;
    if (auth.role === 'USER' && resolved !== auth.userId) {
      fail(403, 'FORBIDDEN', 'غير مصرح به');
    }
    const plan = await this.getUseCase.execute(resolved);
    return plan ? toWorkoutPlanApi(plan) : null;
  }

  @Post('users/:userId/workout-plan')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async create(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: WorkoutPlanDto,
  ) {
    const plan = await this.createUseCase.execute(auth.userId, userId, {
      titre: dto.titre,
      objectif: dto.objectif,
      exercises: (dto.exercises ?? []).map(toExerciseInput),
    });
    return toWorkoutPlanApi(plan);
  }

  @Put('users/:userId/workout-plan')
  @Roles('COACH')
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async update(@Param('userId') userId: string, @Body() dto: WorkoutPlanDto) {
    const plan = await this.updateUseCase.execute(userId, {
      titre: dto.titre,
      objectif: dto.objectif,
      exercises: (dto.exercises ?? []).map(toExerciseInput),
    });
    return toWorkoutPlanApi(plan);
  }

  @Post('users/:userId/workout-plan/duplicate')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async duplicate(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: DuplicateWorkoutPlanDto,
  ) {
    const plan = await this.duplicateUseCase.execute(
      auth.userId,
      userId,
      dto.source_plan_id,
    );
    return toWorkoutPlanApi(plan);
  }

  @Get('users/:userId/workout-plan/versions')
  @Roles('COACH')
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async versions(@Param('userId') userId: string) {
    const versions = await this.versionsUseCase.execute(userId);
    return versions.map((v) => ({
      version: v.version,
      updated_at: v.updatedAt.toISOString(),
      snapshot: v.snapshot,
    }));
  }

  @Get('workout-plan-templates')
  @Roles('COACH')
  @UseGuards(RolesGuard)
  async templates() {
    const rows = await this.plans.templates();
    return rows.map((r) => ({
      id: r.id,
      titre: r.titre,
      objectif: r.objectif,
      version: r.version,
      updated_at: r.updatedAt.toISOString(),
      user_name: r.userName,
      is_template: r.isTemplate,
    }));
  }
}
