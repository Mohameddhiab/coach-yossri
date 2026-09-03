"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareRankingProps {
  rank: number;
  count: number;
  streak: number;
}

export function ShareRankingButton({ rank, count, streak }: ShareRankingProps) {
  const [busy, setBusy] = useState(false);

  const generate = async (): Promise<Blob | null> => {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const center = 540;

    ctx.fillStyle = "#0f1115";
    ctx.fillRect(0, 0, 1080, 1350);

    const glow = ctx.createRadialGradient(center, 520, 100, center, 520, 520);
    glow.addColorStop(0, "rgba(245,158,11,0.25)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
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
    ctx.fillText("دوري الالتزام — الأكثر حضوراً", center, 380);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 190px Cairo, sans-serif";
    ctx.fillText(`#${rank}`, center, 560);

    ctx.fillStyle = "#d4d4d8";
    ctx.font = "56px Cairo, sans-serif";
    ctx.fillText(`المرتبة ${rank} من الدوري`, center, 690);

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 64px Cairo, sans-serif";
    ctx.fillText(`${count} حصة`, center, 800);

    ctx.fillStyle = "#f4f4f5";
    ctx.font = "50px Cairo, sans-serif";
    ctx.fillText(`🔥 سلسلة الحضور: ${streak} يومًا`, center, 900);

    ctx.strokeStyle = "rgba(245,158,11,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, 1000);
    ctx.lineTo(900, 1000);
    ctx.stroke();

    ctx.fillStyle = "#d4d4d8";
    ctx.font = "40px Cairo, sans-serif";
    ctx.fillText("سجّل حضورك لتحصل على مرتبة أعلى!", center, 1200);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await generate();
      if (!blob) return;
      const file = new File([blob], "coach-yosri-classement.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "مرتبتي في دوري Coach Yosri" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "coach-yosri-classement.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تنزيل بطاقة الترتيب — شاركها مع أصدقائك");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("تعذّر إنشاء بطاقة المشاركة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={share} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      مشاركة مرتبتي
    </Button>
  );
}
