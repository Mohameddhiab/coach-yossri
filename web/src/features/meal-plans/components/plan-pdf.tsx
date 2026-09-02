"use client";

import type { MealPlan, MonthlyGoal, WeekDay, WeightLog } from "@/shared/lib/domain";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  OBJECTIVE_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
} from "@/shared/lib/domain";
import type { WeightTarget } from "@/shared/lib/insights";
import { targetProgress } from "@/shared/lib/insights";
import { currentStreak } from "@/features/goals/lib/streak";
import { formatDateShort } from "@/lib/utils";

const moisFmt = new Intl.DateTimeFormat("ar-TN", { month: "long", year: "numeric" });

function fixLabColors(doc: Document) {
  doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) return;
    const props: (keyof CSSStyleDeclaration)[] = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderBottomColor",
      "borderLeftColor",
      "borderRightColor",
    ];
    for (const p of props) {
      const v = cs.getPropertyValue(p as string);
      if (v && (v.includes("lab(") || v.includes("oklch(") || v.includes("oklab("))) {
        if (String(p).includes("background")) el.style.setProperty(p as string, "#ffffff", "important");
        else if (String(p).includes("border")) el.style.setProperty(p as string, "#e5e7eb", "important");
        else el.style.setProperty(p as string, "#171717", "important");
      }
    }
    const inline = el.getAttribute("style");
    if (inline && (inline.includes("lab(") || inline.includes("oklch(") || inline.includes("oklab("))) {
      el.setAttribute(
        "style",
        inline.replace(/lab\([^)]+\)/g, "#171717").replace(/oklch\([^)]+\)/g, "#171717").replace(/oklab\([^)]+\)/g, "#171717"),
      );
    }
  });
}

export async function downloadPlanPdf(element: HTMLElement, filename: string) {
  await document.fonts.ready;
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve, reject) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          const t = setTimeout(() => reject(new Error(`Image timeout: ${img.src}`)), 8000);
          img.onload = () => {
            clearTimeout(t);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(t);
            reject(new Error(`Image failed: ${img.src}`));
          };
        }),
    ),
  );
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas-pro");
    const canvas = await (html2canvas as unknown as (el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLCanvasElement>)(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth || 794,
      useCORS: true,
      allowTaint: false,
      logging: false,
      onclone: (clonedDoc: Document) => fixLabColors(clonedDoc),
    });
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ unit: "px", format: "a4", compress: true });
    const pdfW = doc.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    doc.save(filename);
  } catch (e) {
    console.error("[pdf] meal html2canvas failed", e);
    throw new Error("Échec de la génération du PDF du plan alimentaire. Vérifiez votre connexion et réessayez.");
  }
}

