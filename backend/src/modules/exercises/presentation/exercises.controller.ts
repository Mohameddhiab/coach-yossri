import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/common/guards/roles.guard";
import { Roles } from "@/shared/common/decorators/roles.decorator";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import {
  ImportExerciseFromWgerUseCase,
  ListLocalExercisesUseCase,
  SearchWgerExercisesUseCase,
} from "../application/use-cases/exercises.use-cases";

export class ImportWgerDto {
  @IsString() wger_uuid!: string;
}

@Controller("exercises")
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(
    private readonly searchWgerUC: SearchWgerExercisesUseCase,
    private readonly importWgerUC: ImportExerciseFromWgerUseCase,
    private readonly listLocalUC: ListLocalExercisesUseCase,
  ) {}

  @Get("wger/search")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async searchWger(@Query("term") term: string) {
    if (!term || term.trim().length < 2) return [];
    return this.searchWgerUC.execute(term);
  }

  @Post("wger/import")
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async importWger(@Body() dto: ImportWgerDto, @CurrentUser() auth: AuthUser) {
    return this.importWgerUC.execute(dto.wger_uuid, auth.userId);
  }

  @Get()
  @Roles("COACH")
  @UseGuards(RolesGuard)
  async list(@Query("q") q?: string) {
    return this.listLocalUC.execute(q);
  }
}
