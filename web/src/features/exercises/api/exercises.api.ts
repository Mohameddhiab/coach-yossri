import { apiClient } from "@/shared/lib/api-client";

export interface WgerSearchItem {
  wgerId: number;
  wgerUuid: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  licenseTitle: string | null;
  licenseAuthor: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  source: "WGER" | "MANUAL";
  wgerUuid: string | null;
  category: string | null;
  licenseTitle: string | null;
  licenseAuthor: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function searchWgerExercises(term: string) {
  return apiClient<WgerSearchItem[]>("GET", `/exercises/wger/search?term=${encodeURIComponent(term)}`);
}

export function importWgerExercise(wger_uuid: string) {
  return apiClient<Exercise>("POST", "/exercises/wger/import", { wger_uuid });
}

export function listLocalExercises(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiClient<Exercise[]>("GET", `/exercises${qs}`);
}
