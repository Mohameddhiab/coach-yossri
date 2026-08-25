import { getSubscriptionStatus, effectiveDateFin } from "./subscription-status";

const DAY = 86400000;
const now = Date.now();
const sub = (over: Partial<Parameters<typeof getSubscriptionStatus>[0]> = {}) => ({
  dateDebut: new Date(now - 30 * DAY),
  dateFin: new Date(now + 30 * DAY),
  pauseStart: null,
  pauseDays: 0,
  statut: "ACTIF",
  ...over,
});

describe("getSubscriptionStatus", () => {
  it("retourne EXPIRE sans abonnement", () => {
    expect(getSubscriptionStatus(null)).toBe("EXPIRE");
  });

  it("retourne ACTIF pour un abonnement en cours (> 7j)", () => {
    expect(getSubscriptionStatus(sub())).toBe("ACTIF");
  });

  it("retourne EXPIRE_BIENTOT à 5 jours de la fin", () => {
    expect(getSubscriptionStatus(sub({ dateFin: new Date(now + 5 * DAY) }))).toBe(
      "EXPIRE_BIENTOT",
    );
  });

  it("retourne EXPIRE après la fin", () => {
    expect(getSubscriptionStatus(sub({ dateFin: new Date(now - DAY) }))).toBe("EXPIRE");
  });

  it("repousse la fin des pause_days", () => {
    const s = sub({ dateFin: new Date(now + 2 * DAY), pauseDays: 30 });
    expect(getSubscriptionStatus(s)).toBe("ACTIF");
    expect(effectiveDateFin(s).getTime()).toBe(now + 32 * DAY);
  });

  it("retourne ESSAI tant que la fin d'essai n'est pas dépassée", () => {
    expect(getSubscriptionStatus(sub({ statut: "ESSAI" }))).toBe("ESSAI");
  });

  it("retourne EXPIRE pour un essai dépassé", () => {
    expect(
      getSubscriptionStatus(sub({ statut: "ESSAI", dateFin: new Date(now - DAY) })),
    ).toBe("EXPIRE");
  });

  it("retourne EXPIRE si l'abonnement n'a pas encore commencé", () => {
    expect(getSubscriptionStatus(sub({ dateDebut: new Date(now + DAY) }))).toBe("EXPIRE");
  });
});