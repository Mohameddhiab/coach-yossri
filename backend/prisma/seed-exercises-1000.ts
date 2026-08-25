import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const WGER_BASE = process.env.WGER_BASE_URL ?? "https://wger.de/api/v2";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.SUPABASE_EXERCISE_BUCKET ?? "exercise-images";
const TARGET = Number(process.env.SEED_TARGET ?? "1000");
const PAGE_SIZE = 50;

interface WgerRaw {
  id: number;
  uuid: string;
  category?: { name?: string } | null;
  translations?: { name: string; language: number }[];
  images?: { image: string; thumbnails?: { medium?: string }; is_main?: boolean; license_title?: string | null; license_author?: string | null }[];
}

const LANG_ID: Record<string, number> = { fr: 12, en: 2 };

function pickTranslation(translations: WgerRaw["translations"], prefer: string[]): string | null {
  if (!translations?.length) return null;
  for (const code of prefer) {
    const id = LANG_ID[code];
    const hit = translations.find((t) => t.language === id);
    if (hit) return hit.name;
  }
  return translations[0].name;
}

async function wgerPage(limit: number, offset: number): Promise<{ results: WgerRaw[]; count: number }> {
  const url = new URL(`${WGER_BASE.replace(/\/$/, "")}/exerciseinfo/`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("language__code", "fr,en");
  // pas de name__search → on parcourt tout
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`wger ${res.status} ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as { results?: WgerRaw[]; count?: number } | WgerRaw[];
  if (Array.isArray(data)) return { results: data, count: data.length };
  return { results: (data as { results?: WgerRaw[] }).results ?? [], count: (data as { count?: number }).count ?? 0 };
}

async function rehostToSupabase(wgerUuid: string, srcUrl: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return srcUrl;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const res = await fetch(srcUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return srcUrl;
    const buf = Buffer.from(await res.arrayBuffer());
    let out: Buffer = buf;
    try {
      const sharp = (await import("sharp")).default;
      out = await sharp(buf).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch {}
    const key = `${wgerUuid}.webp`;
    const { error } = await supabase.storage.from(BUCKET).upload(key, out, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
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
  console.log(`Seed 1000 — pagination wger (page ${PAGE_SIZE}) — target=${TARGET} supabase=${!!SUPABASE_URL} bucket=${BUCKET}`);
  let totalInDb = await prisma.exercise.count();
  console.log(`Déjà en base: ${totalInDb}`);
  let offset = 0;
  let fetched = 0;
  let created = 0;
  let skipped = 0;
  const seenThisRun = new Set<string>();

  while (created + totalInDb < TARGET) {
    console.log(`\n→ page offset=${offset} limit=${PAGE_SIZE} (total créé: ${created}, en base: ${totalInDb + created})`);
    let page: { results: WgerRaw[]; count: number };
    try {
      page = await wgerPage(PAGE_SIZE, offset);
    } catch (e) {
      console.error(`  page failed: ${e} — retry dans 2s`);
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    if (!page.results.length) {
      console.log("  plus de résultats wger — fin");
      break;
    }
    fetched += page.results.length;
    console.log(`  wger total count=${page.count} — reçus ${page.results.length} (cumul fetch ${fetched})`);
    for (const raw of page.results) {
      if (seenThisRun.has(raw.uuid)) continue;
      seenThisRun.add(raw.uuid);
      const exists = await prisma.exercise.findUnique({ where: { wgerUuid: raw.uuid } });
      if (exists) {
        skipped++;
        continue;
      }
      const name = pickTranslation(raw.translations, ["fr", "en"]) ?? `Exercise ${raw.id}`;
      const mainImg = raw.images?.find((im) => im.is_main) ?? raw.images?.[0] ?? null;
      let imageUrl: string | null = mainImg?.image ?? null;
      let imageThumbUrl: string | null = mainImg?.thumbnails?.medium ?? null;
      // en prod on re-héberge ; en dev on garde l'URL wger (rapide)
      if (imageUrl && SUPABASE_URL) {
        const hosted = await rehostToSupabase(raw.uuid, imageUrl);
        if (hosted) {
          imageUrl = hosted;
          imageThumbUrl = hosted;
        }
        // petite pause pour ne pas spammer Supabase
        await new Promise((r) => setTimeout(r, 150));
      }
      await prisma.exercise.create({
        data: {
          name,
          imageUrl,
          imageThumbUrl,
          source: "WGER",
          wgerUuid: raw.uuid,
          category: raw.category?.name ?? null,
          licenseTitle: mainImg?.license_title ?? null,
          licenseAuthor: mainImg?.license_author ?? null,
          createdBy: "seed-1000",
        },
      });
      created++;
      if (created % 50 === 0) console.log(`  ... ${created} créés (dernier: ${name})`);
      if (created + totalInDb >= TARGET) break;
    }
    offset += PAGE_SIZE;
    // pause anti rate-limit wger
    await new Promise((r) => setTimeout(r, 600));
    if (created + totalInDb >= TARGET) break;
  }
  const finalCount = await prisma.exercise.count();
  console.log(`\nDone — créés cette exécution: ${created}, skipped (déjà): ${skipped}, total en base: ${finalCount}`);
  if (finalCount < TARGET) {
    console.log(`Note: wger n'a que ${finalCount} exercices traduits fr/en — cible ${TARGET} non atteinte (max disponible)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
