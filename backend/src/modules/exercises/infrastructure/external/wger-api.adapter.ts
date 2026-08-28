import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WgerSearchItem {
  wgerId: number;
  wgerUuid: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  licenseTitle: string | null;
  licenseAuthor: string | null;
}

interface ExerciseInfoRaw {
  id: number;
  uuid: string;
  category?: { name?: string } | null;
  translations?: {
    name: string;
    description?: string | null;
    language: number | string;
  }[];
  images?: {
    image: string;
    thumbnails?: { small?: string; medium?: string };
    is_main?: boolean;
    license_title?: string | null;
    license_author?: string | null;
  }[];
  muscles?: unknown[];
  license?: unknown;
}

@Injectable()
export class WgerApiAdapter {
  private readonly logger = new Logger(WgerApiAdapter.name);
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private cache = new Map<string, { at: number; data: WgerSearchItem[] }>();
  private readonly ttlMs = 10 * 60 * 1000;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('WGER_BASE_URL') ?? 'https://wger.de/api/v2';
    this.token = this.config.get<string>('WGER_API_TOKEN');
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: 'application/json' };
    if (this.token) h.Authorization = `Token ${this.token}`;
    return h;
  }

  private readonly LANG_ID: Record<string, number> = { fr: 12, en: 2, de: 1 };

  private pickTranslation(
    translations: ExerciseInfoRaw['translations'],
    prefer: string[],
    searchTerm?: string,
  ): { name: string; description: string | null } | null {
    if (!translations?.length) return null;
    if (searchTerm) {
      const q = searchTerm.trim().toLowerCase();
      const exact = translations.find((t) => t.name.trim().toLowerCase() === q);
      if (exact)
        return { name: exact.name, description: exact.description ?? null };
    }
    for (const code of prefer) {
      const id = this.LANG_ID[code];
      if (id != null) {
        const hit = translations.find((t) => t.language === id);
        if (hit)
          return { name: hit.name, description: hit.description ?? null };
      }
    }
    return {
      name: translations[0].name,
      description: translations[0].description ?? null,
    };
  }

  private toItem(
    raw: ExerciseInfoRaw,
    searchTerm?: string,
  ): WgerSearchItem | null {
    const t = this.pickTranslation(raw.translations, ['fr', 'en'], searchTerm);
    if (!t) return null;
    const mainImg =
      raw.images?.find((im) => im.is_main) ?? raw.images?.[0] ?? null;
    const imageUrl = mainImg?.image ?? null;
    const imageThumbUrl =
      mainImg?.thumbnails?.medium ?? mainImg?.thumbnails?.small ?? null;
    const cat = raw.category?.name ?? null;
    return {
      wgerId: raw.id,
      wgerUuid: raw.uuid,
      name: t.name,
      description: t.description,
      category: cat,
      imageUrl,
      imageThumbUrl,
      licenseTitle: mainImg?.license_title ?? null,
      licenseAuthor: mainImg?.license_author ?? null,
    };
  }

  async search(term: string, language = 'fr,en'): Promise<WgerSearchItem[]> {
    const key = `${term.toLowerCase()}|${language}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < this.ttlMs) return cached.data;

    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/exerciseinfo/`);
    url.searchParams.set('name__search', term);
    url.searchParams.set('language__code', language);
    url.searchParams.set('limit', '10');
    url.searchParams.set('ordering', '-id');

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(url.toString(), {
        headers: this.headers(),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        this.logger.warn(
          `wger search ${res.status} ${await res.text().catch(() => '')}`,
        );
        throw new Error(`WGER_${res.status}`);
      }
      const data = (await res.json()) as
        { results?: ExerciseInfoRaw[] } | ExerciseInfoRaw[];
      const list: ExerciseInfoRaw[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { results?: unknown }).results)
          ? ((data as { results: ExerciseInfoRaw[] }).results ?? [])
          : [];
      const items = list
        .map((r) => this.toItem(r, term))
        .filter((x): x is WgerSearchItem => !!x);
      this.cache.set(key, { at: Date.now(), data: items });
      return items;
    } finally {
      clearTimeout(to);
    }
  }

  async fetchByUuid(uuid: string): Promise<WgerSearchItem | null> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/exerciseinfo/`);
    url.searchParams.set('uuid', uuid);
    url.searchParams.set('limit', '1');
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(url.toString(), {
        headers: this.headers(),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`WGER_${res.status}`);
      const data = (await res.json()) as
        { results?: ExerciseInfoRaw[] } | ExerciseInfoRaw[];
      const list: ExerciseInfoRaw[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { results?: unknown }).results)
          ? ((data as { results: ExerciseInfoRaw[] }).results ?? [])
          : [];
      const raw = list[0];
      if (!raw) return null;
      return this.toItem(raw);
    } finally {
      clearTimeout(to);
    }
  }
}
