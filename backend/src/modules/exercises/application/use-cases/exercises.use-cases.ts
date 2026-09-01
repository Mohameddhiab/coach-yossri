import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { fail } from '@/shared/common/errors/domain-exception';
import {
  WgerApiAdapter,
  type WgerSearchItem,
} from '../../infrastructure/external/wger-api.adapter';
import { ExerciseImageService } from '../exercise-image.service';
import { CURATED_EXERCISES } from '../../../../../prisma/data/curated-exercises';

@Injectable()
export class SearchWgerExercisesUseCase {
  constructor(private readonly wger: WgerApiAdapter) {}

  async execute(term: string): Promise<WgerSearchItem[]> {
    const q = term.trim();
    if (q.length < 2) return [];
    try {
      return await this.wger.search(q, 'fr,en');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('abort'))
        fail(502, 'WGER_TIMEOUT', 'تعذر الاتصال بقاعدة التمارين — حاول لاحقاً');
      fail(
        502,
        'WGER_UNAVAILABLE',
        'تعذر الاتصال بقاعدة التمارين — حاول لاحقاً',
      );
    }
  }
}

@Injectable()
export class ImportExerciseFromWgerUseCase {
  constructor(
    private readonly wger: WgerApiAdapter,
    private readonly prisma: PrismaService,
    private readonly images: ExerciseImageService,
  ) {}

  async execute(wgerUuid: string, authUserId: string) {
    const uuid = wgerUuid.trim();
    if (!uuid) fail(400, 'BAD_UUID', 'المعرّف ناقص');
    const existing = await this.prisma.exercise.findUnique({
      where: { wgerUuid: uuid },
    });
    if (existing) return existing;

    let item: WgerSearchItem | null = null;
    try {
      item = await this.wger.fetchByUuid(uuid);
    } catch {
      fail(
        502,
        'WGER_UNAVAILABLE',
        'تعذر الاتصال بقاعدة التمارين — حاول لاحقاً',
      );
    }
    if (!item) fail(404, 'WGER_NOT_FOUND', 'التمرين غير موجود على wger');

    const hosted = await this.images.rehostIfNeeded(
      item.wgerUuid,
      item.imageUrl,
    );

    return this.prisma.exercise.create({
      data: {
        name: item.name,
        imageUrl: hosted.url ?? item.imageUrl,
        imageThumbUrl: hosted.thumbUrl ?? item.imageThumbUrl,
        source: 'WGER',
        wgerUuid: item.wgerUuid,
        category: item.category,
        licenseTitle: item.licenseTitle,
        licenseAuthor: item.licenseAuthor,
        createdBy: authUserId,
      },
    });
  }
}

@Injectable()
export class ListLocalExercisesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(q?: string) {
    const trimmed = q?.trim() ?? '';
    const where = trimmed
      ? { name: { contains: trimmed, mode: 'insensitive' as const } }
      : {};
    // q vide = bibliothèque complète → 1500 max (seed 1000 + marge)
    const take = trimmed ? 30 : 1500;
    return await this.prisma.exercise.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take,
    });
  }
}

@Injectable()
export class EnsureCuratedExercisesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<{ count: number; seeded: boolean }> {
    const count = await this.prisma.exercise.count();
    if (count >= 43) {
      // déjà 43+ → on considère OK, pas de reseed pour ne pas écraser
      return { count, seeded: false };
    }
    // sinon reseed complet des 43 curated (comme en local Docker)
    await this.prisma.exercise.deleteMany({});
    for (const ex of CURATED_EXERCISES) {
      await this.prisma.exercise.create({
        data: {
          name: ex.name,
          category: ex.category,
          source: 'MANUAL',
          wgerUuid: null,
          imageUrl: null,
          imageThumbUrl: null,
          createdBy: 'ensure-curated',
        },
      });
    }
    const finalCount = await this.prisma.exercise.count();
    return { count: finalCount, seeded: true };
  }
}
