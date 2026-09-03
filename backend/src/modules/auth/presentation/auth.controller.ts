import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from '@/shared/common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '@/shared/common/decorators/current-user.decorator';
import { DomainException } from '@/shared/common/errors/domain-exception';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../auth.constants';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshUseCase } from '../application/use-cases/refresh.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { PrefsUseCase } from '../application/use-cases/prefs.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import {
  RequestEmailVerificationUseCase,
  ConfirmEmailVerificationUseCase,
} from '../application/use-cases/verify-email.use-case';
import { UpdateOwnProfileUseCase } from '../application/use-cases/update-own-profile.use-case';
import { UploadAvatarUseCase } from '../application/use-cases/upload-avatar.use-case';
import { toUserApi } from '@/shared/mapping/user.mapper';
import type { NotificationPrefs } from '@/shared/domain/entities';
import {
  RefreshSessionRepository,
  hashRefreshToken,
} from '../infrastructure/refresh-session.repository';
import { AuthRateLimitService } from '../infrastructure/auth-rate-limit.service';

export class LoginDto {
  @IsEmail({}, { message: 'بريد إلكتروني غير صحيح' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  current!: string;

  @IsString()
  @MinLength(12, {
    message: 'كلمة السر الجديدة قصيرة جداً (12 حرفاً على الأقل)',
  })
  next!: string;
}

export class PrefsDto {
  @IsOptional() @IsBoolean() rappel_poids?: boolean;
  @IsOptional() @IsBoolean() motivation?: boolean;
  @IsOptional() @IsBoolean() expiration_proche?: boolean;
  @IsOptional() @IsBoolean() nouveau_plan?: boolean;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'بريد إلكتروني غير صحيح' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(12, { message: 'كلمة السر قصيرة جداً (12 حرفاً على الأقل)' })
  newPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() sexe?: string | null;
  @IsOptional() @IsNumber() taille_cm?: number | null;
  @IsOptional() @IsString() date_naissance?: string | null;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly prefsUseCase: PrefsUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly requestEmailVerificationUseCase: RequestEmailVerificationUseCase,
    private readonly confirmEmailVerificationUseCase: ConfirmEmailVerificationUseCase,
    private readonly refreshSessions: RefreshSessionRepository,
    private readonly rateLimiter: AuthRateLimitService,
    private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
  ) {}

  private setTokens(res: Response, accessToken: string, refreshToken: string) {
    // En dev local (http://localhost) Secure=false + Lax (same-site cross-port OK)
    // En prod cross-domain (vercel.app -> onrender.com) → Secure=true + SameSite=None obligatoire
    const secure =
      process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === 'true'
        : process.env.NODE_ENV === 'production';
    const sameSite: 'none' | 'lax' = secure ? 'none' : 'lax';
    res.cookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }

  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.rateLimiter.check(dto.email, 5, 60_000);
    const { user, accessToken, refreshToken } = await this.loginUseCase.execute(
      dto.email,
      dto.password,
    );
    this.setTokens(res, accessToken, refreshToken);
    return {
      user: toUserApi(user),
      session: { userId: user.id, role: user.role },
      access_token: accessToken,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (!token) {
      throw new DomainException(401, 'UNAUTHORIZED', 'يجب تسجيل الدخول');
    }
    const result = await this.refreshUseCase.execute(token);
    this.setTokens(res, result.accessToken, result.refreshToken);
    return {
      session: { userId: result.userId, role: result.role },
      access_token: result.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
    if (token) {
      try {
        await this.refreshSessions.revokeByHash(hashRefreshToken(token));
      } catch (e) {
        console.warn('[Logout] revoke failed:', e);
      }
    }
    const secure =
      process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === 'true'
        : process.env.NODE_ENV === 'production';
    const sameSite: 'none' | 'lax' = secure ? 'none' : 'lax';
    const opts = { httpOnly: true, secure, sameSite, path: '/' } as const;
    res.clearCookie(ACCESS_COOKIE, opts);
    res.clearCookie(REFRESH_COOKIE, opts);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.getMeUseCase.execute(auth.userId);
    return toUserApi(user);
  }

  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.rateLimiter.check(dto.email, 5, 60_000);
    await this.requestPasswordResetUseCase.execute(dto.email);
    return {
      ok: true,
      message: 'إذا كان البريد مسجّل، وصلك رابط تغيير كلمة السر',
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
    return {
      ok: true,
      message: 'تم تغيير كلمة المرور، يمكنك تسجيل الدخول الآن',
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.confirmEmailVerificationUseCase.execute(dto.token);
    return {
      ok: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-email/resend')
  async resendVerifyEmail(@CurrentUser() auth: AuthUser) {
    await this.requestEmailVerificationUseCase.execute(auth.userId);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() auth: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.changePasswordUseCase.execute(
      auth.userId,
      dto.current,
      dto.next,
    );
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('prefs')
  async getPrefs(@CurrentUser() auth: AuthUser): Promise<PrefsDto> {
    return toPrefsApi(await this.prefsUseCase.get(auth.userId));
  }

  @UseGuards(JwtAuthGuard)
  @Put('prefs')
  async putPrefs(
    @CurrentUser() auth: AuthUser,
    @Body() dto: PrefsDto,
  ): Promise<PrefsDto> {
    return toPrefsApi(
      await this.prefsUseCase.save(auth.userId, {
        rappelPoids: dto.rappel_poids,
        motivation: dto.motivation,
        expirationProche: dto.expiration_proche,
        nouveauPlan: dto.nouveau_plan,
      }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() auth: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const dateNaissance =
      dto.date_naissance === undefined
        ? undefined
        : dto.date_naissance
          ? new Date(dto.date_naissance)
          : null;

    const user = await this.updateOwnProfileUseCase.execute(auth.userId, {
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      sexe: dto.sexe === undefined ? undefined : (dto.sexe ?? null),
      tailleCm:
        dto.taille_cm === undefined ? undefined : (dto.taille_cm ?? null),
      dateNaissance,
    });
    return toUserApi(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else
          cb(
            new DomainException(
              400,
              'VALIDATION',
              'نوع الصورة غير مدعوم (JPEG, PNG, WebP, GIF)',
            ),
            false,
          );
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() auth: AuthUser,
    @UploadedFile()
    file?: {
      mimetype: string;
      size: number;
      originalname: string;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new DomainException(400, 'VALIDATION', 'الرجاء اختيار صورة');
    }
    return this.uploadAvatarUseCase.execute(auth.userId, file);
  }
}

function toPrefsApi(p: NotificationPrefs): PrefsDto {
  return {
    rappel_poids: p.rappelPoids,
    motivation: p.motivation,
    expiration_proche: p.expirationProche,
    nouveau_plan: p.nouveauPlan,
  };
}
