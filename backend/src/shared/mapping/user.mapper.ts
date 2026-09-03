import type { User } from '../domain/entities';

export interface UserApi {
  id: string;
  role: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  date_naissance: string | null;
  sexe: string | null;
  taille_cm: number | null;
  avatar_url: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  coach_id: string | null;
  referred_by: string | null;
  created_at: string;
}

export function toUserApi(u: User): UserApi {
  return {
    id: u.id,
    role: u.role,
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    telephone: u.telephone,
    date_naissance: u.dateNaissance ? u.dateNaissance.toISOString() : null,
    sexe: u.sexe,
    taille_cm: u.tailleCm,
    avatar_url: u.avatarUrl,
    email_verified: u.emailVerified,
    email_verified_at: u.emailVerifiedAt
      ? u.emailVerifiedAt.toISOString()
      : null,
    coach_id: u.coachId,
    referred_by: u.referredBy,
    created_at: u.createdAt.toISOString(),
  };
}
