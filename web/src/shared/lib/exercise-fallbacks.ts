export const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  Chest: "https://wger.de/media/exercise-images/192/Bench-press-1.png",
  Back: "https://wger.de/media/exercise-images/123/Lat-pulldown-1.png",
  Shoulders: "https://wger.de/media/exercise-images/81/Shoulder-press-1.png",
  Biceps: "https://wger.de/media/exercise-images/88/Biceps-curl-1.png",
  Triceps: "https://wger.de/media/exercise-images/146/Triceps-pushdown-1.png",
  Legs: "https://wger.de/media/exercise-images/98/Leg-press-1.png",
  Abs: "https://wger.de/media/exercise-images/120/Plank-1.png",
};

export function fallbackForCategory(category?: string | null): string | null {
  if (!category) return null;
  return FALLBACK_IMAGE_BY_CATEGORY[category] ?? null;
}
