import { getFallbackGuideImageUrl } from "./exercise-guide-map";

export const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  Chest: "/guide-assets/bench-press/frame-1.png",
  Back: "/guide-assets/lat-pulldown/frame-1.png",
  Shoulders: "/guide-assets/arnold-press/frame-1.png",
  Biceps: "/guide-assets/bicep-curl/frame-1.png",
  Triceps: "/guide-assets/tricep-pushdown/frame-1.png",
  Legs: "/guide-assets/leg-press/frame-1.png",
  Abs: "/guide-assets/plank/frame-1.png",
};

export function fallbackForCategory(category?: string | null): string | null {
  if (!category) return null;
  // Priorité : illustration SVG workout-guide (transparente, locale)
  const guide = getFallbackGuideImageUrl(category);
  if (guide) return guide;
  return FALLBACK_IMAGE_BY_CATEGORY[category] ?? null;
}
