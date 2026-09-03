"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const WEEKS = 5;
const DAY_LABELS = ["إحد", "ثن", "ثلا", "أربع", "خم", "جمع", "سبت"];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ActivityHeatmap({ dates }: { dates: string[] }) {
  const dateSet = new Set(dates.map((d) => d.slice(0, 10)));
  const today = new Date();
  const todayDow = today.getDay();
  const totalDays = WEEKS * 7;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + ((6 - todayDow) % 7));

  const cells: { key: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    cells.push({
      key,
      active: dateSet.has(key),
      isToday: key === toDateKey(today),
    });
  }

  const weeks: typeof cells[] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-primary" />
          نشاطي هذا الشهر
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-0.5 pt-0.5">
            {DAY_LABELS.map((l) => (
              <span key={l} className="flex h-[18px] items-center text-[9px] text-muted-foreground">
                {l}
              </span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={cell.key}
                  className={`h-[18px] w-[18px] rounded-[3px] border transition-colors ${
                    cell.active
                      ? "border-emerald-600/30 bg-emerald-500"
                      : "border-border bg-muted/40"
                  } ${cell.isToday ? "ring-2 ring-primary/40" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-[2px] bg-muted/40 border border-border" />
          <span>لم تتم</span>
          <div className="ml-2 h-2.5 w-2.5 rounded-[2px] bg-emerald-500 border border-emerald-600/30" />
          <span>تم التمرين</span>
        </div>
      </CardContent>
    </Card>
  );
}
