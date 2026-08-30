import type { NotificationPrefs, User } from '../entities';

export const USER_REPOSITORY = Symbol('UserRepository');

export interface UserRepository {
  findByEmail(email: string): Promise<(User & { passwordHash: string }) | null>;
  findById(id: string): Promise<User | null>;
  listByRole(): Promise<User[]>;
  create(data: {
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
    dateNaissance: Date | null;
    coachId: string;
    referredBy: string | null;
    passwordHash: string;
    createdAt: Date;
  }): Promise<User>;
  update(
    id: string,
    patch: Partial<
      Pick<
        User,
        'nom' | 'prenom' | 'telephone' | 'dateNaissance' | 'sexe' | 'tailleCm'
      >
    >,
  ): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  touchLastLogin(id: string, at: Date): Promise<void>;
  markEmailVerified(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  prefsOf(userId: string): Promise<NotificationPrefs | null>;
  savePrefs(
    userId: string,
    prefs: Partial<NotificationPrefs>,
  ): Promise<NotificationPrefs>;
}
