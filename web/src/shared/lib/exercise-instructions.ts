/**
 * Explications claires en français pour chaque exercice courant.
 * Affichées automatiquement quand le coach choisit un exercice.
 * Aucune création manuelle par le coach — tout est prêt.
 */
export const EXERCISE_INSTRUCTIONS: Record<string, string> = {
  // Chest
  "Incline Dumbbell Press":
    "Sur un banc incliné à 30-45°, haltères au niveau de la poitrine. Poussez vers le haut en expirant, paumes vers l'avant, puis redescendez lentement en contrôlant.",
  "Incline Bench Press":
    "Barre au niveau du haut de la poitrine sur banc incliné. Descendez la barre lentement puis poussez explosivement. Gardez les omoplates serrées.",
  "Chest Press Machine":
    "Assis dos collé au dossier, poignées au niveau de la poitrine. Poussez devant vous en expirant, revenez lentement sans relâcher la tension.",
  "Flat Dumbbell Press":
    "Allongé sur banc plat, haltères à hauteur de poitrine. Poussez vers le haut jusqu'à extension sans verrouiller les coudes, redescendez en contrôle.",
  "Chest Fly Machine":
    "Coudes légèrement fléchis, ouvrez les bras en arc de cercle puis refermez devant la poitrine. Concentrez la contraction sur les pectoraux.",
  Dips: "Sur les barres parallèles, descendez jusqu'à ce que les bras forment 90°, puis remontez en poussant avec la poitrine et les triceps. Buste légèrement penché vers l'avant.",

  // Back
  "Lat Pulldown":
    "Saisissez la barre large en pronation, tirez vers le haut de la poitrine en serrant les omoplates. Remontez lentement sans relâcher les épaules vers le haut.",
  "T-Bar Row":
    "Buste penché à 45°, dos droit, tirez la barre vers le bas du ventre en serrant les omoplates. Gardez les coudes près du corps.",
  "Dumbbell Row":
    "Un genou sur le banc, dos plat, tirez l'haltère vers la hanche en gardant le coude près du corps. Contrôlez la descente.",
  "Seated Row Machine":
    "Pieds calés, dos droit, tirez la poignée vers le nombril en serrant les omoplates. Évitez de vous balancer vers l'arrière.",
  Pullover:
    "Allongé sur le banc, haltère tenu à deux mains au-dessus de la poitrine. Descendez les bras en arc au-dessus de la tête puis ramenez en contractant le dos et les pectoraux.",
  "Back Extension":
    "Sur le banc à lombaires, croisez les bras sur la poitrine. Descendez le buste lentement puis remontez en contractant les lombaires et les fessiers.",

  // Shoulders
  "Shoulder Dumbbell Press":
    "Assis dos soutenu, haltères à hauteur des épaules. Poussez vers le haut sans cambrer le bas du dos, redescendez en contrôle jusqu'aux oreilles.",
  "Shoulder Press Machine":
    "Dos collé, poignées au niveau des épaules. Poussez vers le haut en expirant, revenez lentement sans relâcher complètement.",
  "Lateral Raise Machine":
    "Coudes légèrement fléchis, levez les bras sur les côtés jusqu'à hauteur des épaules. Redescendez lentement en gardant la tension.",
  "Dumbbell Lateral Raise":
    "Debout, haltères le long du corps. Levez sur les côtés jusqu'à hauteur des épaules en gardant les coudes souples, redescendez lentement.",
  "Rear Delt Fly Machine":
    "Buste contre le dossier, bras tendus, ouvrez vers l'arrière en serrant les omoplates. Concentrez sur l'arrière des épaules.",
  "Dumbbell Shrugs":
    "Debout, haltères le long du corps. Haussez les épaules le plus haut possible, maintenez 1 seconde puis redescendez lentement.",

  // Biceps
  "Hammer Curl":
    "Debout, haltères en prise neutre (paumes face à face). Fléchissez les coudes sans balancer le corps, redescendez en contrôlant.",
  "EZ Bar Curl":
    "Barre EZ prise supination, coudes près du corps. Montez la barre vers les épaules sans bouger les épaules, redescendez lentement.",
  "Standing Inner Biceps Curl":
    "Debout, haltères le long du corps, paumes vers l'avant. Fléchissez en gardant les coudes fixes, concentrez sur l'intérieur du biceps.",
  "Spider Curl":
    "Buste penché sur un banc incliné, bras pendants. Fléchissez les haltères vers les épaules sans balancer, redescendez en tension continue.",
  "Preacher Curl":
    "Bras posés sur le pupitre, barre EZ. Fléchissez sans décoller les coudes du support, redescendez lentement sans tendre complètement.",

  // Triceps
  "Skull Crusher":
    "Allongé, barre EZ au-dessus du front. Fléchissez les coudes pour descendre la barre vers le front puis tendez les bras sans bouger les épaules.",
  "Dumbbell Overhead Extension":
    "Debout ou assis, haltère tenu à deux mains au-dessus de la tête. Fléchissez les coudes derrière la tête puis tendez les bras vers le haut.",
  "Triceps Pushdown":
    "Debout face à la poulie, coudes collés au corps. Poussez la barre vers le bas jusqu'à extension complète, revenez en contrôlant.",
  "Reverse Pushdown":
    "Prise supination à la poulie, coudes fixes. Poussez vers le bas en contractant les triceps, revenez lentement.",

  // Legs
  "Leg Extension Machine":
    "Assis dos calé, coussin sur les chevilles. Tendez les jambes jusqu'à extension sans verrouiller, redescendez lentement.",
  "Leg Curl Machine":
    "Allongé ventre contre le banc, talons sous le coussin. Fléchissez les genoux en contractant les ischio-jambiers, revenez en contrôle.",
  "Leg Press Machine":
    "Pieds largeur épaules sur le plateau, dos collé. Fléchissez à 90° puis poussez sans verrouiller les genoux. Gardez les talons au sol.",
  "Hack Squat Machine":
    "Épaules sous les coussins, pieds légèrement en avant. Descendez en fléchissant les genoux jusqu'à 90°, remontez en poussant par les talons.",
  "Smith Machine Squat":
    "Barre sur les trapèzes, pieds sous la barre. Descendez en gardant le dos droit jusqu'à cuisses parallèles, remontez en poussant les talons.",
  "Standing Calf Raise (Smith Machine)":
    "Debout sur une cale, barre sur les épaules. Montez sur la pointe des pieds en contractant les mollets, redescendez en étirant.",
  "Seated Calf Raise":
    "Assis, coussin sur les genoux, pointes sur la cale. Levez les talons au maximum, maintenez 1 seconde puis redescendez.",
  "Bulgarian Split Squat":
    "Pied arrière sur un banc, haltères en mains. Descendez le genou arrière vers le sol puis remontez en poussant le talon avant.",
  "Glute Kickback":
    "À la poulie ou machine, jambe tendue vers l'arrière en contractant le fessier. Revenez sans cambrer le dos.",
  "Hip Thrust":
    "Dos contre un banc, barre sur les hanches. Poussez les hanches vers le haut en serrant les fessiers, redescendez en contrôlant.",
  "Dumbbell Squat":
    "Haltère tenu devant la poitrine (goblet), pieds largeur épaules. Descendez les fesses vers le sol dos droit, remontez en poussant les talons.",

  // Abs
  "Sit-Up":
    "Allongé genoux fléchis, mains derrière la tête. Relevez le buste en contractant les abdominaux sans tirer sur la nuque.",
  "V-Up":
    "Allongé bras tendus au-dessus de la tête. Relevez simultanément buste et jambes tendues pour former un V, revenez en contrôle.",
  "Reverse Crunch":
    "Allongé mains au sol, genoux fléchis à 90°. Ramenez les genoux vers la poitrine en décollant les fesses, redescendez lentement.",
  Plank: "En appui sur avant-bras et pointes de pieds, corps parfaitement droit. Contractez abdominaux et fessiers, respirez normalement.",
  "Mountain Climber":
    "Position planche haute, ramenez alternativement les genoux vers la poitrine rapidement en gardant le bassin stable.",
};

export function getExerciseInstruction(name: string): string | null {
  if (EXERCISE_INSTRUCTIONS[name]) return EXERCISE_INSTRUCTIONS[name];
  const lower = name.trim().toLowerCase();
  for (const [k, v] of Object.entries(EXERCISE_INSTRUCTIONS)) {
    if (k.toLowerCase() === lower) return v;
  }
  return null;
}
