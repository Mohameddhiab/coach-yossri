import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/common/guards/roles.guard";
import { SubscriptionGuard } from "@/shared/common/guards/subscription.guard";
import { CoachOwnershipGuard } from "@/shared/common/guards/coach-ownership.guard";
import { TierGuard } from "@/shared/common/guards/tier.guard";
import { Roles } from "@/shared/common/decorators/roles.decorator";
import { RequireTier } from "@/shared/common/decorators/require-tier.decorator";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import {
  CreateFollowUpUseCase,
  DeleteFollowUpUseCase,
  ListMyFollowUpsUseCase,
  ListUserFollowUpsUseCase,
} from "../application/use-cases/follow-ups.use-cases";

export class FollowUpDto {
  @IsString() periode!: string;
  @IsString() bilan!: string;
  @IsOptional() @IsString() ajustements?: string | null;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(
    private readonly createUseCase: CreateFollowUpUseCase,
    private readonly listUseCase: ListMyFollowUpsUseCase,
    private readonly listUserUseCase: ListUserFollowUpsUseCase,
    private readonly deleteUseCase: DeleteFollowUpUseCase,
  ) {}

  @Post("users/:userId/follow-ups")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async create(
    @CurrentUser() auth: AuthUser,
    @Param("userId") userId: string,
    @Body() dto: FollowUpDto,
  ) {
    const row = await this.createUseCase.execute(auth.userId, userId, dto);
    return this.toApi(row);
  }

  @Get("users/:userId/follow-ups")
  @Roles("COACH")
  @UseGuards(RolesGuard, CoachOwnershipGuard)
  async listForUser(@Param("userId") userId: string) {
    const rows = await this.listUserUseCase.execute(userId);
    return rows.map((r) => this.toApi(r));
  }

  @Get("me/follow-ups")
  @RequireTier("PREMIUM_COACH")
  @UseGuards(SubscriptionGuard, TierGuard)
  async mine(@CurrentUser() auth: AuthUser) {
    const rows = await this.listUseCase.execute(auth.userId);
    return rows.map((r) => this.toApi(r));
  }

  @Delete("follow-ups/:id")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async remove(@CurrentUser() auth: AuthUser, @Param("id") id: string) {
    return this.deleteUseCase.execute(auth.userId, id);
  }

  private toApi(row: {
    id: string;
    userId: string;
    coachId: string;
    periode: string;
    bilan: string;
    ajustements: string | null;
    createdAt: Date;
    coachName?: string;
  }) {
    return {
      id: row.id,
      user_id: row.userId,
      coach_id: row.coachId,
      coach_name: row.coachName ?? "",
      periode: row.periode,
      bilan: row.bilan,
      ajustements: row.ajustements,
      created_at: row.createdAt.toISOString(),
    };
  }
}
