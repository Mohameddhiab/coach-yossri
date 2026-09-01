import { useEffect, useRef, useState } from "react";
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
const VISIBLE_POLL_MS = 8000;

function useVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document !== "undefined" ? document.visibilityState === "visible" : true,
  );
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    window.addEventListener("blur", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      window.removeEventListener("blur", onVis);
    };
  }, []);
  return visible;
}

function useChatPollMs(fallbackMs: number): number {
  const visible = useVisible();
  return visible ? VISIBLE_POLL_MS : fallbackMs;
}

export function useConversations(refreshMs: number = POLL_MS) {
  const pollMs = useChatPollMs(refreshMs);
  return useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    refetchInterval: pollMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
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
  const pollMs = useChatPollMs(POLL_MS);
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId as string),
    enabled: !!conversationId && enabled,
    refetchInterval: pollMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (vars: string | { contenu: string; file?: File | null }) => {
      const c = typeof vars === "string" ? vars : vars.contenu;
      const f = typeof vars === "string" ? undefined : vars.file;
      return sendMessage(conversationId as string, c, f ?? undefined);
    },
    onMutate: async (vars: string | { contenu: string; file?: File | null }) => {
      const contenu = typeof vars === "string" ? vars : vars.contenu;
      const file = typeof vars === "string" ? null : vars.file ?? null;
      await qc.cancelQueries({ queryKey: ["messages", conversationId] });
      const key = ["messages", conversationId] as const;
      const previous = qc.getQueryData<ChatMessageApi[]>(key);
      const optimistic: ChatMessageApi = {
        id: `optimistic-${crypto.randomUUID().slice(0, 8)}`,
        conversation_id: conversationId ?? "",
        sender_id: user?.id ?? "",
        sender_role: user?.role as "COACH" | "USER" | undefined,
        contenu,
        attachment_url: file ? URL.createObjectURL(file) : null,
        attachment_type: file?.type ?? null,
        attachment_name: file?.name ?? null,
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
