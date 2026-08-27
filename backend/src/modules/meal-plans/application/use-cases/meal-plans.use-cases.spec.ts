import { normalizeMeals } from "./meal-plans.use-cases";

describe("normalizeMeals", () => {
  it("ignore les repas sans description", () => {
    expect(normalizeMeals([{ description: "" }, { description: "   " }, null as never])).toHaveLength(0);
  });

  it("déduplique par jour + type + description (insensible à la casse)", () => {
    const meals = normalizeMeals([
      { jourSemaine: "LUN", typeRepas: "DEJEUNER", description: "Poulet riz" },
      { jourSemaine: "LUN", typeRepas: "DEJEUNER", description: "poulet riz" },
      { jourSemaine: "LUN", typeRepas: "DINER", description: "Poulet riz" },
    ]);
    expect(meals).toHaveLength(2);
  });

  it("assigne des valeurs par défaut pour jour/type invalides", () => {
    const meals = normalizeMeals([{ description: "Repas" }]);
    expect(meals).toHaveLength(1);
    expect(meals[0].typeRepas).toBe("DEJEUNER");
    expect(["SAM", "DIM", "LUN", "MAR", "MER", "JEU", "VEN", "TOUS_LES_JOURS"]).toContain(
      meals[0].jourSemaine,
    );
  });

  it("normalise les macros numériques et alternatives", () => {
    const meals = normalizeMeals([
      {
        jourSemaine: "MAR",
        typeRepas: "PETIT_DEJ",
        description: "Œufs",
        calories: 350,
        proteinesG: 20,
        alternatives: "   yaourt   ",
      },
    ]);
    expect(meals[0].calories).toBe(350);
    expect(meals[0].proteinesG).toBe(20);
    expect(meals[0].alternatives).toBe("yaourt");
  });

  it("retourne [] pour une entrée non-array", () => {
    expect(normalizeMeals(undefined as never)).toEqual([]);
  });
});