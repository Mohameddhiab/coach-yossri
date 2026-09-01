"use client";

import { jsPDF } from "jspdf";
import type { WeekDay } from "@/shared/lib/domain";
import { OBJECTIVE_LABELS, WEEK_DAYS, WEEK_DAY_LABELS } from "@/shared/lib/domain";
import type { WorkoutPlan } from "@/features/workout-plans/api/workoutPlans.api";
import { formatDateShort } from "@/lib/utils";
import { getGuideImageUrl, getGuideImageUrls } from "@/shared/lib/exercise-guide-map";

export async function downloadWorkoutPdf(element: HTMLElement, filename: string) {
  const doc = new jsPDF({ unit: "px", format: "a4", compress: true });
  // html2canvas must capture the hidden PDF node even though it is off-screen.
  // For guide-assets (/guide-assets/*) which are same-origin, we don't need CORS.
  await doc.html(element, {
    margin: 0,
    autoPaging: "slice",
    html2canvas: {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      useCORS: false,
      allowTaint: true,
      logging: false,
    },
  });
  doc.save(filename);
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
                    const displayUrl = getGuideImageUrl(ex.nom, 1) ?? ex.image_url ?? null;
                    const guideUrls = getGuideImageUrls(ex.nom);
                    const displayUrls = guideUrls.length === 3 ? guideUrls : displayUrl ? [displayUrl] : [];
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
