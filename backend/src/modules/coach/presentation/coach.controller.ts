import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from "@nestjs/common";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { JwtAuthGuard } from "@/shared/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/common/guards/roles.guard";
import { Roles } from "@/shared/common/decorators/roles.decorator";
import { CurrentUser, type AuthUser } from "@/shared/common/decorators/current-user.decorator";
import { COACH_REPOSITORY, type CoachRepository } from "@/shared/domain/ports/coach-repository.port";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { fail } from "@/shared/common/errors/domain-exception";

class SaveSettingsDto {
  @IsOptional() @IsString() motivation_message?: string;
  @IsOptional() @IsNumber() rappel_interval_jours?: number;
  @IsOptional() @IsBoolean() send_motivation?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) message_templates?: string[];
}

class NoteDto {
  @IsString() @MinLength(1) @MaxLength(2000) contenu!: string;
}

function sanitizeNote(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 2000);
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(
    @Inject(COACH_REPOSITORY) private readonly coach: CoachRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  @Get("coach/settings")
  @Roles("COACH")
  async settings() {
    const s = await this.coach.settings();
    return {
      motivation_message: s.motivationMessage,
      rappel_interval_jours: s.rappelIntervalJours,
      send_motivation: s.sendMotivation,
      message_templates: s.messageTemplates,
      updated_at: s.updatedAt.toISOString(),
    };
  }

  @Put("coach/settings")
  @Roles("COACH")
  async saveSettings(@Body() dto: SaveSettingsDto) {
    const s = await this.coach.saveSettings({
      motivationMessage: dto.motivation_message,
      rappelIntervalJours: dto.rappel_interval_jours,
      sendMotivation: dto.send_motivation,
      messageTemplates: dto.message_templates,
    });
    return {
      motivation_message: s.motivationMessage,
      rappel_interval_jours: s.rappelIntervalJours,
      send_motivation: s.sendMotivation,
      message_templates: s.messageTemplates,
      updated_at: s.updatedAt.toISOString(),
    };
  }

  @Get("users/:userId/notes")
  @Roles("COACH")
  async notesOf(@Param("userId") userId: string) {
    const notes = await this.coach.notesOf(userId);
    return notes.map((n) => ({
      id: n.id,
      coach_id: n.coachId,
      user_id: n.userId,
      contenu: n.contenu,
      created_at: n.createdAt.toISOString(),
    }));
  }

  @Post("users/:userId/notes")
  @Roles("COACH")
  async addNote(
    @CurrentUser() auth: AuthUser,
    @Param("userId") userId: string,
    @Body() dto: NoteDto,
  ) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const n = await this.coach.addNote(auth.userId, userId, sanitizeNote(dto.contenu));
    return {
      id: n.id,
      coach_id: n.coachId,
      user_id: n.userId,
      contenu: n.contenu,
      created_at: n.createdAt.toISOString(),
    };
  }

  @Delete("notes/:noteId")
  @Roles("COACH")
  async deleteNote(@CurrentUser() auth: AuthUser, @Param("noteId") noteId: string) {
    const note = await this.coach.deleteNote(noteId);
    if (!note) {
      fail(404, "NOT_FOUND", "الملاحظة غير موجودة");
    }
    if (note.coachId !== auth.userId) {
      fail(403, "FORBIDDEN", "غير مصرح به");
    }
    return { ok: true };
  }
}