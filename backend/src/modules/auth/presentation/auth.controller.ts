import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
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
import { toUserApi } from '@/shared/mapping/user.mapper';
import type { NotificationPrefs } from '@/shared/domain/entities';

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

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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
  logout(@Res({ passthrough: true }) res: Response) {
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

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
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
}

function toPrefsApi(p: NotificationPrefs): PrefsDto {
  return {
    rappel_poids: p.rappelPoids,
    motivation: p.motivation,
    expiration_proche: p.expirationProche,
    nouveau_plan: p.nouveauPlan,
  };
}
