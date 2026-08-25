import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  importWgerExercise,
  listLocalExercises,
  searchWgerExercises,
  type Exercise,
} from "@/features/exercises/api/exercises.api";
import { useDebounced } from "@/shared/hooks/useDebounced";

export function useLocalExercises(q: string) {
  return useQuery({
    queryKey: ["exercises", q],
    queryFn: () => listLocalExercises(q),
  });
}

export function useWgerSearch(term: string) {
  const debounced = useDebounced(term, 350);
  return useQuery({
    queryKey: ["wger-search", debounced],
    queryFn: () => searchWgerExercises(debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useImportWgerExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wgerUuid: string) => importWgerExercise(wgerUuid),
    onSuccess: (ex: Exercise) => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      qc.setQueryData<Exercise[]>(["exercises", ""], (prev) =>
        prev ? [ex, ...prev.filter((e) => e.id !== ex.id)].slice(0, 30) : [ex],
      );
    },
  });
}
