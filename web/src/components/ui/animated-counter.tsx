"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 600,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };
    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current !== null) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums animate-count-up", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export { AnimatedCounter };
