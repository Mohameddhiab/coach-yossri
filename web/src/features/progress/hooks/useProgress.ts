import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPhoto,
  addWeightLog,
  deletePhoto,
  deleteWeightLog,
  listPhotos,
  listWeightLogs,
} from "@/features/progress/api/progress.api";

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
    mutationFn: (input: Parameters<typeof addWeightLog>[1]) => addWeightLog(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-logs", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteWeight(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => deleteWeightLog(logId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-logs", userId] }),
  });
}

export function usePhotos(userId: string) {
  return useQuery({
    queryKey: ["photos", userId],
    queryFn: () => listPhotos(userId),
    enabled: !!userId,
  });
}

export function useAddPhoto(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof addPhoto>[1]) => addPhoto(userId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos", userId] }),
  });
}

export function useDeletePhoto(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos", userId] }),
  });
}