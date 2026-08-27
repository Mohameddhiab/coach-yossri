"use client";

import Link from "next/link";
import { ChevronLeft, MessagesSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConversations } from "@/features/chat/hooks/useChat";

export function UnreadMessagesCard() {
  const { data: conversations } = useConversations(30000);
  const unreadRows = (conversations ?? [])
    .filter((c) => c.unread_count > 0)
    .sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""));
  const total = unreadRows.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessagesSquare className="size-4 text-primary" />
          رسائل غير مقروءة
          {total > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white tabular-nums">
              {total}
            </span>
          )}
        </CardTitle>
        <Link
          href="/messages"
          className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          الكل
          <ChevronLeft className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {!unreadRows.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد رسائل جديدة</p>
        ) : (
          <div className="space-y-1.5">
            {unreadRows.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href="/messages"
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.user_name}</span>
                <span className="max-w-[40%] truncate text-xs text-muted-foreground">
                  {c.last_message ?? ""}
                </span>
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-xs font-bold leading-none text-white tabular-nums">
                  {c.unread_count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
