"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Images } from "lucide-react";
import type { ProgressPhoto } from "@/shared/lib/domain";
import { formatDate } from "@/lib/utils";

export function TransformationSlider({ photos }: { photos: ProgressPhoto[] }) {
  const [pos, setPos] = useState(50);

  const pair = useMemo(() => {
    if (photos.length < 2) return null;
    const sorted = [...photos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return { before: sorted[0], after: sorted[sorted.length - 1] };
  }, [photos]);

  if (!pair || pair.before.id === pair.after.id) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Images className="size-4 text-primary" />
        مقارنة التحول الجسدي — اسحب للمقارنة قبل وبعد
      </div>
      <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-xl border">
        <Image
          src={pair.after.url}
          alt="بعد"
          fill
          unoptimized
          sizes="(max-width: 768px) 90vw, 400px"
          className="object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <Image
            src={pair.before.url}
            alt="قبل"
            fill
            unoptimized
            sizes="(max-width: 768px) 90vw, 400px"
            className="object-cover"
            draggable={false}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]"
          style={{ insetInlineStart: `${pos}%` }}
        />
        <div
          className="pointer-events-none absolute top-3 z-10 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
          style={{ insetInlineStart: "0.75rem" }}
        >
          قبل — {formatDate(pair.before.date)}
        </div>
        <div
          className="pointer-events-none absolute top-3 z-10 rounded-md bg-primary/80 px-2 py-0.5 text-xs font-semibold text-white"
          style={{ insetInlineEnd: "0.75rem" }}
        >
          بعد — {formatDate(pair.after.date)}
        </div>
        <input
          type="range"
          min={2}
          max={98}
          value={pos}
          aria-label="مقارنة قبل وبعد"
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-x-0 bottom-3 z-20 w-full cursor-ew-resize appearance-none bg-transparent accent-white opacity-80"
        />
      </div>
    </div>
  );
}