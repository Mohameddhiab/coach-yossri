import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SubscriptionStatus } from "@/shared/lib/domain";
import {
  addNote,
  createUser,
  deleteNote,
  deleteUser,
  getUser,
  listNotes,
  listUsers,
  resendVerifyEmail,
  resetPassword,
  updateUser,
  type CreateUserInput,
} from "@/features/users/api/users.api";

export function useUsers(search: string, status: SubscriptionStatus | "TOUS") {
  return useQuery({
    queryKey: ["users", search, status],
    queryFn: () => listUsers(search, status),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateUser>[1]) => updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => resetPassword(id),
  });
}

export function useResendVerifyEmail() {
  return useMutation({
    mutationFn: (id: string) => resendVerifyEmail(id),
  });
}

export function useNotes(userId: string) {
  return useQuery({
    queryKey: ["notes", userId],
    queryFn: () => listNotes(userId),
    enabled: !!userId,
  });
}

export function useAddNote(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contenu: string) => addNote(userId, contenu),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteNote(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", userId] }),
  });
}