import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';
import {
  DEFAULT_PREFS,
  type NotificationPrefs,
} from '@/shared/domain/entities';

@Injectable()
export class PrefsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async get(userId: string): Promise<NotificationPrefs> {
    const prefs = await this.users.prefsOf(userId);
    return prefs ?? { userId, ...DEFAULT_PREFS };
  }

  async save(
    userId: string,
    patch: Partial<NotificationPrefs>,
  ): Promise<NotificationPrefs> {
    return this.users.savePrefs(userId, patch);
  }
}
