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
    const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const vh = () => window.visualViewport?.height ?? window.innerHeight;

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
        threshold: isMobile ? 0.05 : 0.15,
        rootMargin: isMobile ? "0px 0px -4% 0px" : "0px 0px -40px 0px",
        ...options,
      },
    );

    targets.forEach((el) => observer.observe(el));

    // Affichage immédiat du contenu au-dessus de la ligne de flottaison (mobile: premier viewport)
    const revealAboveFold = () => {
      targets.forEach((el) => {
        if (el.classList.contains("reveal-visible")) return;
        const rect = el.getBoundingClientRect();
        // Si l'élément est déjà visible à l'ouverture, l'afficher sans attendre le scroll
        if (rect.top < vh() * 0.92 && rect.bottom > 0) {
          el.classList.add("reveal-visible");
          observer.unobserve(el);
        }
      });
    };
    // rAF pour laisser le layout se stabiliser (iOS Safari, Chrome mobile)
    requestAnimationFrame(() => requestAnimationFrame(revealAboveFold));

    // Fallback iOS Safari: si l'observer ne déclenche pas (ex: scroll figé), forcer visible après 700ms
    const fallbackNear = window.setTimeout(revealAboveFold, 700);

    // Filet de sécurité ultime mobile: tout révéler après 1400ms si encore caché (garantit que rien ne reste invisible)
    const fallbackAll = window.setTimeout(() => {
      targets.forEach((el) => {
        if (!el.classList.contains("reveal-visible")) {
          el.classList.add("reveal-visible");
          observer.unobserve(el);
        }
      });
    }, 1400);

    // Réessayer au resize/orientationchange (barre d'adresse mobile qui apparaît/disparaît)
    const onResize = () => revealAboveFold();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.clearTimeout(fallbackNear);
      window.clearTimeout(fallbackAll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      observer.disconnect();
    };
  }, [options]);

  return ref;
}
