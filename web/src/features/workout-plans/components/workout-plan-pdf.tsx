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

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadWorkoutPdf(element: HTMLElement, filename: string) {
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
  for (const img of imgs) {
    if (img.src.includes("wger.de")) {
      const dataUrl = await fetchImageAsDataUrl(img.src);
      if (dataUrl) img.src = dataUrl;
    }
  }
  try {
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
    console.error("[pdf] workout html2canvas failed", e);
    throw new Error("Échec de la génération du PDF du plan d'entraînement. Vérifiez votre connexion et réessayez.");
  }
}

let amiriFontLoaded = false;
async function ensureArabicFont(doc: jsPDF) {
  if (amiriFontLoaded) return;
  try {
    // Amiri supports Arabic glyphs - cache as base64 in jsPDF VFS
    const res = await fetch("https://fonts.gstatic.com/s/amiri/v26/J7aRnpd8CGxBHpUrtLMA.ttf");
    if (!res.ok) throw new Error("font fetch failed");
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    doc.addFileToVFS("Amiri-Regular.ttf", base64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
    amiriFontLoaded = true;
  } catch {
    // fallback to helvetica if font load fails - Arabic will be boxes but not crash
  }
}

export async function downloadWorkoutPdfDirect(plan: WorkoutPlan, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  await ensureArabicFont(doc);
  const useFont = amiriFontLoaded ? "Amiri" : "helvetica";
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 30;
  let y = 40;
  doc.setFontSize(16);
  doc.setFont(useFont, "bold");
  // Use English for header to avoid Arabic shaping issues in direct; keep Arabic for plan title via Amiri
  doc.text("Coach Yosri - Khota Al Tamareen", pageW / 2, y, { align: "center" });
  y += 18;
  doc.setFontSize(10);
  doc.setFont(useFont, "normal");
  // Title may contain Arabic - use Amiri if loaded
  doc.text(`${plan.titre} - ${OBJECTIVE_LABELS[plan.objectif]} - Isdar ${plan.version}`, pageW / 2, y, { align: "center" });
  y += 12;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Tarikh: ${formatDateShort(new Date().toISOString())}`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 20;

  for (const day of WEEK_DAYS) {
    const dayExercises = [
      ...plan.exercises.filter((e) => e.jour_semaine === day),
      ...plan.exercises.filter((e) => e.jour_semaine === "TOUS_LES_JOURS"),
    ];
    if (dayExercises.length === 0) {
      doc.setFontSize(10);
      doc.setFont(useFont, "bold");
      doc.text(WEEK_DAY_LABELS[day], margin, y);
      y += 14;
      doc.setFontSize(8);
      doc.setFont(useFont, "normal");
      doc.setTextColor(100);
      doc.text("يوم راحة - لا توجد تمارين مبرمجة", margin, y);
      doc.setTextColor(0);
      y += 18;
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
      continue;
    }
    doc.setFontSize(11);
    doc.setFont(useFont, "bold");
    doc.text(WEEK_DAY_LABELS[day], margin, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // Table header
    const colW = [140, 80, 50, 70, 40, 50, 40];
    const headers = ["التمرين", "الصورة", "الحمل", "التكرارات", "الجولات", "الإيقاع", "الراحة"];
    let x = margin;
    doc.setFontSize(7);
    doc.setFont(useFont, "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 8, pageW - margin * 2, 14, "F");
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + colW[i] / 2, y, { align: "center" });
      x += colW[i];
    }
    y += 8;

    for (const ex of dayExercises) {
      if (y > 730) {
        doc.addPage();
        y = 40;
      }
      const guideSingle = getGuideImageUrl(ex.nom, 1);
      const imgUrl = guideSingle ?? ex.image_url ?? fallbackForCategory(ex.groupe_musculaire) ?? "/guide-assets/bench-press/frame-1.png";
      let imgData: string | null = null;
      try {
        const url = new URL(imgUrl, window.location.origin).toString();
        imgData = await fetchImageAsDataUrl(url);
      } catch {}
      const rowH = 28;
      // Row background
      doc.setDrawColor(230);
      // Exercise name
      x = margin;
      doc.setFontSize(7);
      doc.setFont(useFont, "bold");
      // Keep English names as-is, Arabic will use Amiri
      doc.text(ex.nom, x + 2, y + 8, { maxWidth: colW[0] - 4 });
      x += colW[0];
      // Image cell
      doc.rect(x, y - 6, colW[1], rowH);
      if (imgData) {
        try {
          doc.addImage(imgData, "PNG", x + 10, y - 2, 20, 20);
        } catch {}
      }
      x += colW[1];
      // Other cells
      const cells = [ex.charge ?? "-", ex.repetitions ?? "-", ex.series ?? "-", ex.tempo ?? "-", ex.repos ?? "-"];
      for (let i = 0; i < cells.length; i++) {
        doc.rect(x, y - 6, colW[2 + i], rowH);
        doc.setFont(useFont, "normal");
        doc.text(String(cells[i]).slice(0, 20), x + colW[2 + i] / 2, y + 8, { align: "center", maxWidth: colW[2 + i] - 4 });
        x += colW[2 + i];
      }
      y += rowH;
    }
    y += 10;
  }
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
