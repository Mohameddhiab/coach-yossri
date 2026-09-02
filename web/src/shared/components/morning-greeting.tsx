"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/shared/lib/auth-context";
import { motivationOfToday } from "@/shared/lib/motivation";
import { useGoal } from "@/features/goals/hooks/useGoals";
import { currentStreak } from "@/features/goals/lib/streak";

export function MorningGreeting() {
  const { user } = useAuth();
  const userId = user?.id;
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const key = `coachyosri_greeting_${userId}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) !== today) {
      localStorage.setItem(key, today);
    }
  }, [userId]);

  const markedToday =
    mounted && userId
      ? localStorage.getItem(`coachyosri_greeting_${userId}`) === new Date().toISOString().slice(0, 10)
      : false;

  const { data: goal } = useGoal(userId ?? "");

  if (markedToday || dismissed || !user) return null;

  const streak = currentStreak(goal?.checkins ?? []);

  return (
    <Dialog open onOpenChange={(open) => !open && setDismissed(true)}>
      <DialogContent
        className="greeting-pop w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-2xl sm:max-w-sm"
        showCloseButton={false}
        aria-label="تحية الصباح"
      >
        <DialogTitle className="hidden" />
        <DialogDescription className="hidden" />
        <div className="text-xs font-medium text-primary">Coach Yosri</div>
        <h2 className="mt-1 text-2xl font-extrabold">صباح الخير يا {user.prenom} 👋</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{motivationOfToday()}</p>
        {streak > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <CalendarCheck className="size-3.5" />
            سلسلة حضورك: {streak} يومًا
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button asChild onClick={() => setDismissed(true)}>
            <Link href="/plan">
              <CalendarCheck />
              خطة اليوم
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => setDismissed(true)}>
            <Link href="/progression">
              <Scale />
              سجّل وزنك
            </Link>
          </Button>
        </div>
        <button
          className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setDismissed(true)}
        >
          تجاهل التنبيه اليوم
        </button>
      </DialogContent>
    </Dialog>
  );
}