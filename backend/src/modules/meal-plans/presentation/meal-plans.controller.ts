import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/common/guards/roles.guard";
import { SubscriptionGuard } from "@/shared/common/guards/subscription.guard";
import { CoachOwnershipGuard } from "@/shared/common/guards/coach-ownership.guard";
import { TierGuard } from "@/shared/common/guards/tier.guard";
import { RequireTier } from "@/shared/common/decorators/require-tier.decorator";
import { Roles } from "@/shared/common/decorators/roles.decorator";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import { GetPlanUseCase, CreatePlanUseCase, UpdatePlanUseCase, DuplicatePlanUseCase, VersionsUseCase } from "../application/use-cases/meal-plans.use-cases";
import { MEAL_PLAN_REPOSITORY, type MealPlanRepository } from "@/shared/domain/ports/meal-plan-repository.port";
import { Inject } from "@nestjs/common";
import { toMealPlanApi } from "@/shared/mapping/api.mapper";
import { fail } from "@/shared/common/errors/domain-exception";

export class MealDto {
  @IsOptional() @IsString() jour_semaine?: string;
  @IsOptional() @IsString() type_repas?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() calories?: number | null;
  @IsOptional() @IsNumber() proteines_g?: number | null;
  @IsOptional() @IsNumber() glucides_g?: number | null;
  @IsOptional() @IsNumber() lipides_g?: number | null;
  @IsOptional() @IsString() alternatives?: string | null;
}

export class PlanDto {
  @IsOptional() @IsString() titre?: string;
  @IsOptional() @IsString() objectif?: string;
  @IsOptional() @IsNumber() calories_cible?: number;
  @IsOptional() @IsNumber() proteines_g?: number;
  @IsOptional() @IsNumber() glucides_g?: number;
  @IsOptional() @IsNumber() lipides_g?: number;
  @IsOptional() meals?: MealDto[];
}

export class DuplicatePlanDto {
  @IsString() source_plan_id!: string;
}

function toMealInput(m: MealDto) {
  return {
    jourSemaine: m.jour_semaine,
    typeRepas: m.type_repas,
    description: m.description,
    calories: m.calories,
    proteinesG: m.proteines_g,
    glucidesG: m.glucides_g,
    lipidesG: m.lipides_g,
    alternatives: m.alternatives,
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class MealPlansController {
  constructor(
    @Inject(MEAL_PLAN_REPOSITORY) private readonly plans: MealPlanRepository,
    private readonly getUseCase: GetPlanUseCase,
    private readonly createUseCase: CreatePlanUseCase,
    private readonly updateUseCase: UpdatePlanUseCase,
    private readonly duplicateUseCase: DuplicatePlanUseCase,
    private readonly versionsUseCase: VersionsUseCase,
  ) {}

  @Get("users/:userId/plan")
  @RequireTier("ONLINE")
  @UseGuards(SubscriptionGuard, TierGuard)
  async get(@CurrentUser() auth: AuthUser, @Param("userId") userId: string) {
    const resolved = userId === "me" ? auth.userId : userId;
    if (auth.role === "USER" && resolved !== auth.userId) {
      fail(403, "FORBIDDEN", "غير مصرح به");
    }
    const plan = await this.getUseCase.execute(resolved);
    return plan ? toMealPlanApi(plan) : null;
  }

  @Post("users/:userId/plan")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async create(
    @CurrentUser() auth: AuthUser,
    @Param("userId") userId: string,
    @Body() dto: PlanDto,
  ) {
    const plan = await this.createUseCase.execute(auth.userId, userId, {
      titre: dto.titre,
      objectif: dto.objectif,
      caloriesCible: dto.calories_cible,
      proteinesG: dto.proteines_g,
      glucidesG: dto.glucides_g,
      lipidesG: dto.lipides_g,
      meals: (dto.meals ?? []).map(toMealInput),
    });
    return toMealPlanApi(plan);
  }

  @Put("users/:userId/plan")
  @Roles("COACH")
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async update(
    @Param("userId") userId: string,
    @Body() dto: PlanDto,
  ) {
    const plan = await this.updateUseCase.execute(userId, {
      titre: dto.titre,
      objectif: dto.objectif,
      caloriesCible: dto.calories_cible,
      proteinesG: dto.proteines_g,
      glucidesG: dto.glucides_g,
      lipidesG: dto.lipides_g,
      meals: (dto.meals ?? []).map(toMealInput),
    });
    return toMealPlanApi(plan);
  }

  @Post("users/:userId/plan/duplicate")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async duplicate(
    @CurrentUser() auth: AuthUser,
    @Param("userId") userId: string,
    @Body() dto: DuplicatePlanDto,
  ) {
    const plan = await this.duplicateUseCase.execute(auth.userId, userId, dto.source_plan_id);
    return toMealPlanApi(plan);
  }

  @Get("users/:userId/plan/versions")
  @Roles("COACH")
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async versions(@Param("userId") userId: string) {
    const versions = await this.versionsUseCase.execute(userId);
    return versions.map((v) => ({
      version: v.version,
      updated_at: v.updatedAt.toISOString(),
      snapshot: v.snapshot,
    }));
  }

  @Get("plans/templates")
  @Roles("COACH")
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