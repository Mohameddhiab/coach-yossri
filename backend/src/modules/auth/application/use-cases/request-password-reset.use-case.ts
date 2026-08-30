import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { EmailService } from '@/shared/email/email.service';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import { PasswordResetTokenRepository } from '../../infrastructure/password-reset-token.repository';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly lastRequestByEmail = new Map<string, number>();

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokens: PasswordResetTokenRepository,
    private readonly email: EmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();

    const last = this.lastRequestByEmail.get(normalized) ?? 0;
    if (Date.now() - last < REQUEST_COOLDOWN_MS) {
      return;
    }
    this.lastRequestByEmail.set(normalized, Date.now());

    const user = await this.users.findByEmail(normalized);
    if (!user) {
      return;
    }

    await this.tokens.invalidateAllForUser(user.id);
    const token = randomBytes(32).toString('base64url');
    await this.tokens.create({
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });

    const webAppUrl = (
      process.env.WEB_APP_URL ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
    const resetUrl = `${webAppUrl}/reset-password?token=${token}`;

    try {
      await this.email.sendPasswordReset(user.email, user.prenom, resetUrl);
    } catch {
      // Échec d'envoi silencieux : ne jamais révéler si l'email existe
    }
  }
}
