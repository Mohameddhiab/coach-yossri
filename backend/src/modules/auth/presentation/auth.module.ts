import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
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
import { PasswordResetTokenRepository } from '../infrastructure/password-reset-token.repository';
import { EmailVerificationTokenRepository } from '../infrastructure/email-verification-token.repository';
import { RefreshSessionRepository } from '../infrastructure/refresh-session.repository';
import { BcryptPasswordHasher } from '../infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from '../infrastructure/jwt-token.service';
import { AuthRateLimitService } from '../infrastructure/auth-rate-limit.service';
import { PASSWORD_HASHER } from '@/shared/domain/password';
import { TOKEN_SERVICE } from '@/shared/domain/token-service.port';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_SECRET ??
        (() => {
          throw new Error('JWT_SECRET env var is required');
        })(),
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    LoginUseCase,
    RefreshUseCase,
    ChangePasswordUseCase,
    GetMeUseCase,
    PrefsUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    RequestEmailVerificationUseCase,
    ConfirmEmailVerificationUseCase,
    PasswordResetTokenRepository,
    EmailVerificationTokenRepository,
    RefreshSessionRepository,
    AuthRateLimitService,
  ],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE, RequestEmailVerificationUseCase],
})
export class AuthModule {}
