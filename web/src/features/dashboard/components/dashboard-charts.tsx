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
import type { UserWithSubscription } from "@/shared/lib/domain";
import { getSubscriptionStatus } from "@/shared/lib/domain";

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "ACTIF", label: "نشط", color: "#10b981" },
  { key: "EXPIRE_BIENTOT", label: "أوشك على الانتهاء", color: "#f59e0b" },
  { key: "EXPIRE", label: "منتهي", color: "#ef4444" },
];

export function MemberGrowthChart({ users }: { users: UserWithSubscription[] }) {
  const data = useMemo(() => {
    const now = new Date();
    const buckets = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
    }
    for (const u of users) {
      const d = new Date(u.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    let cumul = 0;
    return Array.from(buckets.entries()).map(([key, count]) => {
      cumul += count;
      const [y, m] = key.split("-").map(Number);
      const label = new Date(y, m, 1).toLocaleDateString("ar-TN", { month: "short" });
      return { label, membres: cumul, ajouts: count };
    });
  }, [users]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">نمو الأعضاء</CardTitle>
        <CardDescription>إجمالي الأعضاء المسجّلين شهر بشهر</CardDescription>
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
                name="الأعضاء"
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

export function SubscriptionStatusChart({ users }: { users: UserWithSubscription[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) {
      const status = getSubscriptionStatus(u.subscription);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return STATUS_META.map((s) => ({ name: s.label, value: counts.get(s.key) ?? 0, color: s.color }));
  }, [users]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">وضعية الاشتراكات</CardTitle>
        <CardDescription>توزيع الأعضاء حسب حالة اشتراكهم</CardDescription>
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
                عضو
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}