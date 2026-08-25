"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareCardProps {
  name: string;
  deltaKg: number | null;
  streak: number;
  badgesCount: number;
  currentWeight: number | null;
}

export function ShareCardButton({
  name,
  deltaKg,
  streak,
  badgesCount,
  currentWeight,
}: ShareCardProps) {
  const [busy, setBusy] = useState(false);

  const generate = async (): Promise<Blob | null> => {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const center = 540;

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "#141518");
    gradient.addColorStop(1, "#26282e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 0, 1080, 20);

    const logo = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/icons/icon-192.png";
    });
    if (logo) {
      ctx.drawImage(logo, center - 70, 60, 140, 140);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 88px Cairo, sans-serif";
    ctx.fillText("Coach Yosri", center, 300);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "44px Cairo, sans-serif";
    ctx.fillText("قوّة ونتيجة", center, 375);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Cairo, sans-serif";
    ctx.fillText(name, center, 480);

    if (deltaKg !== null) {
      const lost = deltaKg < 0;
      ctx.fillStyle = lost ? "#34d399" : "#fb7185";
      ctx.font = "bold 160px Cairo, sans-serif";
      ctx.fillText(`${lost ? "" : "+"}${Math.abs(deltaKg).toFixed(1)} كغ`, center, 640);
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "56px Cairo, sans-serif";
      ctx.fillText(lost ? "خسر" : "كسب", center, 760);
    }

    if (currentWeight !== null) {
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "48px Cairo, sans-serif";
      ctx.fillText(`الوزن الحالي: ${currentWeight.toFixed(1)} كغ`, center, 870);
    }

    ctx.fillStyle = "#f4f4f5";
    ctx.font = "52px Cairo, sans-serif";
    ctx.fillText(`سلسلة حضور: ${streak} يوم`, center, 980);

    ctx.fillStyle = "#f4f4f5";
    ctx.fillText(`أوسمة مفتوحة: ${badgesCount}`, center, 1060);

    ctx.strokeStyle = "rgba(245,158,11,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, 1150);
    ctx.lineTo(900, 1150);
    ctx.stroke();

    ctx.fillStyle = "#d4d4d8";
    ctx.font = "40px Cairo, sans-serif";
    ctx.fillText("مع مدربك — برنامج Coach Yosri", center, 1240);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await generate();
      if (!blob) return;
      const file = new File([blob], "coach-yosri-progression.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "تقدّمي مع Coach Yosri" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "coach-yosri-progression.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تنزيل الصورة — شاركها مع أصدقائك");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("تعذر إنشاء الصورة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" onClick={share} disabled={busy}>
      <Share2 />
      شارك تقدمك
    </Button>
  );
}