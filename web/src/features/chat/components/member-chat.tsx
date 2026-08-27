"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MessagesSquare, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/shared/components/page-loader";
import { UpsellCard } from "@/features/subscriptions/components/tier-gate";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { sendFirstToCoach } from "@/features/chat/api/chat.api";
import { useMyConversation } from "@/features/chat/hooks/useChat";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { getActiveTier, tierAllows } from "@/shared/lib/domain";

function FirstMessageComposer() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const handleSend = async () => {
    const contenu = text.trim();
    if (!contenu) return;
    setPending(true);
    try {
      await sendFirstToCoach(contenu);
      qc.invalidateQueries({ queryKey: ["me", "conversation"] });
      toast.success("تم إرسال الرسالة ✓");
    } catch {
      toast.error("لم يتم الإرسال — حاول مرة أخرى");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessagesSquare className="size-5" />
        </div>
        <div>
          <div className="font-semibold">ابدأ المحادثة مع المدرب</div>
          <p className="mt-0.5 text-sm text-muted-foreground">أرسل رسالتك الأولى وسيتم إنشاء المحادثة 👋</p>
        </div>
        <form
          className="flex w-full max-w-sm items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالتك الأولى…"
            maxLength={4000}
          />
          <Button type="submit" size="icon" disabled={!text.trim() || pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function MemberChat() {
  const { data: subData, isLoading } = useMySubscription();
  const tier = subData ? getActiveTier(subData.subscription) : null;
  const allowed = tierAllows(tier, "chat");

  const conversationQuery = useMyConversation(allowed);
  const convId = conversationQuery.data?.id ?? null;

  if (isLoading || (allowed && conversationQuery.isLoading)) return <PageLoader rows={2} />;

  return (
    <div className="space-y-4">
      {!allowed ? (
        <UpsellCard require="PREMIUM_COACH" />
      ) : !convId ? (
        <FirstMessageComposer />
      ) : (
        <div className="h-[calc(100dvh-12rem)] min-h-[420px]">
          <ChatPanel conversationId={convId} />
        </div>
      )}
    </div>
  );
}

