"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageLoader } from "@/shared/components/page-loader";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { useConversations } from "@/features/chat/hooks/useChat";
import { cn, formatRelativeDate } from "@/lib/utils";

export function CoachInbox() {
  const { data: conversations, isLoading } = useConversations();
  const [picked, setPicked] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  if (isLoading) return <PageLoader rows={2} />;

  if (!conversations?.length) {
    return (
      <EmptyState
        icon={<MessagesSquare className="size-5" />}
        title="لا يوجد محادثات"
        description="يمكن لأعضاء باقة إيليت إرسال الرسائل إليك من هنا."
      />
    );
  }

  const selectedConv = conversations.find((c) => c.id === picked) ?? null;

  const openConversation = (id: string) => {
    setPicked(id);
    setThreadOpen(true);
  };

  return (
    <div className="grid h-[calc(100dvh-13rem)] min-h-[420px] gap-4 lg:grid-cols-[320px_1fr]">
      <Card
        className={cn("overflow-hidden", threadOpen && "hidden lg:block")}
      >
        <CardContent className="h-full space-y-1 overflow-y-auto p-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openConversation(c.id)}
              className={cn(
                "w-full rounded-lg p-3 text-start transition-colors",
                picked === c.id ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{c.user_name}</span>
                {c.unread_count > 0 && (
                  <Badge className="shrink-0 tabular-nums">{c.unread_count}</Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {c.last_message ?? "—"}
              </p>
              {c.last_message_at ? (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatRelativeDate(c.last_message_at)}
                </p>
              ) : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className={cn("min-h-0", !threadOpen && "hidden lg:block")}>
        {selectedConv ? (
          <ChatPanel
            conversationId={selectedConv.id}
            title={selectedConv.user_name}
            onBack={() => setThreadOpen(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed">
            <EmptyState
              icon={<MessagesSquare className="size-5" />}
              title="اختر محادثة"
              description="اختر عضوًا من القائمة لعرض الرسائل."
            />
          </div>
        )}
      </div>
    </div>
  );
}
