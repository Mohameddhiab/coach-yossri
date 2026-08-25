"use client";

import { TrendingDown, TrendingUp, Minus, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WeightLog } from "@/shared/lib/domain";
import { projectWeight } from "@/shared/lib/insights";
import { cn } from "@/lib/utils";

export function WeightProjectionCard({
  logs,
  daysAhead = 28,
}: {
  logs: WeightLog[] | undefined;
  daysAhead?: number;
}) {
  const projection = projectWeight(logs ?? [], daysAhead);
  if (!projection) return null;

  const { projected, slopePerWeek, label } = projection;
  const Icon = slopePerWeek > 0.05 ? TrendingUp : slopePerWeek < -0.05 ? TrendingDown : Minus;
  const tone =
    slopePerWeek > 0.05 ? "text-destructive" : slopePerWeek < -0.05 ? "text-emerald-500" : "";

  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Target className="size-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">التوقع ({label})</div>
            <div className="text-xs text-muted-foreground">
              وتيرة حالية: {slopePerWeek > 0 ? "+" : ""}
              {slopePerWeek} كغ / أسبوع
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-5", tone)} />
          <span className={cn("text-2xl font-black tabular-nums", tone)}>{projected}</span>
          <span className="text-xs text-muted-foreground">كغ</span>
        </div>
      </CardContent>
    </Card>
  );
}