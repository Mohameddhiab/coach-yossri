"use client";

import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { CoachInbox } from "@/features/chat/components/coach-inbox";
import { MemberChat } from "@/features/chat/components/member-chat";
import { useAuth } from "@/shared/lib/auth-context";

export default function MessagesPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return <PageLoader rows={2} />;

  return user.role === "COACH" ? (
    <div className="space-y-4">
      <PageHeader title="الرسائل" description="محادثاتك مع أعضاء القاعة" />
      <CoachInbox />
    </div>
  ) : (
    <div className="space-y-4">
      <PageHeader title="الرسائل" description="محادثتك مع مدربك" />
      <MemberChat />
    </div>
  );
}
