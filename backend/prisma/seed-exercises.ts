import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const WGER_BASE = process.env.WGER_BASE_URL ?? 'https://wger.de/api/v2';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.SUPABASE_EXERCISE_BUCKET ?? 'exercise-images';

const QUERIES = [
  'bench press',
  'squat',
  'deadlift',
  'pull up',
  'push up',
  'shoulder press',
  'biceps curl',
  'triceps',
  'leg press',
  'lunge',
  'plank',
  'burpee',
  'row',
  'lateral raise',
  'overhead press',
  'chest fly',
  'leg curl',
  'leg extension',
  'calf raise',
  'dip',
  'chin up',
  'romanian deadlift',
  'hip thrust',
  'kettlebell swing',
  'dumbbell press',
  'incline bench',
  'decline bench',
  'cable crossover',
  'lat pulldown',
  'hammer curl',
];

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

const LANG_ID: Record<string, number> = { fr: 12, en: 2 };

function pickTranslation(
  translations: WgerRaw['translations'],
  prefer: string[],
  term?: string,
): string | null {
  if (!translations?.length) return null;
  if (term) {
    const q = term.trim().toLowerCase();
    const exact = translations.find((t) => t.name.trim().toLowerCase() === q);
    if (exact) return exact.name;
  }
  for (const code of prefer) {
    const id = LANG_ID[code];
    const hit = translations.find((t) => t.language === id);
    if (hit) return hit.name;
  }
  return translations[0].name;
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

async function rehostToSupabase(
  wgerUuid: string,
  srcUrl: string,
): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return srcUrl;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const res = await fetch(srcUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return srcUrl;
    const buf = Buffer.from(await res.arrayBuffer());
    let out: Buffer = buf;
    try {
      const sharp = (await import('sharp')).default;
      out = await sharp(buf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      // keep original
    }
    const key = `${wgerUuid}.webp`;
    const { error } = await supabase.storage.from(BUCKET).upload(key, out, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '31536000',
    });
    if (error) {
      console.warn(`upload failed ${key}: ${error.message}`);
      return srcUrl;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl ?? srcUrl;
  } catch (e) {
    console.warn(`rehost failed ${srcUrl}: ${e}`);
    return srcUrl;
  }
}

async function main() {
  console.log(
    `Seeding up to 100 exercises from wger (${QUERIES.length} queries) — bucket=${BUCKET} supabase=${!!SUPABASE_URL}`,
  );
  let total = 0;
  const seen = new Set<string>();
  for (const q of QUERIES) {
    console.log(`\n→ "${q}"`);
    let raws: WgerRaw[];
    try {
      raws = await wgerSearch(q);
    } catch (e) {
      console.warn(`  search failed: ${e}`);
      continue;
    }
    for (const raw of raws) {
      if (seen.has(raw.uuid)) continue;
      seen.add(raw.uuid);
      const existing = await prisma.exercise.findUnique({
        where: { wgerUuid: raw.uuid },
      });
      if (existing) {
        console.log(`  skip ${raw.uuid} (${existing.name}) already exists`);
        total++;
        continue;
      }
      const name =
        pickTranslation(raw.translations, ['fr', 'en'], q) ??
        pickTranslation(raw.translations, ['fr', 'en']) ??
        `Exercise ${raw.id}`;
      const mainImg =
        raw.images?.find((im) => im.is_main) ?? raw.images?.[0] ?? null;
      let imageUrl: string | null = mainImg?.image ?? null;
      let imageThumbUrl: string | null = mainImg?.thumbnails?.medium ?? null;
      if (imageUrl && SUPABASE_URL) {
        const hosted = await rehostToSupabase(raw.uuid, imageUrl);
        if (hosted) {
          imageUrl = hosted;
          imageThumbUrl = hosted;
        }
      }
      await prisma.exercise.create({
        data: {
          name,
          imageUrl,
          imageThumbUrl,
          source: 'WGER',
          wgerUuid: raw.uuid,
          category: raw.category?.name ?? null,
          licenseTitle: mainImg?.license_title ?? null,
          licenseAuthor: mainImg?.license_author ?? null,
          createdBy: 'seed',
        },
      });
      total++;
      console.log(
        `  + ${name} (${raw.uuid}) ${imageUrl ? '[img]' : '[no img]'}`,
      );
      if (total >= 100) break;
    }
    if (total >= 100) break;
    // petite pause pour ne pas spammer wger
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(
    `\nDone — ${total} exercises in library (total in DB: ${await prisma.exercise.count()})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
