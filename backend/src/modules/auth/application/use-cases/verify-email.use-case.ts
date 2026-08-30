import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EmailService } from '@/shared/email/email.service';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import { EmailVerificationTokenRepository } from '../../infrastructure/email-verification-token.repository';
import { hashResetToken } from './request-password-reset.use-case';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class RequestEmailVerificationUseCase {
  private readonly lastRequestByUser = new Map<string, number>();

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: EmailVerificationTokenRepository,
    private readonly email: EmailService,
  ) {}

  async execute(userId: string): Promise<void> {
    const last = this.lastRequestByUser.get(userId) ?? 0;
    if (Date.now() - last < REQUEST_COOLDOWN_MS) {
      return;
    }
    this.lastRequestByUser.set(userId, Date.now());

    const user = await this.users.findById(userId);
    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('base64url');
    await this.tokens.invalidateAllForUser(userId);
    await this.tokens.create({
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });

    const webAppUrl = (
      process.env.WEB_APP_URL ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
    const confirmUrl = `${webAppUrl}/verify-email?token=${token}`;

    try {
      await this.email.sendVerifyEmail(user.email, user.prenom, confirmUrl);
    } catch {
      // Échec d'envoi silencieux : ne jamais bloquer le flux non-bloquant
    }
  }
}

@Injectable()
export class ConfirmEmailVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: EmailVerificationTokenRepository,
  ) {}

  async execute(token: string): Promise<void> {
    const record = await this.tokens.findValid(hashResetToken(token));
    if (!record) {
      fail(
        400,
        'INVALID_TOKEN',
        'الرابط غير صحيح أو منتهي الصلاحية — اطلب رابطاً جديداً',
      );
    }
    const user = await this.users.findById(record.userId);
    if (!user) {
      fail(
        400,
        'INVALID_TOKEN',
        'الرابط غير صحيح أو منتهي الصلاحية — اطلب رابطاً جديداً',
      );
    }
    await this.tokens.markUsed(record.id);
    if (!user.emailVerified) {
      await this.users.markEmailVerified(user.id);
    }
  }
}
