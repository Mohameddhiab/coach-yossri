import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/common/guards/roles.guard';
import { SubscriptionGuard } from '@/shared/common/guards/subscription.guard';
import { CoachOwnershipGuard } from '@/shared/common/guards/coach-ownership.guard';
import { fail } from '@/shared/common/errors/domain-exception';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import { ListCoachUsersUseCase } from '../application/use-cases/list-coach-users.use-case';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { GetCalorieNeedsUseCase } from '../application/use-cases/get-calorie-needs.use-case';
import { toUserApi } from '@/shared/mapping/user.mapper';

export class CreateUserDto {
  @IsEmail({}, { message: 'بريد إلكتروني غير صحيح' })
  email!: string;

  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() date_naissance?: string;
  @IsOptional() @IsString() referred_by?: string;
  @IsOptional() @IsString() tier?: string;
  @IsOptional() @IsString() date_debut?: string;
  @IsOptional() @IsString() date_fin?: string;
  @IsOptional() @IsNumber() montant?: number;
}

export class UpdateUserDto {
  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() date_naissance?: string | null;
  @IsOptional() @IsString() sexe?: string | null;
  @IsOptional() @IsNumber() taille_cm?: number | null;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly listUseCase: ListCoachUsersUseCase,
    private readonly createUseCase: CreateUserUseCase,
    private readonly getUseCase: GetUserUseCase,
    private readonly updateUseCase: UpdateUserUseCase,
    private readonly deleteUseCase: DeleteUserUseCase,
    private readonly resetUseCase: ResetPasswordUseCase,
    private readonly calorieNeedsUseCase: GetCalorieNeedsUseCase,
  ) {}

  @Get()
  @Roles('COACH')
  list(@Query('search') search?: string, @Query('status') status?: string) {
    const s = (status ?? 'TOUS') as
      'TOUS' | 'ACTIF' | 'EXPIRE' | 'EXPIRE_BIENTOT';
    return this.listUseCase.execute(search ?? '', s);
  }

  @Post()
  @Roles('COACH')
  async create(@CurrentUser() auth: AuthUser, @Body() dto: CreateUserDto) {
    let dateNaissance: Date | null = null;
    if (dto.date_naissance) {
      const d = new Date(dto.date_naissance);
      if (Number.isNaN(d.getTime())) {
        fail(400, 'VALIDATION', 'تاريخ الميلاد غير صحيح');
      }
      dateNaissance = d;
    }
    const result = await this.createUseCase.execute({
      email: dto.email,
      nom: dto.nom ?? '',
      prenom: dto.prenom ?? '',
      telephone: dto.telephone ?? '',
      dateNaissance,
      referredBy: dto.referred_by ?? null,
      tier: dto.tier,
      dateDebut: dto.date_debut,
      dateFin: dto.date_fin,
      montant: dto.montant ?? 0,
      coachId: auth.userId,
    });
    return { user: toUserApi(result.user), password: result.password };
  }

  @Get(':userId')
  @UseGuards(SubscriptionGuard)
  get(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    return this.getUseCase.execute(auth, userId);
  }

  @Patch(':userId')
  @Roles('COACH')
  @UseGuards(CoachOwnershipGuard)
  async update(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    const user = await this.updateUseCase.execute(userId, {
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      dateNaissance:
        dto.date_naissance === undefined
          ? undefined
          : (dto.date_naissance ?? null),
      sexe: dto.sexe === undefined ? undefined : (dto.sexe ?? null),
      tailleCm:
        dto.taille_cm === undefined ? undefined : (dto.taille_cm ?? null),
    });
    return toUserApi(user);
  }

  @Get(':userId/calorie-needs')
  @Roles('COACH')
  @UseGuards(CoachOwnershipGuard)
  calorieNeeds(
    @Param('userId') userId: string,
    @Query('activite') activite?: string,
  ) {
    return this.calorieNeedsUseCase.execute(userId, activite ?? 'MODERE');
  }

  @Delete(':userId')
  @Roles('COACH')
  @UseGuards(CoachOwnershipGuard)
  async remove(@Param('userId') userId: string) {
    await this.deleteUseCase.execute(userId);
    return { ok: true };
  }

  @Post(':userId/reset-password')
  @Roles('COACH')
  @UseGuards(CoachOwnershipGuard)
  resetPassword(@Param('userId') userId: string) {
    return this.resetUseCase.execute(userId);
  }
}
