import { apiClient } from "@/shared/lib/api-client";
import type { User } from "@/shared/lib/domain";

export async function updateProfile(patch: {
  nom?: string;
  prenom?: string;
  telephone?: string;
  sexe?: string | null;
  taille_cm?: number | null;
  date_naissance?: string | null;
}): Promise<User> {
  return apiClient<User>("PATCH", "/auth/profile", patch);
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient<{ avatar_url: string }>("POST", "/auth/profile/avatar", fd);
}