export function PlanPdfDocument({
  plan,
  logs,
  target,
  goal,
}: {
  plan: MealPlan;
  logs: WeightLog[];
  target: WeightTarget | null;
  goal: MonthlyGoal | null;
}) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const recent = sorted.slice(-10);
  const first = sorted[0];
  const current = sorted[sorted.length - 1];
  const delta = first && current ? current.poids_kg - first.poids_kg : null;
  const progress = targetProgress(logs, target);
  const streak = currentStreak(goal?.checkins ?? []);
  const moisLabel = goal
    ? moisFmt.format(new Date(`${goal.mois}-01T12:00:00`))
    : null;

  return (
    <div
      data-pdf-doc
      dir="rtl"
      className="w-[794px] bg-white px-10 py-8 text-[13px] leading-relaxed text-neutral-800"
    >
      <header className="border-b-2 border-amber-500 pb-4">
        <h1 className="text-2xl font-black text-neutral-900">Coach Yosri — الخطة الغذائية</h1>
        <div className="mt-1 font-semibold text-neutral-900">
          {plan.titre} · {OBJECTIVE_LABELS[plan.objectif]} · الإصدار {plan.version}
        </div>
        <div className="mt-1 text-neutral-500">
          ماكروز يومياً: {plan.calories_cible} سعرة · {plan.proteines_g}غ بروتين ·{" "}
          {plan.glucides_g}غ كربوهيدرات · {plan.lipides_g}غ دهون
        </div>
      </header>

      {WEEK_DAYS.map((day: WeekDay) => {
        const dayMeals = plan.meals.filter(
          (m) => m.jour_semaine === day || m.jour_semaine === "TOUS_LES_JOURS",
        );
        return (
          <section key={day} className="mt-6">
            <h2 className="mb-2 border-b border-neutral-200 pb-1 text-[15px] font-extrabold text-neutral-900">
              {day === "TOUS_LES_JOURS" ? "جميع الأيام" : WEEK_DAY_LABELS[day]}
            </h2>
            {dayMeals.length === 0 ? (
              <p className="text-neutral-500">لا توجد وجبات مسجلة</p>
            ) : (
              <div className="space-y-2">
                {MEAL_TYPE_ORDER.map((type) => {
                  const meals = dayMeals.filter((m) => m.type_repas === type);
                  if (meals.length === 0) return null;
                  return (
                    <div key={type} className="rounded-lg border border-neutral-200 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                          {MEAL_TYPE_LABELS[type]}
                        </span>
                        {meals[0].calories ? (
                          <span className="text-xs text-neutral-500">{meals[0].calories} سعرة</span>
                        ) : null}
                      </div>
                      {meals.map((meal) => (
                        <div key={meal.id} className="mb-1.5 last:mb-0">
                          <p className="leading-relaxed">{meal.description}</p>
                          <p className="text-xs text-neutral-500">
                            {meal.proteines_g ? `${meal.proteines_g}غ بروتين` : ""}
                            {meal.proteines_g && meal.glucides_g ? " · " : ""}
                            {meal.glucides_g ? `${meal.glucides_g}غ كربوهيدرات` : ""}
                            {meal.glucides_g && meal.lipides_g ? " · " : ""}
                            {meal.lipides_g ? `${meal.lipides_g}غ دهون` : ""}
                          </p>
                          {meal.alternatives ? (
                            <p className="text-xs text-neutral-500">البديل المتاح: {meal.alternatives}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <section className="mt-8 border-t-2 border-amber-500 pt-4">
        <h2 className="text-lg font-black text-neutral-900">متابعة التقدم مع الخطة</h2>

        {goal ? (
          <div className="mt-3 rounded-lg border border-neutral-200 p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">هدف الشهر: {goal.titre}</span>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-700">
                {moisLabel}
              </span>
            </div>
            <div className="mt-1 text-neutral-600">
              {goal.checkins.length} / {goal.cible} حصص · سلسلة {streak} أيام
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: `${Math.min(100, Math.round((goal.checkins.length / goal.cible) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-neutral-200 p-3">
            <div className="text-xs text-neutral-500">الوزن الحالي</div>
            <div className="mt-1 text-lg font-black text-neutral-900">
              {current ? `${current.poids_kg.toFixed(1)} كغم` : "—"}
            </div>
            {delta !== null ? (
              <div
                className={`text-xs font-bold ${
                  delta <= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} كغم من البداية
              </div>
            ) : null}
          </div>
          <div className="rounded-lg border border-neutral-200 p-3">
            <div className="text-xs text-neutral-500">الوزن المبدئي (الأول)</div>
            <div className="mt-1 text-lg font-black text-neutral-900">
              {first ? `${first.poids_kg.toFixed(1)} كغم` : "—"}
            </div>
            {first ? <div className="text-xs text-neutral-500">{formatDateShort(first.date)}</div> : null}
          </div>
        </div>

        {target ? (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">الهدف: {target.poids_kg} كغم</span>
              <span className="text-xs text-neutral-600">قبل {formatDateShort(target.date)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-neutral-700">{progress}%</span>
            </div>
          </div>
        ) : null}

        {recent.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-neutral-100 text-xs font-bold text-neutral-700">
                  <th className="border-b border-neutral-200 px-3 py-2">التاريخ</th>
                  <th className="border-b border-neutral-200 px-3 py-2">الوزن</th>
                  <th className="border-b border-neutral-200 px-3 py-2">الفرق</th>
                </tr>
              </thead>
              <tbody>
                {[...recent].reverse().map((log, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? log.poids_kg - prev.poids_kg : null;
                  return (
                    <tr key={log.id} className="border-b border-neutral-100 last:border-b-0">
                      <td className="px-3 py-1.5 text-neutral-600">{formatDateShort(log.date)}</td>
                      <td className="px-3 py-1.5 font-bold text-neutral-900">
                        {log.poids_kg.toFixed(1)} كغم
                      </td>
                      <td
                        className={`px-3 py-1.5 text-xs font-bold ${
                          diff === null
                            ? "text-neutral-400"
                            : diff <= 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                        }`}
                      >
                        {diff === null ? "—" : diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-neutral-500">
            لا توجد أوزان مسجلة بعد — سجّل وزنك بانتظام لنتابع تقدمك باستمرار.
          </p>
        )}
      </section>

      <footer className="mt-8 border-t border-neutral-200 pt-3 text-center text-xs text-neutral-500">
        مع تمنياتنا لك بدوام الصحة والقوة — Coach Yosri · تم الاستخراج في {formatDateShort(new Date().toISOString())}
      </footer>
    </div>
  );
}