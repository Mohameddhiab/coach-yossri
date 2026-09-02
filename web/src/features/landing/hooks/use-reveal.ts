"use client";

import { useEffect, useRef } from "react";

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const targets =
      node instanceof Element && node.matches("[data-reveal]")
        ? [node]
        : Array.from(node.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (targets.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }

    // Mobile: threshold plus bas + rootMargin en % pour s'adapter aux petits viewports
    const isMobile = window.innerWidth < 768;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: isMobile ? 0.08 : 0.15,
        rootMargin: isMobile ? "0px 0px -5% 0px" : "0px 0px -40px 0px",
        ...options,
      },
    );

    targets.forEach((el) => observer.observe(el));

    // Fallback iOS Safari: si l'observer ne déclenche pas (ex: scroll figé), forcer visible après 800ms
    const fallback = window.setTimeout(() => {
      targets.forEach((el) => {
        if (!el.classList.contains("reveal-visible")) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.92) {
            el.classList.add("reveal-visible");
            observer.unobserve(el);
          }
        }
      });
    }, 800);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [options]);

  return ref;
}
