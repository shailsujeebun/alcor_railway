import { NextRequest, NextResponse } from 'next/server';

type TranslationCacheEntry = {
  value: string;
  expiresAt: number;
};

type TranslationCache = Map<string, TranslationCacheEntry>;
type InFlightTranslations = Map<string, Promise<string>>;
type RateLimitStore = Map<string, { count: number; windowStart: number }>;

const MAX_TEXTS_PER_REQUEST = 160;
const MAX_TEXT_LENGTH = 800;
const MAX_TOTAL_TEXT_LENGTH = 12000;
const MAX_BODY_BYTES = 32000;
const MAX_CACHE_SIZE = 20000;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const GOOGLE_REQUEST_PARALLELISM = 6;
const TRANSLATE_TIMEOUT_MS = 3500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 45;
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const LATIN_REGEX = /[A-Za-z]/;
const WHITESPACE_REGEX = /\s+/g;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{7,}\d)/;
const URL_REGEX = /\bhttps?:\/\/\S+/i;
const EXTERNAL_TRANSLATION_ENABLED = toBoolean(
  process.env.TRANSLATION_EXTERNAL_ENABLED,
  true,
);
const TRANSLATION_ALLOW_PII = toBoolean(
  process.env.TRANSLATION_ALLOW_PII,
  false,
);

export const runtime = 'nodejs';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function getCache(): TranslationCache {
  const globalRef = globalThis as typeof globalThis & {
    __translationCache?: TranslationCache;
  };

  if (!globalRef.__translationCache) {
    globalRef.__translationCache = new Map<string, TranslationCacheEntry>();
  }

  return globalRef.__translationCache;
}

function getInFlightStore(): InFlightTranslations {
  const globalRef = globalThis as typeof globalThis & {
    __translationInFlight?: InFlightTranslations;
  };

  if (!globalRef.__translationInFlight) {
    globalRef.__translationInFlight = new Map<string, Promise<string>>();
  }

  return globalRef.__translationInFlight;
}

function getRateLimitStore(): RateLimitStore {
  const globalRef = globalThis as typeof globalThis & {
    __translationRateLimit?: RateLimitStore;
  };

  if (!globalRef.__translationRateLimit) {
    globalRef.__translationRateLimit = new Map<string, { count: number; windowStart: number }>();
  }

  return globalRef.__translationRateLimit;
}

function normalizeText(value: string): string {
  return value.replace(WHITESPACE_REGEX, ' ').trim();
}

function containsPotentialSensitiveData(value: string): boolean {
  return (
    EMAIL_REGEX.test(value) || PHONE_REGEX.test(value) || URL_REGEX.test(value)
  );
}

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return 'anonymous';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const store = getRateLimitStore();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  store.set(key, entry);
  return false;
}

function getCachedValue(cache: TranslationCache, key: string): string | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }

  // Refresh insertion order for simple LRU behavior.
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function setCachedValue(cache: TranslationCache, key: string, value: string) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function translateWithGoogle(text: string, targetLocale: 'en' | 'uk'): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLocale}&dt=t&q=${encodeURIComponent(text)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      return text;
    }

    const translated = payload[0]
      .map((segment: unknown) => {
        if (!Array.isArray(segment)) return '';
        return typeof segment[0] === 'string' ? segment[0] : '';
      })
      .join('');

    return translated || text;
  } finally {
    clearTimeout(timeout);
  }
}

async function getTranslatedValue(
  text: string,
  targetLocale: 'en' | 'uk',
  cache: TranslationCache,
  inFlight: InFlightTranslations,
): Promise<string> {
  const cacheKey = `${targetLocale}:${text}`;
  const cached = getCachedValue(cache, cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const inFlightMatch = inFlight.get(cacheKey);
  if (inFlightMatch) {
    return inFlightMatch;
  }

  const translationPromise = (async () => {
    try {
      const translated = await translateWithGoogle(text, targetLocale);
      setCachedValue(cache, cacheKey, translated);
      return translated;
    } catch {
      return text;
    } finally {
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, translationPromise);
  return translationPromise;
}

async function translateTexts(
  texts: string[],
  targetLocale: 'en' | 'uk',
  cache: TranslationCache,
  inFlight: InFlightTranslations,
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {};

  let cursor = 0;
  const worker = async () => {
    while (true) {
      const current = cursor;
      cursor += 1;
      if (current >= texts.length) return;

      const text = texts[current];
      translations[text] = await getTranslatedValue(text, targetLocale, cache, inFlight);
    }
  };

  const workerCount = Math.min(GOOGLE_REQUEST_PARALLELISM, texts.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return translations;
}

export async function POST(request: NextRequest) {
  if (!EXTERNAL_TRANSLATION_ENABLED) {
    return NextResponse.json(
      {
        translations: {},
        error:
          'External translation is disabled by policy in this environment.',
      },
      { status: 503 },
    );
  }

  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { translations: {}, error: 'Too many translation requests. Please try again shortly.' },
      { status: 429 },
    );
  }

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ translations: {}, error: 'Payload too large' }, { status: 413 });
    }

    const body: unknown = rawBody ? JSON.parse(rawBody) : {};
    const parsedBody =
      typeof body === 'object' && body !== null
        ? (body as { texts?: unknown; targetLocale?: unknown })
        : {};
    const incomingTexts = Array.isArray(parsedBody.texts) ? parsedBody.texts : [];
    const targetLocale = parsedBody.targetLocale === 'uk' ? 'uk' : 'en';
    if (!Array.isArray(parsedBody.texts)) {
      return NextResponse.json({ translations: {}, error: 'Expected "texts" array' }, { status: 400 });
    }

    const seen = new Set<string>();
    const texts: string[] = [];
    let totalLength = 0;

    for (const value of incomingTexts) {
      if (typeof value !== 'string') continue;
      const normalized = normalizeText(value).slice(0, MAX_TEXT_LENGTH);
      if (!normalized) continue;
      if (targetLocale === 'en' && !CYRILLIC_REGEX.test(normalized)) continue;
      if (targetLocale === 'uk' && !LATIN_REGEX.test(normalized)) continue;
      if (
        !TRANSLATION_ALLOW_PII &&
        containsPotentialSensitiveData(normalized)
      ) {
        continue;
      }
      if (seen.has(normalized)) continue;
      if (totalLength + normalized.length > MAX_TOTAL_TEXT_LENGTH) break;
      seen.add(normalized);
      texts.push(normalized);
      totalLength += normalized.length;
      if (texts.length >= MAX_TEXTS_PER_REQUEST) break;
    }

    if (!texts.length) {
      return NextResponse.json({ translations: {} }, { status: 200 });
    }

    const cache = getCache();
    const inFlight = getInFlightStore();
    const translations = await translateTexts(texts, targetLocale, cache, inFlight);

    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ translations: {}, error: 'Translation failed' }, { status: 200 });
  }
}
