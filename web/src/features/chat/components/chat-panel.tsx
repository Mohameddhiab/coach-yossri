"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/lib/auth-context";
import { ErrorState } from "@/shared/components/error-state";
import {
  useMarkRead,
  useMessages,
  useSendMessage,
} from "@/features/chat/hooks/useChat";
import { cn, formatTime } from "@/lib/utils";

export function ChatPanel({
  conversationId,
  title,
  emptyHint,
  onBack,
}: {
  conversationId: string;
  title?: string;
  emptyHint?: string;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMessages(conversationId);
  const send = useSendMessage(conversationId);

  useMarkRead(conversationId, true, messages);

  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const contenu = text.trim();
    if (!contenu) return;
    setText("");
    try {
      await send.mutateAsync(contenu);
    } catch {
      toast.error("لم يتم إرسال الرسالة — حاول مرة أخرى");
      setText(contenu);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border">
      {title ? (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-semibold">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 lg:hidden"
              aria-label="رجوع للقائمة"
              onClick={onBack}
            >
              <ArrowRight className="size-4" />
            </Button>
          )}
          <span className="truncate">{title}</span>
        </div>
      ) : null}

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4" dir="auto">
        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="ms-auto h-10 w-2/3 rounded-xl" />
            <Skeleton className="h-10 w-1/2 rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
        ) : !messages?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyHint ?? "ابدا المحادثة — ابعث أول رسالة 👋"}
          </p>
        ) : (
          messages.map((m) => {
            const mine =
              m.sender_id === user?.id ||
              (m.sender_role != null && m.sender_role === (user?.role as string));
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {m.contenu}
                  <span
                    className={cn(
                      "mt-0.5 block text-[10px] tabular-nums",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                    dir="ltr"
                  >
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة…"
          maxLength={4000}
        />
        <Button type="submit" size="icon" disabled={!text.trim() || send.isPending}>
          {send.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
