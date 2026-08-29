import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import {
  CURATED_EXERCISES,
  FALLBACK_IMAGE_BY_CATEGORY,
} from './data/curated-exercises';

const prisma = new PrismaClient();
const WGER_BASE = process.env.WGER_BASE_URL ?? 'https://wger.de/api/v2';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.SUPABASE_EXERCISE_BUCKET ?? 'exercise-images';

interface WgerRaw {
  id: number;
  uuid: string;
  category?: { name?: string } | null;
  translations?: { name: string; language: number }[];
  images?: {
    image: string;
    thumbnails?: { medium?: string };
    is_main?: boolean;
    license_title?: string | null;
    license_author?: string | null;
  }[];
}

async function wgerSearch(term: string): Promise<WgerRaw[]> {
  const url = new URL(`${WGER_BASE.replace(/\/$/, '')}/exerciseinfo/`);
  url.searchParams.set('name__search', term);
  url.searchParams.set('language__code', 'fr,en');
  url.searchParams.set('limit', '6');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`wger ${res.status}`);
  const data = (await res.json()) as { results?: WgerRaw[] } | WgerRaw[];
  const list: WgerRaw[] = Array.isArray(data)
    ? data
    : ((data as { results?: WgerRaw[] }).results ?? []);
  return list;
}

function pickBestImage(
  images?: WgerRaw['images'],
): {
  url: string | null;
  thumb: string | null;
  licenseTitle: string | null;
  licenseAuthor: string | null;
} | null {
  if (!images?.length) return null;
  const main = images.find((im) => im.is_main) ?? images[0];
  if (!main?.image) return null;
  return {
    url: main.image,
    thumb: main.thumbnails?.medium ?? main.image,
    licenseTitle: main.license_title ?? null,
    licenseAuthor: main.license_author ?? null,
  };
}

async function rehostToSupabase(
  wgerUuid: string,
  srcUrl: string,
): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return srcUrl;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const res = await fetch(srcUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return srcUrl;
    const buf = Buffer.from(await res.arrayBuffer());
    let out: Buffer = buf;
    try {
      const sharp = (await import('sharp')).default;
      out = await sharp(buf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {}
    const key = `${wgerUuid}.webp`;
    const { error } = await supabase.storage.from(BUCKET).upload(key, out, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '31536000',
    });
    if (error) {
      console.warn(`  upload failed ${key}: ${error.message}`);
      return srcUrl;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl ?? srcUrl;
  } catch (e) {
    console.warn(`  rehost failed ${srcUrl}: ${e}`);
    return srcUrl;
  }
}

async function main() {
  console.log(
    `Seed curated — ${CURATED_EXERCISES.length} exercices — supabase=${!!SUPABASE_URL} bucket=${BUCKET}`,
  );
  console.log('Suppression des 860 exercices wger existants...');
  const deleted = await prisma.exercise.deleteMany({});
  console.log(`  supprimés: ${deleted.count}`);

  let created = 0;
  const usedWgerUuids = new Set<string>();
  for (const curated of CURATED_EXERCISES) {
    // Recherche wger pour image (essaye name puis aliases)
    let best: { raw: WgerRaw; img: ReturnType<typeof pickBestImage> } | null =
      null;
    const terms = [curated.name, ...curated.aliases].slice(0, 3);
    for (const term of terms) {
      try {
        const raws = await wgerSearch(term);
        // Préfère exact match fr/en, sinon premier avec image
        let candidate: WgerRaw | undefined;
        const lowerTerm = term.trim().toLowerCase();
        for (const r of raws) {
          const names = (r.translations ?? []).map((t) =>
            t.name.trim().toLowerCase(),
          );
          if (names.includes(lowerTerm) && pickBestImage(r.images)) {
            candidate = r;
            break;
          }
        }
        if (!candidate) candidate = raws.find((r) => pickBestImage(r.images));
        if (!candidate) candidate = raws[0];
        if (candidate) {
          const img = pickBestImage(candidate.images);
          if (img?.url) {
            best = { raw: candidate, img };
            break;
          }
        }
      } catch (e) {
        console.warn(`  wger search "${term}" failed: ${e}`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    let imageUrl: string | null = null;
    let imageThumbUrl: string | null = null;
    let wgerUuid: string | null = null;
    let licenseTitle: string | null = null;
    let licenseAuthor: string | null = null;

    if (best) {
      const candidateUuid = best.raw.uuid;
      // Évite le conflit unique si deux curated pointent vers même wgerUuid (ex Flat vs Incline)
      if (usedWgerUuids.has(candidateUuid)) {
        console.log(
          `  ↳ wgerUuid ${candidateUuid.slice(0, 8)} déjà utilisé pour "${curated.name}" → on garde l'image mais sans wgerUuid`,
        );
        wgerUuid = null;
      } else {
        wgerUuid = candidateUuid;
        usedWgerUuids.add(candidateUuid);
      }
      imageUrl = best.img!.url;
      imageThumbUrl = best.img!.thumb;
      licenseTitle = best.img!.licenseTitle;
      licenseAuthor = best.img!.licenseAuthor;
      if (imageUrl && SUPABASE_URL && wgerUuid) {
        const hosted = await rehostToSupabase(wgerUuid, imageUrl);
        if (hosted) {
          imageUrl = hosted;
          imageThumbUrl = hosted;
        }
        await new Promise((r) => setTimeout(r, 150));
      } else if (imageUrl && SUPABASE_URL && !wgerUuid) {
        // Pas de wgerUuid unique → on garde l'URL wger telle quelle (ou fallback)
      }
    } else {
      // Fallback générique par catégorie
      imageUrl = FALLBACK_IMAGE_BY_CATEGORY[curated.category] ?? null;
      imageThumbUrl = imageUrl;
      console.log(
        `  ↳ pas d'image wger pour "${curated.name}" → fallback ${curated.category}`,
      );
    }

    await prisma.exercise.create({
      data: {
        name: curated.name,
        imageUrl,
        imageThumbUrl,
        source: 'MANUAL',
        wgerUuid,
        category: curated.category,
        licenseTitle,
        licenseAuthor,
        createdBy: 'seed-curated',
      },
    });
    created++;
    console.log(
      `  + ${curated.name} (${curated.category}) ${imageUrl ? '[img]' : '[no img]'} ${wgerUuid ? wgerUuid.slice(0, 8) : 'no-uuid'}`,
    );
    await new Promise((r) => setTimeout(r, 200));
  }

  const finalCount = await prisma.exercise.count();
  console.log(
    `\nDone — ${created} curated créés, total en base: ${finalCount}`,
  );
  // Vérif groupement
  const byCat = await prisma.exercise.groupBy({
    by: ['category'],
    _count: true,
  });
  console.log(
    'Par catégorie:',
    byCat.map((g) => `${g.category}:${g._count}`).join(' '),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
