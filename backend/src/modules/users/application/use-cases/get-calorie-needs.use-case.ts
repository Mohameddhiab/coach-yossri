import { Inject, Injectable } from "@nestjs/common";
import { fail } from "@/shared/common/errors/domain-exception";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import { PROGRESS_REPOSITORY, type ProgressRepository } from "@/shared/domain/ports/progress-repository.port";

export type ActiviteLevel = "SEDENTAIRE" | "LEGER" | "MODERE" | "INTENSE";

const ACTIVITY_FACTORS: Record<ActiviteLevel, number> = {
  SEDENTAIRE: 1.2,
  LEGER: 1.375,
  MODERE: 1.55,
  INTENSE: 1.725,
};

const OBJECTIVE_DELTAS: Record<string, number> = {
  PRISE_DE_MASSE: 400,
  SECHE: -450,
  MAINTIEN: 0,
};

@Injectable()
export class GetCalorieNeedsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROGRESS_REPOSITORY) private readonly progress: ProgressRepository,
  ) {}

  async execute(userId: string, activite: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      fail(404, "NOT_FOUND", "المستخدم غير موجود");
    }
    const level: ActiviteLevel = (Object.keys(ACTIVITY_FACTORS) as ActiviteLevel[]).includes(
      activite as ActiviteLevel,
    )
      ? (activite as ActiviteLevel)
      : "MODERE";

    const lastWeight = await this.progress.lastWeight(userId);
    const weightKg = lastWeight?.poidsKg ?? null;
    if (weightKg === null) {
      fail(409, "NO_WEIGHT", "لا يوجد وزن مسجل لهذا العضو — سجّل وزناً أولاً");
    }
    if (!user.sexe || user.tailleCm === null) {
      fail(409, "MISSING_PROFILE", "أكمل جنس العضو وطوله في بطاقته أولاً");
    }
    if (!user.dateNaissance) {
      fail(409, "MISSING_PROFILE", "أضف تاريخ ميلاد العضو لحساب عمره");
    }

    const age = Math.max(
      0,
      Math.floor((Date.now() - new Date(user.dateNaissance).getTime()) / 31557600000),
    );
    const base = 10 * weightKg + 6.25 * user.tailleCm - 5 * age;
    const bmr = user.sexe === "FEMME" ? base - 161 : base + 5;
    const tdee = bmr * ACTIVITY_FACTORS[level];

    const round = (n: number) => Math.round(n);
    const macros = (calories: number) => {
      const proteinesG = round(2 * weightKg);
      const lipidesG = round((calories * 0.25) / 9);
      const glucidesG = round(Math.max(0, (calories - proteinesG * 4 - lipidesG * 9) / 4));
      return { calories: round(calories), proteines_g: proteinesG, glucides_g: glucidesG, lipides_g: lipidesG };
    };

    const suggestions: Record<string, ReturnType<typeof macros>> = {};
    for (const [key, delta] of Object.entries(OBJECTIVE_DELTAS)) {
      suggestions[key] = macros(tdee + delta);
    }

    return {
      sexe: user.sexe,
      taille_cm: user.tailleCm,
      age,
      poids_kg: weightKg,
      activite: level,
      bmr: round(bmr),
      tdee: round(tdee),
      suggestions,
    };
  }
}