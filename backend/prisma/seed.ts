import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding 9awi database…');
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
    prisma.followUp.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: 'yosricoach@gmail.com',
      role: 'COACH',
      nom: 'Yosri',
      prenom: 'Coach',
      telephone: '20123456',
      passwordHash: await passwordHash('admin1234'),
      createdAt: daysAgo(400),
    },
  });

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

  const mkTemplate = (
    titre: string,
    objectif: 'PRISE_DE_MASSE' | 'SECHE' | 'MAINTIEN',
    caloriesCible: number,
    proteinesG: number,
    glucidesG: number,
    lipidesG: number,
  ) =>
    prisma.mealPlan.create({
      data: {
        userId: admin.id,
        coachId: admin.id,
        titre,
        objectif: objectif as never,
        caloriesCible,
        proteinesG,
        glucidesG,
        lipidesG,
        statut: 'ACTIF',
        isTemplate: true,
        version: 1,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(2),
      },
    });

  const tplMasse = await mkTemplate(
    'قالب: بناء الكتلة (3,000 سعرة)',
    'PRISE_DE_MASSE',
    3000,
    180,
    380,
    90,
  );
  const tplSeche = await mkTemplate(
    'قالب: التنشيف (2,000 سعرة)',
    'SECHE',
    2000,
    170,
    160,
    55,
  );
  const tplMaintien = await mkTemplate(
    'قالب: المحافظة (2,500 سعرة)',
    'MAINTIEN',
    2500,
    150,
    300,
    80,
  );

  await Promise.all([
    mkMeal(
      tplMasse.id,
      'TOUS_LES_JOURS',
      'PETIT_DEJ',
      '5 بيضات + 100غ شوفان + موز + عسل',
      850,
      46,
      100,
      28,
    ),
    mkMeal(
      tplMasse.id,
      'TOUS_LES_JOURS',
      'DEJEUNER',
      '250غ رز + 250غ صدر دجاج + خضار + زيت زيتون',
      1050,
      62,
      140,
      28,
    ),
    mkMeal(
      tplMasse.id,
      'TOUS_LES_JOURS',
      'COLLATION',
      'شيك بروتين + 40غ لوز + موز',
      450,
      40,
      40,
      22,
    ),
    mkMeal(
      tplMasse.id,
      'TOUS_LES_JOURS',
      'DINER',
      '300غ بطاطا + 200غ لحم + خضار سوتيه',
      1000,
      58,
      110,
      30,
    ),
    mkMeal(
      tplSeche.id,
      'TOUS_LES_JOURS',
      'PETIT_DEJ',
      '3 بياض بيض + 40غ شوفان + قهوة سوداء',
      350,
      30,
      35,
      8,
    ),
    mkMeal(
      tplSeche.id,
      'TOUS_LES_JOURS',
      'DEJEUNER',
      '120غ رز كامل + 200غ دجاج + سلطة',
      550,
      50,
      55,
      12,
    ),
    mkMeal(
      tplSeche.id,
      'TOUS_LES_JOURS',
      'COLLATION',
      'سكوب بروتين بالماء + خيار',
      130,
      26,
      5,
      2,
    ),
    mkMeal(
      tplSeche.id,
      'TOUS_LES_JOURS',
      'DINER',
      '150غ سمك + سلطة كبيرة بزيت الزيتون',
      520,
      45,
      20,
      22,
    ),
    mkMeal(
      tplMaintien.id,
      'TOUS_LES_JOURS',
      'PETIT_DEJ',
      '4 بيضات + 70غ شوفان + فواكه',
      620,
      38,
      70,
      20,
    ),
    mkMeal(
      tplMaintien.id,
      'TOUS_LES_JOURS',
      'DEJEUNER',
      '180غ رز + 200غ دجاج + سلطة',
      780,
      55,
      90,
      18,
    ),
    mkMeal(
      tplMaintien.id,
      'TOUS_LES_JOURS',
      'COLLATION',
      'زبادي يوناني + لوز + توت',
      320,
      20,
      25,
      16,
    ),
    mkMeal(
      tplMaintien.id,
      'TOUS_LES_JOURS',
      'DINER',
      '200غ سمك + بطاطا مسلوقة + خضار',
      650,
      48,
      60,
      20,
    ),
  ]);

  console.log('Seed done ✅ — admin account created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
