"use client";

import {
  CalendarDays,
  Dumbbell,
  Flame,
  Medal,
  Scale,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyStats } from "@/features/stats/hooks/useStats";
import { BADGE_DEFS, type BadgeDef } from "@/shared/lib/insights";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<BadgeDef["icon"], typeof Scale> = {
  scale: Scale,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  medal: Medal,
  calendar: CalendarDays,
  target: Target,
  dumbbell: Dumbbell,
};

export function BadgeShowcase() {
  const { data: stats, isLoading } = useMyStats();
  const unlocked = new Set(stats?.engaged_badges ?? []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4 text-primary" />
          إنجازاتي
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="size-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {BADGE_DEFS.map(({ id, label, description, icon }) => {
              const Icon = BADGE_ICONS[icon];
              const isUnlocked = unlocked.has(id);
              return (
                <div key={id} className="flex shrink-0 flex-col items-center gap-1 group">
                  <div
                    className={cn(
                      "flex size-14 items-center justify-center rounded-xl border transition-all",
                      isUnlocked
                        ? "border-amber-400/40 bg-amber-500/15 text-amber-500"
                        : "border-border bg-muted/40 text-muted-foreground/40",
                    )}
                  >
                    <Icon className="size-7" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] leading-tight text-center",
                      isUnlocked ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
