"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const DAY_LABELS = ["إحد", "اثن", "ثلا", "أربع", "خميس", "جمعة", "سبت"];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ActivityHeatmap({ dates }: { dates: string[] }) {
  const dateSet = new Set(dates.map((d) => d.slice(0, 10)));
  const today = new Date();
  const todayKey = toDateKey(today);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday

  // month name in Arabic
  const monthLabel = today.toLocaleDateString("ar-TN", {
    month: "long",
    year: "numeric",
  });

  // Build calendar cells: leading empties + days + trailing empties to fill rows
  type CalCell = { day: number | null; key: string; active: boolean; isToday: boolean };
  const cells: CalCell[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, key: `pad-start-${i}`, active: false, isToday: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = toDateKey(d);
    cells.push({
      day,
      key,
      active: dateSet.has(key),
      isToday: key === todayKey,
    });
  }
  // pad to complete last row
  while (cells.length % 7 !== 0) {
    cells.push({
      day: null,
      key: `pad-end-${cells.length}`,
      active: false,
      isToday: false,
    });
  }

  const activeCount = cells.filter((c) => c.active).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            نشاطي هذا الشهر
          </CardTitle>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
            {monthLabel} · {activeCount} / {daysInMonth}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((l) => (
            <div
              key={l}
              className="pb-1 text-center text-[11px] font-semibold text-muted-foreground"
            >
              {l}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {cells.map((cell) => {
            if (cell.day === null) {
              return <div key={cell.key} className="aspect-square" />;
            }
            return (
              <div
                key={cell.key}
                title={`${cell.key}${cell.active ? " — تم التمرين" : ""}`}
                className={[
                  "flex aspect-square items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition-all",
                  cell.active
                    ? "border-emerald-600/20 bg-emerald-500 text-white shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50",
                  cell.isToday ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background" : "",
                ].join(" ")}
              >
                {cell.day}
              </div>
            );
          })}
        </div>

        {/* Legend + summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-md border border-border bg-card" />
              لم تتم
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-md border border-emerald-600/20 bg-emerald-500" />
              تم التمرين
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-md border-2 border-amber-400 bg-card" />
              اليوم
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {activeCount === 0
              ? "لم تسجّل أي حضور هذا الشهر بعد"
              : activeCount === 1
                ? "يوم واحد نشط هذا الشهر"
                : `${activeCount} أيام نشطة هذا الشهر`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
