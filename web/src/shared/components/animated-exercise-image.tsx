"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  urls: string[];
  alt: string;
  sizeClass?: string; // e.g. "size-28" or "size-16"
  intervalMs?: number; // default 550ms
  className?: string;
  fallbackSrc?: string;
}

export function AnimatedExerciseImage({
  urls,
  alt,
  sizeClass = "size-24",
  intervalMs = 550,
  className = "",
  fallbackSrc,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (urls.length <= 1 || prefersReduced || paused) return;
    timer.current = window.setInterval(() => setIdx((i) => (i + 1) % urls.length), intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [urls.length, intervalMs, prefersReduced, paused]);

  const [failed, setFailed] = useState(0);

  // Preload the 3 frames
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailed(0);
    urls.forEach((u) => {
      const img = new window.Image();
      img.src = u;
    });
  }, [urls]);

  if (urls.length === 0) return null;
  if (failed >= urls.length && fallbackSrc) {
    // all guide frames failed → fallback single image
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fallbackSrc} alt={alt} className={`${sizeClass} object-contain invert p-1 ${className}`} loading="lazy" crossOrigin="anonymous" />;
  }
  if (urls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={urls[0]} alt={alt} className={`${sizeClass} object-contain invert p-1 ${className}`} loading="lazy" onError={() => setFailed((c) => c + 1)} />
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
          onError={() => setFailed((c) => c + 1)}
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
