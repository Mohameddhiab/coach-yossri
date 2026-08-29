"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatsGrowthRow, StatsSummary } from "@/features/stats/api/stats.api";

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "ACTIF", label: "نشط", color: "#10b981" },
  { key: "EXPIRE_BIENTOT", label: "ينتهي قريباً", color: "#f59e0b" },
  { key: "EXPIRE", label: "منتهي", color: "#ef4444" },
];

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ar-TN", { month: "short" });
}

export function MemberGrowthChart({ growth }: { growth: StatsGrowthRow[] }) {
  const data = useMemo(
    () =>
      growth.map((r) => ({
        label: monthLabel(r.mois),
        membres: r.cumul,
        ajouts: r.nouveaux,
      })),
    [growth],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">نمو أعداد المشتركين</CardTitle>
        <CardDescription>إجمالي المشتركين المسجلين شهريًا</CardDescription>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="membres"
                name="المشتركون"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#growthFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SubscriptionStatusChart({ summary }: { summary: StatsSummary }) {
  const data = STATUS_META.map((s) => ({
    name: s.label,
    value:
      s.key === "ACTIF"
        ? summary.actifs
        : s.key === "EXPIRE_BIENTOT"
          ? summary.expirant7j
          : summary.expires,
    color: s.color,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">حالة الاشتراكات</CardTitle>
        <CardDescription>توزيع المشتركين حسب حالة الاشتراك</CardDescription>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
                style={{ fontSize: 22, fontWeight: 800 }}
              >
                {total}
              </text>
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                مشترك
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}