import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { WeightLog } from "@/shared/lib/domain";
import type { WeightTarget } from "@/shared/lib/insights";
import { storageGet, storageRemove, storageSet } from "@/shared/lib/storage";

export function listWeightLogs(userId: string) {
  return apiClient<WeightLog[]>("GET", `/users/${userId}/weight-logs`);
}

export function addWeightLog(userId: string, poids_kg: number, note?: string) {
  return apiClient<WeightLog>("POST", `/users/${userId}/weight-logs`, {
    poids_kg,
    note: note ?? undefined,
  });
}

export function deleteWeightLog(logId: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/weight-logs/${logId}`);
}

export function getWeightTarget(userId: string) {
  return apiClient<WeightTarget | null>("GET", `/users/${userId}/weight-target`);
}

export function setWeightTarget(userId: string, target: WeightTarget) {
  return apiClient<WeightTarget>("PUT", `/users/${userId}/weight-target`, target);
}

export function deleteWeightTarget(userId: string) {
  return apiClient<{ ok: boolean }>("DELETE", `/users/${userId}/weight-target`);
}

/* ------------------- File hors-ligne pour les poids ------------------- */

const PENDING_KEY = "coachyosri_pending_weights";

export interface PendingWeight {
  poids_kg: number;
  note?: string;
}

export async function getPendingWeights(): Promise<PendingWeight[]> {
  const raw = await storageGet(PENDING_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingWeight[];
  } catch {
    return [];
  }
}

export async function enqueuePendingWeight(weight: PendingWeight): Promise<void> {
  const pending = await getPendingWeights();
  await storageSet(PENDING_KEY, JSON.stringify([...pending, weight]));
}

export async function clearPendingWeights(): Promise<void> {
  await storageRemove(PENDING_KEY);
}

export function useWeightLogs(userId: string) {
  return useQuery({
    queryKey: ["weight-logs", userId],
    queryFn: () => listWeightLogs(userId),
    enabled: !!userId,
  });
}

export function useAddWeight(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poids_kg, note }: { poids_kg: number; note?: string }) =>
      addWeightLog(userId, poids_kg, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-logs", userId] });
    },
  });
}

export function useDeleteWeight(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => deleteWeightLog(logId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-logs", userId] });
    },
  });
}

export function useWeightTarget(userId: string) {
  return useQuery({
    queryKey: ["weight-target", userId],
    queryFn: () => getWeightTarget(userId),
    enabled: !!userId,
  });
}

export function useSetWeightTarget(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: WeightTarget) => setWeightTarget(userId, target),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-target", userId] }),
  });
}

export function useDeleteWeightTarget(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteWeightTarget(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-target", userId] }),
  });
}