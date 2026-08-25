import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

function daysAgo(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding 9awi database…");
  const passwordHash = async (plain: string) => bcrypt.hash(plain, 10);

  await prisma.$transaction([
    prisma.coachNote.deleteMany(),
    prisma.monthlyGoal.deleteMany(),
    prisma.weightTarget.deleteMany(),
    prisma.weightLog.deleteMany(),
    prisma.progressPhoto.deleteMany(),
    prisma.mealPlanVersion.deleteMany(),
    prisma.meal.deleteMany(),
    prisma.mealPlan.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.notificationPrefs.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const coach = await prisma.user.create({
    data: {
      email: "coach@9awi.tn",
      role: "COACH",
      nom: "بن صالح",
      prenom: "أحمد",
      telephone: "20123456",
      passwordHash: await passwordHash("coach1234"),
      createdAt: daysAgo(400),
    },
  });

  const mkUser = async (
    prenom: string,
    nom: string,
    email: string,
    tel: string,
    createdDaysAgo: number,
    coachId: string,
    sexe: "HOMME" | "FEMME",
    tailleCm: number,
    ageYears: number,
    referredBy?: string,
  ) =>
    prisma.user.create({
      data: {
        email,
        role: "USER",
        nom,
        prenom,
        telephone: tel,
        sexe,
        tailleCm,
        dateNaissance: new Date(
          new Date().setFullYear(new Date().getFullYear() - ageYears),
        ),
        coachId,
        referredBy,
        passwordHash: await passwordHash("123456"),
        createdAt: daysAgo(createdDaysAgo),
      },
    });

  const u1 = await mkUser("يوسف", "الجبالي", "youssef@demo.tn", "22111222", 120, coach.id, "HOMME", 178, 26);
  const u2 = await mkUser("آدم", "بن عمر", "adem@demo.tn", "22333444", 95, coach.id, "HOMME", 176, 24);
  const u3 = await mkUser("سيف الدين", "الرقيق", "seif@demo.tn", "22555666", 200, coach.id, "HOMME", 183, 31);
  const u4 = await mkUser("مريم", "بن عاشور", "marwa@demo.tn", "22777888", 60, coach.id, "FEMME", 162, 23);
  const u5 = await mkUser("خليل", "حمودة", "khalil@demo.tn", "22999000", 30, coach.id, "HOMME", 170, 22, u1.id);
  const u6 = await mkUser("أنيس", "العياري", "anis@demo.tn", "55111222", 150, coach.id, "HOMME", 181, 28, u1.id);

  const mkSub = (
    userId: string,
    start: Date,
    end: Date,
    montant: number,
    created: Date,
    tier: "BASIC" | "PREMIUM" | "ELITE" = "BASIC",
  ) =>
    prisma.subscription.create({
      data: {
        userId,
        dateDebut: start,
        dateFin: end,
        montant,
        tier,
        modePaiement: "ESPECE",
        statut: "ACTIF",
        createdBy: coach.id,
        createdAt: created,
      },
    });

  await Promise.all([
    mkSub(u1.id, daysAgo(80), daysFromNow(100), 90, daysAgo(80), "ELITE"),
    mkSub(u2.id, daysAgo(90), daysFromNow(5), 50, daysAgo(90), "PREMIUM"),
    mkSub(u3.id, daysAgo(170), daysAgo(10), 55, daysAgo(170), "BASIC"),
    mkSub(u4.id, daysAgo(55), daysFromNow(65), 50, daysAgo(55), "PREMIUM"),
    mkSub(u5.id, daysAgo(35), daysFromNow(2), 30, daysAgo(35), "BASIC"),
    mkSub(u6.id, daysAgo(120), daysAgo(30), 55, daysAgo(120), "BASIC"),
  ]);

  const mkMeal = (
    planId: string,
    jourSemaine: string,
    typeRepas: string,
    description: string,
    calories: number,
    proteinesG: number,
    glucidesG: number,
    lipidesG: number,
    alternatives?: string,
  ) =>
    prisma.meal.create({
      data: {
        mealPlanId: planId,
        jourSemaine: jourSemaine as never,
        typeRepas: typeRepas as never,
        description,
        calories,
        proteinesG,
        glucidesG,
        lipidesG,
        alternatives,
      },
    });

  const plan1 = await prisma.mealPlan.create({
    data: {
      userId: u1.id,
      coachId: coach.id,
      titre: "خطة زيادة الكتلة — المرحلة 1",
      objectif: "PRISE_DE_MASSE",
      caloriesCible: 3200,
      proteinesG: 190,
      glucidesG: 420,
      lipidesG: 85,
      statut: "ACTIF",
      version: 2,
      createdAt: daysAgo(70),
      updatedAt: daysAgo(12),
    },
  });
  await Promise.all([
    mkMeal(plan1.id, "TOUS_LES_JOURS", "PETIT_DEJ", "4 بيضات + 80غ شوفان + موزة + ملعقة فول سوداني", 780, 42, 90, 26),
    mkMeal(plan1.id, "TOUS_LES_JOURS", "DEJEUNER", "200غ رز + 200غ صدر دجاج + سلطة بزيت الزيتون", 950, 60, 120, 25),
    mkMeal(plan1.id, "TOUS_LES_JOURS", "COLLATION", "شيك بروتين + 30غ لوز", 380, 35, 15, 20, "ممكن تونة بدل الشيك"),
    mkMeal(plan1.id, "TOUS_LES_JOURS", "DINER", "250غ بطاطا مشوية + 150غ لحم بقري + خضار", 900, 55, 90, 28),
    mkMeal(plan1.id, "SAM", "COLLATION", "تونة + خبز كامل + سلطة", 420, 38, 40, 12, "بدل: جبنة بيضاء"),
  ]);

  const plan2 = await prisma.mealPlan.create({
    data: {
      userId: u2.id,
      coachId: coach.id,
      titre: "خطة التنشيف — المرحلة 1",
      objectif: "SECHE",
      caloriesCible: 2200,
      proteinesG: 180,
      glucidesG: 200,
      lipidesG: 60,
      statut: "ACTIF",
      version: 1,
      createdAt: daysAgo(85),
      updatedAt: daysAgo(60),
    },
  });
  await Promise.all([
    mkMeal(plan2.id, "TOUS_LES_JOURS", "PETIT_DEJ", "3 بياض بيض + 50غ شوفان + قهوة", 420, 32, 45, 10),
    mkMeal(plan2.id, "TOUS_LES_JOURS", "DEJEUNER", "150غ رز كامل + 180غ صدر دجاج + خضار", 620, 48, 70, 12),
    mkMeal(plan2.id, "TOUS_LES_JOURS", "COLLATION", "سكوب بروتين بالماء", 150, 28, 4, 2),
    mkMeal(plan2.id, "TOUS_LES_JOURS", "DINER", "150غ سمك مشوي + سلطة كبيرة بزيت الزيتون", 520, 45, 20, 22),
  ]);

  const mkTemplate = (
    titre: string,
    objectif: "PRISE_DE_MASSE" | "SECHE" | "MAINTIEN",
    caloriesCible: number,
    proteinesG: number,
    glucidesG: number,
    lipidesG: number,
  ) =>
    prisma.mealPlan.create({
      data: {
        userId: coach.id,
        coachId: coach.id,
        titre,
        objectif: objectif as never,
        caloriesCible,
        proteinesG,
        glucidesG,
        lipidesG,
        statut: "ACTIF",
        isTemplate: true,
        version: 1,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(2),
      },
    });

  const tplMasse = await mkTemplate("قالب: بناء الكتلة (3,000 سعرة)", "PRISE_DE_MASSE", 3000, 180, 380, 90);
  const tplSeche = await mkTemplate("قالب: التنشيف (2,000 سعرة)", "SECHE", 2000, 170, 160, 55);
  const tplMaintien = await mkTemplate("قالب: المحافظة (2,500 سعرة)", "MAINTIEN", 2500, 150, 300, 80);

  await Promise.all([
    mkMeal(tplMasse.id, "TOUS_LES_JOURS", "PETIT_DEJ", "5 بيضات + 100غ شوفان + موز + عسل", 850, 46, 100, 28),
    mkMeal(tplMasse.id, "TOUS_LES_JOURS", "DEJEUNER", "250غ رز + 250غ صدر دجاج + خضار + زيت زيتون", 1050, 62, 140, 28),
    mkMeal(tplMasse.id, "TOUS_LES_JOURS", "COLLATION", "شيك بروتين + 40غ لوز + موز", 450, 40, 40, 22),
    mkMeal(tplMasse.id, "TOUS_LES_JOURS", "DINER", "300غ بطاطا + 200غ لحم + خضار سوتيه", 1000, 58, 110, 30),
    mkMeal(tplSeche.id, "TOUS_LES_JOURS", "PETIT_DEJ", "3 بياض بيض + 40غ شوفان + قهوة سوداء", 350, 30, 35, 8),
    mkMeal(tplSeche.id, "TOUS_LES_JOURS", "DEJEUNER", "120غ رز كامل + 200غ دجاج + سلطة", 550, 50, 55, 12),
    mkMeal(tplSeche.id, "TOUS_LES_JOURS", "COLLATION", "سكوب بروتين بالماء + خيار", 130, 26, 5, 2),
    mkMeal(tplSeche.id, "TOUS_LES_JOURS", "DINER", "150غ سمك + سلطة كبيرة بزيت الزيتون", 520, 45, 20, 22),
    mkMeal(tplMaintien.id, "TOUS_LES_JOURS", "PETIT_DEJ", "4 بيضات + 70غ شوفان + فواكه", 620, 38, 70, 20),
    mkMeal(tplMaintien.id, "TOUS_LES_JOURS", "DEJEUNER", "180غ رز + 200غ دجاج + سلطة", 780, 55, 90, 18),
    mkMeal(tplMaintien.id, "TOUS_LES_JOURS", "COLLATION", "زبادي يوناني + لوز + توت", 320, 20, 25, 16),
    mkMeal(tplMaintien.id, "TOUS_LES_JOURS", "DINER", "200غ سمك + بطاطا مسلوقة + خضار", 650, 48, 60, 20),
  ]);

  const weightSeries = (
    userId: string,
    startKg: number,
    deltaPerWeek: number,
    count: number,
    lastDaysAgo: number,
  ): { userId: string; date: Date; poidsKg: number; note: null }[] => {
    const rows: { userId: string; date: Date; poidsKg: number; note: null }[] = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        userId,
        date: daysAgo(lastDaysAgo + i * 7),
        poidsKg: Math.round((startKg - deltaPerWeek * i) * 10) / 10,
        note: null,
      });
    }
    return rows;
  };

  await prisma.weightLog.createMany({
    data: [
      ...weightSeries(u1.id, 84, 0.7, 9, 3),
      ...weightSeries(u2.id, 78, 0.9, 9, 10),
      ...weightSeries(u3.id, 91, 0.4, 10, 25),
      ...weightSeries(u4.id, 62, 0.3, 6, 2),
    ],
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  await prisma.monthlyGoal.create({
    data: {
      userId: u1.id,
      titre: "4 حصص تدريب هذا الشهر",
      mois: currentMonth,
      cible: 8,
      checkins: [1, 2, 3, 4, 5, 6, 7].map((i) => daysAgo(i, 19)),
      createdAt: daysAgo(10),
    },
  });

  await prisma.weightTarget.create({
    data: {
      userId: u1.id,
      poidsKg: 78,
      date: daysFromNow(50),
    },
  });

  await prisma.coachNote.createMany({
    data: [
      { coachId: coach.id, userId: u1.id, contenu: "يوسف يستجيب جيداً لخطة زيادة الكتلة — زد البروتين الأسبوع القادم.", createdAt: daysAgo(5, 18) },
      { coachId: coach.id, userId: u2.id, contenu: "آدم في شهر التنشيف الأخير — راجع التزامه بالشيك الأسبوعي.", createdAt: daysAgo(3, 10) },
      { coachId: coach.id, userId: u3.id, contenu: "سيف الدين انقطع عن التدريب — أرسل رسالة تحفيزية لتجديد الاشتراك.", createdAt: daysAgo(2, 9) },
    ],
  });

  const prefsByUser: Record<string, Partial<{ rappelPoids: boolean; motivation: boolean; expirationProche: boolean; nouveauPlan: boolean }>> = {
    [u1.id]: { rappelPoids: true, motivation: true, expirationProche: true, nouveauPlan: true },
    [u2.id]: { rappelPoids: true, motivation: false, expirationProche: true, nouveauPlan: true },
    [u3.id]: { rappelPoids: true, motivation: true, expirationProche: true, nouveauPlan: true },
    [u4.id]: { rappelPoids: false, motivation: true, expirationProche: true, nouveauPlan: true },
    [u5.id]: { rappelPoids: true, motivation: true, expirationProche: true, nouveauPlan: true },
    [u6.id]: { rappelPoids: true, motivation: true, expirationProche: true, nouveauPlan: true },
  };
  await prisma.notificationPrefs.createMany({
    data: Object.entries(prefsByUser).map(([userId, p]) => ({ userId, ...p })),
  });

  console.log("Seed done ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());