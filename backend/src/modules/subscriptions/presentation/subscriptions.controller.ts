import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/common/guards/roles.guard";
import { Roles } from "@/shared/common/decorators/roles.decorator";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import { AddSubscriptionUseCase } from "../application/use-cases/add-subscription.use-case";
import { PauseSubscriptionUseCase } from "../application/use-cases/pause-subscription.use-case";
import { ResumeSubscriptionUseCase } from "../application/use-cases/resume-subscription.use-case";
import { GetMySubscriptionUseCase } from "../application/use-cases/get-my-subscription.use-case";
import { SUBSCRIPTION_REPOSITORY, type SubscriptionRepository } from "@/shared/domain/ports/subscription-repository.port";
import { Inject } from "@nestjs/common";
import { toSubscriptionApi } from "@/shared/mapping/api.mapper";
import { toUserApi } from "@/shared/mapping/user.mapper";

export class AddSubscriptionDto {
  @IsOptional() @IsBoolean() essai?: boolean;
  @IsOptional() @IsString() date_debut?: string;
  @IsOptional() @IsString() date_fin?: string;
  @IsOptional() @IsNumber() montant?: number;
  @IsOptional() @IsString() tier?: string;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subs: SubscriptionRepository,
    private readonly addUseCase: AddSubscriptionUseCase,
    private readonly pauseUseCase: PauseSubscriptionUseCase,
    private readonly resumeUseCase: ResumeSubscriptionUseCase,
    private readonly myUseCase: GetMySubscriptionUseCase,
  ) {}

  @Get("me/subscription")
  async mySubscription(@CurrentUser() auth: AuthUser) {
    const result = await this.myUseCase.execute(auth.userId);
    return {
      subscription: result.subscription ? toSubscriptionApi(result.subscription) : null,
      history: result.history.map(toSubscriptionApi),
      user: toUserApi(result.user),
      coach: result.coach ? toUserApi(result.coach) : null,
    };
  }

  @Get("users/:userId/subscriptions")
  @Roles("COACH")
  async list(@Param("userId") userId: string) {
    const rows = await this.subs.list(userId);
    return rows.map(toSubscriptionApi);
  }

  @Post("users/:userId/subscriptions")
  @Roles("COACH")
  async add(
    @CurrentUser() auth: AuthUser,
    @Param("userId") userId: string,
    @Body() dto: AddSubscriptionDto,
  ) {
    const sub = await this.addUseCase.execute({
      userId,
      essai: dto.essai ?? false,
      dateDebut: dto.date_debut,
      dateFin: dto.date_fin,
      montant: dto.montant,
      tier: dto.tier,
      createdBy: auth.userId,
    });
    return toSubscriptionApi(sub);
  }

  @Post("users/:userId/subscriptions/:subId/pause")
  @Roles("COACH")
  async pause(@Param("userId") userId: string, @Param("subId") subId: string) {
    const sub = await this.pauseUseCase.execute(userId, subId);
    return sub ? toSubscriptionApi(sub) : null;
  }

  @Post("users/:userId/subscriptions/:subId/resume")
  @Roles("COACH")
  async resume(@Param("userId") userId: string, @Param("subId") subId: string) {
    const sub = await this.resumeUseCase.execute(userId, subId);
    return sub ? toSubscriptionApi(sub) : null;
  }
}