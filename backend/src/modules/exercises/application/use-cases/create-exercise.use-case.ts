import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { fail } from '@/shared/common/errors/domain-exception';

const VALID_CATEGORIES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Abs',
];

export interface CreateExerciseInput {
  name: string;
  category: string;
  imageUrl?: string | null;
  createdBy: string;
}

@Injectable()
export class CreateExerciseUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateExerciseInput) {
    const name = input.name.trim();
    if (name.length < 2) {
      fail(400, 'VALIDATION', 'اسم التمرين قصير جداً');
    }

    const category = input.category.trim();
    if (!VALID_CATEGORIES.includes(category)) {
      fail(
        400,
        'VALIDATION',
        `فئة غير صالحة. الفئات المدعومة: ${VALID_CATEGORIES.join(', ')}`,
      );
    }

    // Check duplicate name (case-insensitive)
    const existing = await this.prisma.exercise.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      fail(409, 'CONFLICT', 'تمرين بهذا الاسم موجود بالفعل');
    }

    const exercise = await this.prisma.exercise.create({
      data: {
        name,
        category,
        imageUrl: input.imageUrl ?? null,
        source: 'MANUAL',
        createdBy: input.createdBy,
      },
    });

    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      image_url: exercise.imageUrl,
      source: exercise.source,
      created_by: exercise.createdBy,
      created_at: exercise.createdAt.toISOString(),
    };
  }
}
