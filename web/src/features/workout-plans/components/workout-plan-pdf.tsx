"use client";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import type { WeekDay } from "@/shared/lib/domain";
import { OBJECTIVE_LABELS, WEEK_DAYS, WEEK_DAY_LABELS } from "@/shared/lib/domain";
import type { WorkoutPlan } from "@/features/workout-plans/api/workoutPlans.api";
import { formatDateShort } from "@/lib/utils";
import { getGuideImageUrl, getGuideImageUrls } from "@/shared/lib/exercise-guide-map";
import { fallbackForCategory } from "@/shared/lib/exercise-fallbacks";

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

export async function downloadWorkoutPdf(element: HTMLElement, filename: string) {
  // Fallback to direct jsPDF generation if html2canvas fails (e.g. lab colors)
  // We try html2canvas-pro first, then direct.
  try {
    const canvas = await (html2canvas as unknown as (el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLCanvasElement>)(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth || 794,
      useCORS: false,
      allowTaint: true,
      logging: false,
      onclone: (clonedDoc: Document) => fixLabColors(clonedDoc),
    });
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ unit: "px", format: "a4", compress: true });
    const pdfW = doc.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    doc.save(filename);
    return;
  } catch (e) {
    console.warn("[pdf] html2canvas failed, falling back to direct", e);
  }
  // Direct fallback: generate via jsPDF text table (no html2canvas)
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 40;
  doc.setFontSize(16);
  doc.text("Coach Yosri - خطة التمارين", 300, y, { align: "center" });
  y += 30;
  // This fallback will be replaced by the element's HTML if html2canvas fails,
  // but we keep it simple: just save the HTML as PDF via jsPDF.html as last resort
  await doc.html(element, {
    callback: (d) => d.save(filename),
    x: 10,
    y: 10,
    width: 180,
    windowWidth: 794,
  });
}

export function WorkoutPlanPdfDocument({ plan }: { plan: WorkoutPlan }) {
  const hasWgerImages = plan.exercises.some((e) => !!e.image_url);
  const hasGuideImages = plan.exercises.some((e) => !!getGuideImageUrl(e.nom, 1));

  return (
    <div
      data-pdf-doc
      dir="rtl"
      className="w-[794px] bg-white px-10 py-8 text-[13px] leading-relaxed text-neutral-800"
    >
      <header className="border-b-2 border-amber-500 pb-4">
        <h1 className="text-2xl font-black text-neutral-900">Coach Yosri — خطة التمارين</h1>
        <div className="mt-1 font-semibold text-neutral-900">
          {plan.titre} · {OBJECTIVE_LABELS[plan.objectif]} · الإصدار {plan.version}
        </div>
        <div className="mt-1 text-neutral-500">تاريخ الاستخراج: {formatDateShort(new Date().toISOString())}</div>
      </header>

      {WEEK_DAYS.map((day: WeekDay) => {
        const dayExercises = [
          ...plan.exercises.filter((e) => e.jour_semaine === day),
          ...plan.exercises.filter((e) => e.jour_semaine === "TOUS_LES_JOURS"),
        ];
        return (
          <section key={day} className="mt-6">
            <h2 className="mb-2 border-b border-neutral-200 pb-1 text-[15px] font-extrabold text-neutral-900">
              {WEEK_DAY_LABELS[day]}
            </h2>
            {dayExercises.length === 0 ? (
              <p className="text-neutral-500">يوم راحة — لا توجد تمارين مبرمجة</p>
            ) : (
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr className="bg-neutral-100 font-bold text-neutral-700">
                    <th className="border border-neutral-200 px-2 py-1.5 text-start">التمرين</th>
                    <th className="border border-neutral-200 px-2 py-1.5">الصورة</th>
                    <th className="border border-neutral-200 px-2 py-1.5">الحمل</th>
                    <th className="border border-neutral-200 px-2 py-1.5">التكرارات</th>
                    <th className="border border-neutral-200 px-2 py-1.5">الجولات</th>
                    <th className="border border-neutral-200 px-2 py-1.5">الإيقاع</th>
                    <th className="border border-neutral-200 px-2 py-1.5">الراحة</th>
                  </tr>
                </thead>
                <tbody>
                  {dayExercises.map((ex) => {
                    const guideUrls = getGuideImageUrls(ex.nom);
                    const guideSingle = getGuideImageUrl(ex.nom, 1);
                    // Fallback to category or generic bench-press if no guide image
                    const fallback = fallbackForCategory(ex.groupe_musculaire) ?? "/guide-assets/bench-press/frame-1.png";
                    const displayUrl = guideSingle ?? ex.image_url ?? fallback;
                    const displayUrls = guideUrls.length === 3 ? guideUrls : displayUrl ? [displayUrl] : [fallback];
                    return (
                      <tr key={ex.id} className="border-b border-neutral-100 last:border-b-0">
                        <td className="border border-neutral-200 px-2 py-1.5 text-start font-semibold text-neutral-900">
                          {ex.nom}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5">
                          {displayUrls.length ? (
                            <span className="flex items-center justify-center gap-1">
                              {displayUrls.map((u) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={u}
                                  src={u}
                                  alt=""
                                  className="h-10 w-10 object-contain"
                                  // guide assets are black on transparent → visible on white PDF without invert
                                  style={{ backgroundColor: "#ffffff" }}
                                />
                              ))}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      <td className="border border-neutral-200 px-2 py-1.5 font-semibold">{ex.charge ?? "—"}</td>
                      <td className="border border-neutral-200 px-2 py-1.5 whitespace-pre-line text-start leading-4">
                        {ex.repetitions ?? "—"}
                      </td>
                      <td className="border border-neutral-200 px-2 py-1.5 font-bold">{ex.series ?? "—"}</td>
                      <td className="border border-neutral-200 px-2 py-1.5 font-mono">{ex.tempo ?? "—"}</td>
                      <td className="border border-neutral-200 px-2 py-1.5">{ex.repos ?? "—"}</td>
                    </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </section>
        );
      })}

      <footer className="mt-8 border-t border-neutral-200 pt-3 text-center text-xs text-neutral-500">
        <div>مع تمنياتنا لك بدوام الصحة والقوة — Coach Yosri</div>
        {hasGuideImages && <div className="mt-1">صور التمارين : @bryllim/workout-guide — CC BY-SA 4.0 (Bryl Lim / Everkinetic)</div>}
        {hasWgerImages && <div className="mt-1">wger.de — CC-BY-SA (attribution : wger.de)</div>}
      </footer>
    </div>
  );
}
