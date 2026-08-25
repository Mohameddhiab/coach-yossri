import { apiClient } from "@/shared/lib/api-client";
import type { ProgressPhoto, WeightLog } from "@/shared/lib/domain";

export function listWeightLogs(userId: string) {
  return apiClient<WeightLog[]>("GET", `/users/${userId}/weight-logs`);
}

export function addWeightLog(userId: string, input: { poids_kg: number; note?: string; date?: string }) {
  return apiClient<WeightLog>("POST", `/users/${userId}/weight-logs`, input);
}

export function deleteWeightLog(logId: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/weight-logs/${logId}`);
}

export function listPhotos(userId: string) {
  return apiClient<ProgressPhoto[]>("GET", `/users/${userId}/photos`);
}

export function addPhoto(userId: string, input: { url: string; note?: string }) {
  return apiClient<ProgressPhoto>("POST", `/users/${userId}/photos`, input);
}

export function deletePhoto(photoId: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/photos/${photoId}`);
}