"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MonthlyGoal, Subscription, WeightLog } from "@/shared/lib/domain";
import { daysLeft, effectiveDateFin, isPaused } from "@/shared/lib/domain";
import { formatDate } from "@/lib/utils";

export function WeeklyReport({
  userName,
  logs,
  goal,
  subscription,
}: {
  userName: string;
  logs: WeightLog[] | undefined;
  goal: MonthlyGoal | null | undefined;
  subscription: Subscription | null | undefined;
}) {
  const sorted = [...(logs ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const now = new Date();
  const weekAgo = now.getTime() - 7 * 86400000;
  const weekLogs = sorted.filter((l) => new Date(l.date).getTime() >= weekAgo);
  const start = weekLogs[0] ?? sorted[0];
  const end = weekLogs[weekLogs.length - 1] ?? sorted[sorted.length - 1];
  const delta =
    start && end && start.id !== end.id
      ? Math.round((end.poids_kg - start.poids_kg) * 10) / 10
      : null;
  const weekCheckins = (goal?.checkins ?? []).filter(
    (c) => new Date(c).getTime() >= weekAgo,
  ).length;
  const reportEnd = now.toISOString();
  const reportStart = new Date(weekAgo).toISOString();

  return (
    <div>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer />
        بريم الأسبوع
      </Button>

      <div className="print-area">
        <div className="space-y-6 p-2 text-sm" dir="rtl">
          <header className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
            <div>
              <div className="text-2xl font-extrabold">Coach Yosri</div>
              <div>تقرير أسبوعي — {userName}</div>
            </div>
            <div className="text-xs">
              <div>من {formatDate(reportStart)}</div>
              <div>إلى {formatDate(reportEnd)}</div>
            </div>
          </header>

          <section>
            <h2 className="mb-2 text-base font-bold">الوزن</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-400">
                  <th className="py-1 text-start">بداية الأسبوع</th>
                  <th className="py-1 text-start">نهاية الأسبوع</th>
                  <th className="py-1 text-start">الفرق</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 font-bold">{start ? `${start.poids_kg} كغ` : "—"}</td>
                  <td className="py-1 font-bold">{end ? `${end.poids_kg} كغ` : "—"}</td>
                  <td className="py-1 font-bold">
                    {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta} كغ`}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold">الالتزام</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-400">
                  <th className="py-1 text-start">حصص الشهر هذا الأسبوع</th>
                  <th className="py-1 text-start">أوزان هذا الأسبوع</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 font-bold">{weekCheckins} حصة</td>
                  <td className="py-1 font-bold">{weekLogs.length} قياس</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold">الاشتراك</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-zinc-600">النهاية المقررة</td>
                  <td className="py-1 font-bold">
                    {subscription ? formatDate(effectiveDateFin(subscription).toISOString()) : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-zinc-600">الأيام الباقية</td>
                  <td className="py-1 font-bold">{subscription ? daysLeft(subscription) : "—"}</td>
                </tr>
                <tr>
                  <td className="py-1 text-zinc-600">تجميد</td>
                  <td className="py-1 font-bold">
                    {subscription && isPaused(subscription) ? "مجمّد الآن" : "لا"}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="border-t border-zinc-400 pt-3 text-xs">
            <div className="mb-6">توقيع المدرب: ______________________</div>
            <div>وثيقة داخلية — Coach Yosri · تنسخت {formatDate(reportEnd)}</div>
          </footer>
        </div>
      </div>
    </div>
  );
}