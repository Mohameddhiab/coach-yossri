import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/lib/auth-context";
import {
  getMessages,
  getMyConversation,
  listConversations,
  markRead,
  sendMessage,
  type ChatMessageApi,
} from "@/features/chat/api/chat.api";

const POLL_MS = 30000;

export function useConversations(refreshMs: number = POLL_MS) {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    refetchInterval: refreshMs,
  });
}

export function useMyConversation(enabled = true) {
  return useQuery({
    queryKey: ["me", "conversation"],
    queryFn: getMyConversation,
    enabled,
  });
}

export function useMessages(conversationId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId as string),
    enabled: !!conversationId && enabled,
    refetchInterval: POLL_MS,
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (contenu: string) => sendMessage(conversationId as string, contenu),
    onMutate: async (contenu: string) => {
      await qc.cancelQueries({ queryKey: ["messages", conversationId] });
      const key = ["messages", conversationId] as const;
      const previous = qc.getQueryData<ChatMessageApi[]>(key);
      const optimistic: ChatMessageApi = {
        id: `optimistic-${crypto.randomUUID().slice(0, 8)}`,
        conversation_id: conversationId ?? "",
        sender_id: user?.id ?? "",
        sender_role: user?.role as "COACH" | "USER" | undefined,
        contenu,
        lu: false,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessageApi[]>(key, [
        ...(previous ?? []),
        optimistic,
      ]);
      return { previous, key };
    },
    onError: (_err, _contenu, context) => {
      if (context?.previous) {
        qc.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["me", "conversation"] });
    },
  });
}

export function useMarkRead(
  conversationId: string | null,
  enabled = true,
  trigger?: unknown,
) {
  const qc = useQueryClient();
  const lastFired = useRef<{ id: string | null; at: number }>({ id: null, at: 0 });

  const mutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "conversation"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    if (!conversationId || !enabled || !trigger) return;
    const now = Date.now();
    if (lastFired.current.id === conversationId && now - lastFired.current.at < 3000) return;
    lastFired.current = { id: conversationId, at: now };
    mutation.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, enabled, trigger]);
}
