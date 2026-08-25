"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightLog } from "@/shared/lib/domain";
import { formatDateShort } from "@/lib/utils";

interface DotProps {
  cx?: number;
  cy?: number;
  r?: number;
  payload?: { poids?: number };
}

interface TooltipContentProps {
  active?: boolean;
  payload?: readonly { payload?: { label: string; poids: number } }[];
}

function WeightPlateDot({ cx, cy, r, payload }: DotProps) {
  if (!payload?.poids || cx === undefined || cy === undefined) return null;
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r={r ? r + 2.5 : 4} fill="var(--primary)" opacity={0.15} />
      <circle r={r} fill="var(--background)" stroke="var(--primary)" strokeWidth={2} />
      <circle r={r ? r * 0.35 : 1.5} fill="var(--primary)" />
    </g>
  );
}

export function WeightChart({ logs, height = 260 }: { logs: WeightLog[]; height?: number }) {
  const data = [...logs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => ({
      date: new Date(log.date).getTime(),
      label: formatDateShort(log.date),
      poids: log.poids_kg,
    }));

  if (data.length === 0) return null;

  const min = Math.floor(Math.min(...data.map((d) => d.poids)) - 2);
  const max = Math.ceil(Math.max(...data.map((d) => d.poids)) + 2);

  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.4 }}
            content={({ active, payload: p }: TooltipContentProps) => {
              if (!active || !p?.length || !p[0].payload) return null;
              const point = p[0].payload;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg">
                  <div className="font-semibold">{point.label}</div>
                  <div className="text-primary font-extrabold tabular-nums">
                    {point.poids} كغ
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="poids"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#weightFill)"
            dot={<WeightPlateDot />}
            activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}