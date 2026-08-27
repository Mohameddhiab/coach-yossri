"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  urls: string[];
  alt: string;
  sizeClass?: string; // e.g. "size-28" or "size-16"
  intervalMs?: number; // default 550ms
  className?: string;
}

export function AnimatedExerciseImage({
  urls,
  alt,
  sizeClass = "size-24",
  intervalMs = 550,
  className = "",
}: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (urls.length <= 1 || prefersReduced || paused) return;
    timer.current = window.setInterval(() => setIdx((i) => (i + 1) % urls.length), intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [urls.length, intervalMs, prefersReduced, paused]);

  // Preload the 3 frames
  useEffect(() => {
    urls.forEach((u) => {
      const img = new window.Image();
      img.src = u;
    });
  }, [urls]);

  if (urls.length === 0) return null;
  if (urls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={urls[0]} alt={alt} className={`${sizeClass} object-contain invert p-1 ${className}`} loading="lazy" />
    );
  }

  return (
    <div
      className={`relative ${sizeClass} overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={alt}
    >
      {urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={u}
          src={u}
          alt={i === 0 ? alt : ""}
          className={`absolute inset-0 h-full w-full object-contain invert p-1 transition-opacity duration-200 ${i === idx ? "opacity-100" : "opacity-0"}`}
          loading={i === 0 ? "eager" : "lazy"}
          draggable={false}
        />
      ))}
      {/* dots indicator */}
      <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-1">
        {urls.map((_, i) => (
          <span key={i} className={`size-1 rounded-full transition ${i === idx ? "bg-foreground" : "bg-foreground/30"}`} />
        ))}
      </div>
    </div>
  );
}
