import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { SubscriptionGuard } from '@/shared/common/guards/subscription.guard';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import {
  PROGRESS_REPOSITORY,
  type ProgressRepository,
} from '@/shared/domain/ports/progress-repository.port';
import { fail } from '@/shared/common/errors/domain-exception';
import { toWeightLogApi, toWeightTargetApi } from '@/shared/mapping/api.mapper';
import type { ProgressPhoto } from '@/shared/domain/entities';

function toPhotoApi(p: ProgressPhoto) {
  return {
    id: p.id,
    user_id: p.userId,
    date: p.date.toISOString(),
    url: p.url,
    note: p.note,
  };
}

class AddWeightDto {
  @IsString() date?: string;
  @IsNumber() poids_kg!: number;
  @IsOptional() @IsString() note?: string;
}

class PhotoDto {
  @IsString() url!: string;
  @IsOptional() @IsString() note?: string;
}

class TargetDto {
  @IsNumber() poids_kg!: number;
  @IsString() date!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progress: ProgressRepository,
  ) {}

  private resolve(userId: string, auth: AuthUser): string {
    const resolved = userId === 'me' ? auth.userId : userId;
    if (auth.role === 'USER' && resolved !== auth.userId) {
      fail(403, 'FORBIDDEN', 'غير مصرح به');
    }
    return resolved;
  }

  @Get('users/:userId/weight-logs')
  @UseGuards(SubscriptionGuard)
  async listWeights(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
  ) {
    const rows = await this.progress.listWeights(this.resolve(userId, auth));
    return rows.map(toWeightLogApi);
  }

  @Post('users/:userId/weight-logs')
  @UseGuards(SubscriptionGuard)
  async addWeight(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: AddWeightDto,
  ) {
    if (auth.role !== 'USER') {
      fail(403, 'FORBIDDEN', 'لا يمكن تسجيل الوزن إلا من قبل العضو نفسه');
    }
    const resolved = this.resolve(userId, auth);
    const poidsKg = Number(dto.poids_kg);
    if (!poidsKg || poidsKg < 20 || poidsKg > 300) {
      fail(400, 'VALIDATION', 'قيمة الوزن غير صحيحة');
    }
    const log = await this.progress.addWeight({
      userId: resolved,
      poidsKg,
      date: dto.date ? new Date(dto.date) : new Date(),
      note: dto.note ? String(dto.note).trim() : null,
    });
    return toWeightLogApi(log);
  }

  @Delete('weight-logs/:logId')
  async deleteWeight(
    @CurrentUser() auth: AuthUser,
    @Param('logId') logId: string,
  ) {
    if (auth.role === 'USER') {
      const own = await this.progress.listWeights(auth.userId);
      if (!own.some((w) => w.id === logId)) {
        const exists = await this.progress.findWeightById(logId);
        if (!exists) {
          fail(404, 'NOT_FOUND', 'غير موجود');
        }
        fail(403, 'FORBIDDEN', 'غير مصرح به');
      }
    }
    const log = await this.progress.deleteWeight(logId);
    if (!log) {
      fail(404, 'NOT_FOUND', 'غير موجود');
    }
    return { ok: true };
  }

  @Get('users/:userId/weight-target')
  @UseGuards(SubscriptionGuard)
  async getTarget(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
  ) {
    const target = await this.progress.targetOf(this.resolve(userId, auth));
    return target ? toWeightTargetApi(target) : null;
  }

  @Put('users/:userId/weight-target')
  async setTarget(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: TargetDto,
  ) {
    const resolved = this.resolve(userId, auth);
    const poidsKg = Number(dto.poids_kg);
    const date = String(dto.date ?? '');
    if (poidsKg <= 0 || !date) {
      fail(400, 'VALIDATION', 'الهدف يحتاج وزناً وتاريخاً صحيحين');
    }
    const target = await this.progress.setTarget(
      resolved,
      poidsKg,
      new Date(date),
    );
    return toWeightTargetApi(target);
  }

  @Delete('users/:userId/weight-target')
  async deleteTarget(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
  ) {
    await this.progress.deleteTarget(this.resolve(userId, auth));
    return { ok: true };
  }

  @Get('users/:userId/photos')
  @UseGuards(SubscriptionGuard)
  async listPhotos(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
  ) {
    const rows = await this.progress.listPhotos(this.resolve(userId, auth));
    return rows.map(toPhotoApi);
  }

  @Post('users/:userId/photos')
  @UseGuards(SubscriptionGuard)
  async addPhoto(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: PhotoDto,
  ) {
    if (auth.role !== 'USER') {
      fail(403, 'FORBIDDEN', 'لا يمكن إضافة صور التقدم إلا من قبل العضو نفسه');
    }
    const resolved = this.resolve(userId, auth);
    const url = String(dto.url ?? '');
    if (!url) {
      fail(400, 'VALIDATION', 'الصورة مطلوبة');
    }
    const photo = await this.progress.addPhoto({
      userId: resolved,
      url,
      note: dto.note ? String(dto.note).trim() : null,
    });
    return toPhotoApi(photo);
  }

  @Delete('photos/:photoId')
  async deletePhoto(
    @CurrentUser() auth: AuthUser,
    @Param('photoId') photoId: string,
  ) {
    if (auth.role === 'USER') {
      const own = await this.progress.listPhotos(auth.userId);
      if (!own.some((p) => p.id === photoId)) {
        const exists = await this.progress.findPhotoById(photoId);
        if (!exists) {
          fail(404, 'NOT_FOUND', 'غير موجود');
        }
        fail(403, 'FORBIDDEN', 'غير مصرح به');
      }
    }
    const photo = await this.progress.deletePhoto(photoId);
    if (!photo) {
      fail(404, 'NOT_FOUND', 'غير موجود');
    }
    return { ok: true };
  }
}
