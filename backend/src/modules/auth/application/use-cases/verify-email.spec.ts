import { ConfirmEmailVerificationUseCase } from './verify-email.use-case';
import type { UserRepository } from '@/shared/domain/ports/user-repository.port';
import type { EmailVerificationTokenRepository } from '../../infrastructure/email-verification-token.repository';

describe('ConfirmEmailVerificationUseCase', () => {
  it('marque le user vérifié quand le token est valide', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        emailVerified: false,
        email: 'a@b.c',
      }),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserRepository>;
    const tokens = {
      findValid: jest.fn().mockResolvedValue({ id: 't1', userId: 'u1' }),
      markUsed: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EmailVerificationTokenRepository>;

    const uc = new ConfirmEmailVerificationUseCase(users, tokens);
    await uc.execute('some-token');

    expect(tokens.markUsed).toHaveBeenCalledWith('t1');
    expect(users.markEmailVerified).toHaveBeenCalledWith('u1');
  });

  it('reste idempotent si le user est déjà vérifié', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        emailVerified: true,
        email: 'a@b.c',
      }),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserRepository>;
    const tokens = {
      findValid: jest.fn().mockResolvedValue({ id: 't1', userId: 'u1' }),
      markUsed: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EmailVerificationTokenRepository>;

    const uc = new ConfirmEmailVerificationUseCase(users, tokens);
    await uc.execute('some-token');

    expect(tokens.markUsed).toHaveBeenCalledWith('t1');
    expect(users.markEmailVerified).not.toHaveBeenCalled();
  });

  it('échoue quand le token est invalide ou expiré', async () => {
    const users = {
      findById: jest.fn(),
      markEmailVerified: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    const tokens = {
      findValid: jest.fn().mockResolvedValue(null),
      markUsed: jest.fn(),
    } as unknown as jest.Mocked<EmailVerificationTokenRepository>;

    const uc = new ConfirmEmailVerificationUseCase(users, tokens);
    await expect(uc.execute('bad-token')).rejects.toThrow();
    expect(users.markEmailVerified).not.toHaveBeenCalled();
  });
});
