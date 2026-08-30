import { notifyNewPlan } from './meal-plans.use-cases';
import type { UserRepository } from '@/shared/domain/ports/user-repository.port';
import type { EmailService } from '@/shared/email/email.service';

function userRepo(overrides: {
  prefs?: unknown;
  user?: unknown;
}): jest.Mocked<Pick<UserRepository, 'prefsOf' | 'findById'>> {
  return {
    prefsOf: jest.fn().mockResolvedValue(overrides.prefs ?? null),
    findById: jest.fn().mockResolvedValue(overrides.user ?? { email: 'a@b.c' }),
  };
}

describe('notifyNewPlan', () => {
  it('envoie l’email quand la préférence est absente (defaut true)', async () => {
    const users = userRepo({});
    const email = {
      sendNewPlan: jest.fn().mockResolvedValue(undefined),
    } as never as jest.Mocked<EmailService>;
    await notifyNewPlan(users as never, email, 'u1', 'Plan A');
    expect(email.sendNewPlan).toHaveBeenCalledWith('a@b.c', 'Plan A');
  });

  it('envoie l’email quand nouveauPlan est true', async () => {
    const users = userRepo({ prefs: { nom: 'x', nouveauPlan: true } });
    const email = {
      sendNewPlan: jest.fn().mockResolvedValue(undefined),
    } as never as jest.Mocked<EmailService>;
    await notifyNewPlan(users as never, email, 'u1', 'Plan A');
    expect(email.sendNewPlan).toHaveBeenCalledTimes(1);
  });

  it('ne rien envoyer quand nouveauPlan est false', async () => {
    const users = userRepo({ prefs: { nom: 'x', nouveauPlan: false } });
    const email = {
      sendNewPlan: jest.fn().mockResolvedValue(undefined),
    } as never as jest.Mocked<EmailService>;
    await notifyNewPlan(users as never, email, 'u1', 'Plan A');
    expect(email.sendNewPlan).not.toHaveBeenCalled();
  });

  it('ne pas bloquer si l’envoi échoue', async () => {
    const users = userRepo({});
    const email = {
      sendNewPlan: jest.fn().mockRejectedValue(new Error('SMTP down')),
    } as never as jest.Mocked<EmailService>;
    await expect(
      notifyNewPlan(users as never, email, 'u1', 'Plan A'),
    ).resolves.toBeUndefined();
  });
});
