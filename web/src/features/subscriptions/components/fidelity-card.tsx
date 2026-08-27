"use client";

import { Medal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeFidelity, FIDELITY_LABELS } from "@/shared/lib/insights";
import type { Subscription } from "@/shared/lib/domain";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<string, string> = {
  BRONZE: "bg-orange-700/15 text-orange-700 dark:text-orange-500",
  SILVER: "bg-slate-400/15 text-slate-600 dark:text-slate-300",
  GOLD: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
};

export function FidelityCard({ history }: { history: Subscription[] | null | undefined }) {
  const fidelity = computeFidelity(history);
  if (!fidelity.level) return null;

  const levelLabel = FIDELITY_LABELS[fidelity.level];
  const nextLabel = fidelity.nextLevel ? FIDELITY_LABELS[fidelity.nextLevel] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Medal className={cn("size-4", LEVEL_STYLES[fidelity.level])} />
          بطاقة الوفاء
        </CardTitle>
        <CardDescription>التجديد المتواصل مكافأة — الالتزام يُحتسب</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full text-lg font-black",
              LEVEL_STYLES[fidelity.level],
            )}
          >
            {fidelity.months >= 12 ? "★" : fidelity.months >= 6 ? "◈" : "◆"}
          </span>
          <div>
            <div className="font-bold">{levelLabel}</div>
            <div className="text-xs text-muted-foreground">
              {fidelity.months} شهور مع المدرب — {fidelity.renewals} تجديد
            </div>
          </div>
        </div>
        {nextLabel && fidelity.monthsToNext !== null && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{fidelity.months} شهر</span>
              <span>{fidelity.monthsToNext} أشهر حتى تصل إلى {nextLabel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-600 transition-all"
                style={{
                  width: `${Math.min(100, (fidelity.months / (fidelity.months + fidelity.monthsToNext)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}