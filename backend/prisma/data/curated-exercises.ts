export interface CuratedExercise {
  name: string;
  category: "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Legs" | "Abs";
  aliases: string[];
  wgerUuid?: string; // si image connue chez wger, pour réutiliser
}

export const CURATED_EXERCISES: CuratedExercise[] = [
  // Chest 6
  { name: "Incline Dumbbell Press", category: "Chest", aliases: ["incline dumbell press", "incline dumbbell press"] },
  { name: "Incline Bench Press", category: "Chest", aliases: ["incline bench press"] },
  { name: "Chest Press Machine", category: "Chest", aliases: ["chest press machine"] },
  { name: "Flat Dumbbell Press", category: "Chest", aliases: ["flat dumbell press", "flat dumbbell press"] },
  { name: "Chest Fly Machine", category: "Chest", aliases: ["chest fly machine"] },
  { name: "Dips", category: "Chest", aliases: ["dips"] },

  // Back 6
  { name: "Lat Pulldown", category: "Back", aliases: ["lat pull down", "lat pulldown"] },
  { name: "T-Bar Row", category: "Back", aliases: ["t-bar row"] },
  { name: "Dumbbell Row", category: "Back", aliases: ["dumbell row", "dumbbell row"] },
  { name: "Seated Row Machine", category: "Back", aliases: ["seated row machine"] },
  { name: "Pullover", category: "Back", aliases: ["pull over", "pullover"] },
  { name: "Back Extension", category: "Back", aliases: ["back extension"] },

  // Shoulders 6
  { name: "Shoulder Dumbbell Press", category: "Shoulders", aliases: ["shoulders dumbell press", "shoulder dumbbell press"] },
  { name: "Shoulder Press Machine", category: "Shoulders", aliases: ["shoulders press machine", "shoulder press machine"] },
  { name: "Lateral Raise Machine", category: "Shoulders", aliases: ["lateral raise machine"] },
  { name: "Dumbbell Lateral Raise", category: "Shoulders", aliases: ["dumbell lateral raise", "dumbbell lateral raise"] },
  { name: "Rear Delt Fly Machine", category: "Shoulders", aliases: ["rare delt-fly machine", "rear delt fly machine"] },
  { name: "Dumbbell Shrugs", category: "Shoulders", aliases: ["dumbell shrugs", "dumbbell shrugs"] },

  // Biceps 5
  { name: "Hammer Curl", category: "Biceps", aliases: ["hummer curl", "hammer curl"] },
  { name: "EZ Bar Curl", category: "Biceps", aliases: ["ez bar curl"] },
  { name: "Standing Inner Biceps Curl", category: "Biceps", aliases: ["standing inner curl"] },
  { name: "Spider Curl", category: "Biceps", aliases: ["spider curl"] },
  { name: "Preacher Curl", category: "Biceps", aliases: ["preacher bar curl", "preacher curl"] },

  // Triceps 4
  { name: "Skull Crusher", category: "Triceps", aliases: ["skull crusher"] },
  { name: "Dumbbell Overhead Extension", category: "Triceps", aliases: ["dumbell over head", "dumbbell overhead extension"] },
  { name: "Triceps Pushdown", category: "Triceps", aliases: ["triceps pushdown"] },
  { name: "Reverse Pushdown", category: "Triceps", aliases: ["reverse pushdown"] },

  // Legs 11
  { name: "Leg Extension Machine", category: "Legs", aliases: ["leg extension machine"] },
  { name: "Leg Curl Machine", category: "Legs", aliases: ["leg curl machine"] },
  { name: "Leg Press Machine", category: "Legs", aliases: ["leg press machine"] },
  { name: "Hack Squat Machine", category: "Legs", aliases: ["hack sequat machine", "hack squat machine"] },
  { name: "Smith Machine Squat", category: "Legs", aliases: ["sequat smith machine", "squat smith machine", "smith machine squat"] },
  { name: "Standing Calf Raise (Smith Machine)", category: "Legs", aliases: ["standing calf raise smith machine", "standing calf raise"] },
  { name: "Seated Calf Raise", category: "Legs", aliases: ["seated calf raise"] },
  { name: "Bulgarian Split Squat", category: "Legs", aliases: ["bulgarian sequat", "bulgarian split squat"] },
  { name: "Glute Kickback", category: "Legs", aliases: ["kick back", "glute kickback"] },
  { name: "Hip Thrust", category: "Legs", aliases: ["hip thrust"] },
  { name: "Dumbbell Squat", category: "Legs", aliases: ["dumbell sequat", "dumbbell squat"] },

  // Abs 5
  { name: "Sit-Up", category: "Abs", aliases: ["sit-up", "situp"] },
  { name: "V-Up", category: "Abs", aliases: ["v-up", "v up"] },
  { name: "Reverse Crunch", category: "Abs", aliases: ["revers crunche", "reverse crunch"] },
  { name: "Plank", category: "Abs", aliases: ["plank"] },
  { name: "Mountain Climber", category: "Abs", aliases: ["mountain climber"] },
];

export const CURATED_NAMES = CURATED_EXERCISES.map((e) => e.name);

// Fallback générique par catégorie (utilisé si image manquante) — URLs wger connues, sinon null → placeholder local
export const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string | null> = {
  Chest: "https://wger.de/media/exercise-images/192/Bench-press-1.png",
  Back: "https://wger.de/media/exercise-images/123/Lat-pulldown-1.png",
  Shoulders: "https://wger.de/media/exercise-images/81/Shoulder-press-1.png",
  Biceps: "https://wger.de/media/exercise-images/88/Biceps-curl-1.png",
  Triceps: "https://wger.de/media/exercise-images/146/Triceps-pushdown-1.png",
  Legs: "https://wger.de/media/exercise-images/98/Leg-press-1.png",
  Abs: "https://wger.de/media/exercise-images/120/Plank-1.png",
};
