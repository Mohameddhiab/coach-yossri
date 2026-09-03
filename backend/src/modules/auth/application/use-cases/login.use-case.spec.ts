import { LoginUseCase } from './login.use-case';
import { RequestEmailVerificationUseCase } from './verify-email.use-case';
import type { UserRepository } from '@/shared/domain/ports/user-repository.port';
import type { PasswordHasher } from '@/shared/domain/password';
import type { TokenService } from '@/shared/domain/token-service.port';
import type { User } from '@/shared/domain/entities';

function makeUser(over: Partial<User> = {}): User & { passwordHash: string } {
  return {
    id: 'u1',
    role: 'USER',
    email: 'a@b.c',
    nom: 'Nom',
    prenom: 'Prenom',
    telephone: '',
    dateNaissance: null,
    sexe: null,
    tailleCm: null,
    avatarUrl: null,
    emailVerified: false,
    emailVerifiedAt: null,
    lastLoginAt: null,
    coachId: null,
    referredBy: null,
    createdAt: new Date(),
    passwordHash: '<hash>',
    ...over,
  };
}

function setup(user: User & { passwordHash: string }) {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(user),
    touchLastLogin: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UserRepository>;
  const hasher = {
    verify: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<PasswordHasher>;
  const tokens = {
    signAccess: jest.fn().mockResolvedValue('access'),
    signRefresh: jest.fn().mockResolvedValue('refresh'),
  } as unknown as jest.Mocked<TokenService>;
  const requestEmailVerification = {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<RequestEmailVerificationUseCase>;
  const refreshSessions = {
    create: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<import('../../infrastructure/refresh-session.repository').RefreshSessionRepository>;
  const uc = new LoginUseCase(users, hasher, tokens, requestEmailVerification, refreshSessions);
  return { users, hasher, tokens, requestEmailVerification, refreshSessions, uc };
}

describe('LoginUseCase', () => {
  it('premier login non vérifié : enregistre lastLoginAt et envoie le lien de vérification', async () => {
    const { users, tokens, requestEmailVerification, uc } = setup(
      makeUser({ lastLoginAt: null, emailVerified: false }),
    );

    const result = await uc.execute('a@b.c', 'password');

    expect(users.touchLastLogin).toHaveBeenCalledWith('u1', expect.any(Date));
    expect(requestEmailVerification.execute).toHaveBeenCalledWith('u1');
    expect(tokens.signAccess).toHaveBeenCalled();
    expect(tokens.signRefresh).toHaveBeenCalled();
    expect(result.accessToken).toBe('access');
  });

  it('login suivant : lastLoginAt mis à jour mais pas de renvoi du lien', async () => {
    const { users, requestEmailVerification, uc } = setup(
      makeUser({ lastLoginAt: new Date(), emailVerified: false }),
    );

    await uc.execute('a@b.c', 'password');

    expect(users.touchLastLogin).toHaveBeenCalledWith('u1', expect.any(Date));
    expect(requestEmailVerification.execute).not.toHaveBeenCalled();
  });

  it('utilisateur déjà vérifié au premier login : pas de lien renvoyé', async () => {
    const { requestEmailVerification, uc } = setup(
      makeUser({ lastLoginAt: null, emailVerified: true }),
    );

    await uc.execute('a@b.c', 'password');

    expect(requestEmailVerification.execute).not.toHaveBeenCalled();
  });

  it('mauvais mot de passe : échec sans toucher lastLoginAt ni envoyer de lien', async () => {
    const user = makeUser();
    const { users, hasher, requestEmailVerification, uc } = setup(user);
    hasher.verify.mockResolvedValue(false);

    await expect(uc.execute('a@b.c', 'wrong')).rejects.toThrow();
    expect(users.touchLastLogin).not.toHaveBeenCalled();
    expect(requestEmailVerification.execute).not.toHaveBeenCalled();
  });
});
