import { getAssetUrl, getExercise, type Exercise } from "@bryllim/workout-guide";

/**
 * Map les noms courants (CURATED_EXERCISES) -> slugs workout-guide.
 * Tous les SVGs sont 512x512 transparents, 3 frames par exercice (frame 1 = pose de départ).
 */
export const GUIDE_SLUG_MAP: Record<string, string> = {
  // Chest
  "Incline Dumbbell Press": "incline-dumbbell-press",
  "Incline Bench Press": "incline-bench-press",
  "Chest Press Machine": "machine-chest-press",
  "Flat Dumbbell Press": "dumbbell-bench-press",
  "Chest Fly Machine": "pec-deck",
  Dips: "dip",

  // Back
  "Lat Pulldown": "lat-pulldown",
  "T-Bar Row": "t-bar-row",
  "Dumbbell Row": "dumbbell-bent-over-row",
  "Seated Row Machine": "seated-row",
  Pullover: "straight-arm-pulldown",
  "Back Extension": "back-extension",

  // Shoulders
  "Shoulder Dumbbell Press": "seated-dumbbell-press",
  "Shoulder Press Machine": "machine-shoulder-press",
  "Lateral Raise Machine": "machine-lateral-raise",
  "Dumbbell Lateral Raise": "lateral-raise",
  "Rear Delt Fly Machine": "rear-delt-fly",
  "Dumbbell Shrugs": "dumbbell-shrug",

  // Biceps
  "Hammer Curl": "hammer-curl",
  "EZ Bar Curl": "ez-bar-curl",
  "Standing Inner Biceps Curl": "concentration-curl",
  "Spider Curl": "spider-curl",
  "Preacher Curl": "preacher-curl",

  // Triceps
  "Skull Crusher": "skull-crusher",
  "Dumbbell Overhead Extension": "dumbbell-overhead-tricep-extension",
  "Triceps Pushdown": "tricep-pushdown",
  "Reverse Pushdown": "rope-tricep-pushdown",

  // Legs
  "Leg Extension Machine": "leg-extension",
  "Leg Curl Machine": "leg-curl",
  "Leg Press Machine": "leg-press",
  "Hack Squat Machine": "hack-squat",
  "Smith Machine Squat": "smith-machine-squat",
  "Standing Calf Raise (Smith Machine)": "standing-calf-raise",
  "Seated Calf Raise": "seated-calf-raise",
  "Bulgarian Split Squat": "bulgarian-split-squat",
  "Glute Kickback": "machine-glute-kickback",
  "Hip Thrust": "hip-thrust",
  "Dumbbell Squat": "goblet-squat",

  // Abs
  "Sit-Up": "crunch",
  "V-Up": "v-up",
  "Reverse Crunch": "reverse-crunch",
  Plank: "plank",
  "Mountain Climber": "mountain-climber",
};

/**
 * Fallback par catégorie -> slug guide (utilisé quand un exercice n'est pas dans le mapping
 * ou quand la catégorie n'a pas d'image).
 */
export const GUIDE_FALLBACK_BY_CATEGORY: Record<string, string> = {
  Chest: "bench-press",
  Back: "lat-pulldown",
  Shoulders: "arnold-press",
  Biceps: "bicep-curl",
  Triceps: "tricep-pushdown",
  Legs: "leg-press",
  Abs: "plank",
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

// Index normalisé pour recherche insensible à la casse
const NORMALIZED_MAP: Record<string, string> = {};
for (const [k, v] of Object.entries(GUIDE_SLUG_MAP)) {
  NORMALIZED_MAP[normalizeName(k)] = v;
}

export function getGuideSlug(exerciseName: string): string | null {
  const direct = GUIDE_SLUG_MAP[exerciseName];
  if (direct) return direct;
  return NORMALIZED_MAP[normalizeName(exerciseName)] ?? null;
}

export function getGuideExercise(exerciseName: string): Exercise | null {
  const slug = getGuideSlug(exerciseName);
  if (!slug) return null;
  return getExercise(slug) ?? null;
}

export function getGuideImageUrl(exerciseName: string, frame: 1 | 2 | 3 = 1): string | null {
  const slug = getGuideSlug(exerciseName);
  if (!slug) return null;
  // Image bundlée localement dans public/guide-assets — téléchargement direct sans API
  return `/guide-assets/${slug}/frame-${frame}.png`;
}

export function getGuideImageUrlBySlug(slug: string, frame: 1 | 2 | 3 = 1): string | null {
  // Local d'abord, fallback CDN si besoin
  const local = `/guide-assets/${slug}/frame-${frame}.png`;
  // On retourne le local, le fallback CDN est géré côté <img onError>
  return local;
}

export function getGuideImageUrls(exerciseName: string): string[] {
  const slug = getGuideSlug(exerciseName);
  if (!slug) return [];
  return [1, 2, 3].map((f) => `/guide-assets/${slug}/frame-${f}.png`);
}

export function getFallbackGuideImageUrls(category: string | null | undefined): string[] {
  if (!category) return [];
  const slug = GUIDE_FALLBACK_BY_CATEGORY[category];
  if (!slug) return [];
  return [1, 2, 3].map((f) => `/guide-assets/${slug}/frame-${f}.png`);
}

export function getFallbackGuideImageUrl(category: string | null | undefined): string | null {
  if (!category) return null;
  const slug = GUIDE_FALLBACK_BY_CATEGORY[category];
  if (!slug) return null;
  return `/guide-assets/${slug}/frame-1.png`;
}

// Fallback CDN (utilisé si l'image locale échoue)
export function getGuideCdnUrl(slug: string, frame: 1 | 2 | 3 = 1): string | null {
  return getAssetUrl(slug, frame) ?? null;
}
