'use client';

import { Button } from '@/components/ui/button';
import { type Locale, type TranslationParams, translate } from '@/i18n';
import { Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: TranslationParams) => string;
}

type AttributeSnapshot = Partial<Record<'placeholder' | 'title' | 'aria-label' | 'value', string>>;

const TranslationContext = createContext<TranslationContextValue>({
  locale: 'uk',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key: string) => key,
});

const EXCLUDED_SELECTOR = '[data-no-translate],script,style,noscript,textarea,code,pre,svg';
const ATTRIBUTE_SELECTOR =
  '[placeholder],[title],[aria-label],input[type="button"][value],input[type="submit"][value]';
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const LATIN_REGEX = /[A-Za-z]/;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{7,}\d)/;
const URL_REGEX = /\bhttps?:\/\/\S+/i;
const BATCH_SIZE = 120;
const REQUEST_PARALLELISM = 6;
const OBSERVER_DEBOUNCE_MS = 120;
const LOCALE_STORAGE_KEY = 'alcor-locale';
const TRANSLATION_CACHE_KEY = 'alcor-translation-cache';
const TRANSLATION_PENDING_TIMEOUT_MS = 800;
const MAX_SESSION_CACHE_ENTRIES = 2000;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function splitWhitespace(value: string): { leading: string; core: string; trailing: string } {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return { leading: '', core: value, trailing: '' };
  return { leading: match[1], core: match[2], trailing: match[3] };
}

function containsPotentialSensitiveData(value: string): boolean {
  return EMAIL_REGEX.test(value) || PHONE_REGEX.test(value) || URL_REGEX.test(value);
}

function isTranslatable(value: string, locale: Locale): boolean {
  const text = normalizeText(value);
  if (text.length < 2) return false;
  if (containsPotentialSensitiveData(text)) return false;
  return locale === 'en' ? CYRILLIC_REGEX.test(text) : LATIN_REGEX.test(text);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function runWithConcurrency<T>(items: T[], maxConcurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const current = cursor++;
      await worker(items[current]);
    }
  }
  const workerCount = Math.min(maxConcurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, next));
}

function loadTranslationCache(): Map<string, string> {
  try {
    const raw = sessionStorage.getItem(TRANSLATION_CACHE_KEY);
    if (raw) {
      const entries = JSON.parse(raw);
      if (Array.isArray(entries)) return new Map(entries);
    }
  } catch { /* ignore */ }
  return new Map();
}

function saveTranslationCache(cache: Map<string, string>) {
  try {
    const entries = Array.from(cache.entries()).slice(-MAX_SESSION_CACHE_ENTRIES);
    sessionStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

function getStoredLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'uk';
  } catch {
    return 'uk';
  }
}

export function useTranslation() {
  return useContext(TranslationContext);
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Always start with 'uk' to match SSR. We sync from localStorage in useEffect below.
  const [locale, setLocaleState] = useState<Locale>('uk');
  const localeRef = useRef<Locale>('uk');
  const hasHydratedRef = useRef(false);
  const textOriginalsRef = useRef<Map<Text, string>>(new Map());
  const attrOriginalsRef = useRef<Map<HTMLElement, AttributeSnapshot>>(new Map());
  const translationCacheRef = useRef<Map<string, string>>(loadTranslationCache());
  const isApplyingRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const observerDebounceRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const cacheDirtyRef = useRef(false);

  // ── Hydration-safe: read stored locale AFTER first client render ──
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    const stored = getStoredLocale();
    if (stored !== 'uk') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'uk' ? 'en' : 'uk'));
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  // --- Translation pending visual state ---
  const setTranslationPendingState = useCallback((isPending: boolean) => {
    if (pendingTimeoutRef.current !== null) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    document.documentElement.classList.toggle('translation-pending', Boolean(isPending));

    if (isPending) {
      pendingTimeoutRef.current = window.setTimeout(() => {
        document.documentElement.classList.remove('translation-pending');
        pendingTimeoutRef.current = null;
      }, TRANSLATION_PENDING_TIMEOUT_MS);
    }
  }, []);

  // --- Direct Google Translate API (no server proxy) ---
  const translateText = useCallback(async (text: string, targetLocale: Locale): Promise<string> => {
    const cacheKey = `${targetLocale}:${text}`;
    if (translationCacheRef.current.has(cacheKey)) {
      return translationCacheRef.current.get(cacheKey)!;
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLocale}&dt=t&q=${encodeURIComponent(text)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(url, {
        cache: 'default',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        translationCacheRef.current.set(cacheKey, text);
        return text;
      }

      const payload = await response.json();
      const translated = Array.isArray(payload) && Array.isArray(payload[0])
        ? payload[0]
            .map((segment: unknown[]) => (Array.isArray(segment) && typeof segment[0] === 'string') ? segment[0] : '')
            .join('')
        : text;

      const safeTranslated = translated || text;
      translationCacheRef.current.set(cacheKey, safeTranslated);
      cacheDirtyRef.current = true;
      return safeTranslated;
    } catch {
      translationCacheRef.current.set(cacheKey, text);
      return text;
    }
  }, []);

  const requestTranslations = useCallback(
    async (texts: string[], targetLocale: Locale) => {
      const missing = texts.filter(
        (text) => !translationCacheRef.current.has(`${targetLocale}:${text}`),
      );
      if (!missing.length) return;

      const batches = chunk(missing, BATCH_SIZE);
      await Promise.all(batches.map(async (batch) => {
        await runWithConcurrency(batch, 10, async (sourceText) => {
          await translateText(sourceText, targetLocale);
        });
      }));
    },
    [translateText],
  );

  // --- DOM helpers ---
  const collectTextNodes = useCallback((root: ParentNode, targetLocale: Locale): Text[] => {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(EXCLUDED_SELECTOR)) return NodeFilter.FILTER_REJECT;

        const source = textOriginalsRef.current.get(node as Text) ?? (node.nodeValue ?? '');
        const { core } = splitWhitespace(source);
        if (!isTranslatable(core, targetLocale)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let current = walker.nextNode();
    while (current) {
      nodes.push(current as Text);
      current = walker.nextNode();
    }
    return nodes;
  }, []);

  const collectAttributeElements = useCallback((root: ParentNode): HTMLElement[] => {
    const base =
      root instanceof HTMLElement
        ? root
        : root instanceof Document
          ? root.documentElement
          : root.parentElement;
    if (!base) return [];

    const result = new Set<HTMLElement>();
    if (base.matches(ATTRIBUTE_SELECTOR)) result.add(base);

    const elements = base.querySelectorAll<HTMLElement>(ATTRIBUTE_SELECTOR);
    for (const element of elements) {
      if (!element.closest(EXCLUDED_SELECTOR)) {
        result.add(element);
      }
    }
    return Array.from(result);
  }, []);

  const cleanupSnapshots = useCallback(() => {
    for (const node of Array.from(textOriginalsRef.current.keys())) {
      if (!node.isConnected) textOriginalsRef.current.delete(node);
    }
    for (const element of Array.from(attrOriginalsRef.current.keys())) {
      if (!element.isConnected) attrOriginalsRef.current.delete(element);
    }
  }, []);

  // --- Core translation application ---
  const applyTranslationsToRoot = useCallback(
    async (root: ParentNode, targetLocale: Locale) => {
      if (!root || isApplyingRef.current || localeRef.current !== targetLocale) return;

      isApplyingRef.current = true;
      try {
        cleanupSnapshots();

        const textNodes = collectTextNodes(root, targetLocale);
        const attributeElements = collectAttributeElements(root);
        const pendingTexts = new Set<string>();

        for (const node of textNodes) {
          const original = textOriginalsRef.current.get(node) ?? (node.nodeValue ?? '');
          if (!textOriginalsRef.current.has(node)) {
            textOriginalsRef.current.set(node, original);
          }
          const { core } = splitWhitespace(original);
          if (isTranslatable(core, targetLocale)) {
            pendingTexts.add(normalizeText(core));
          }
        }

        for (const element of attributeElements) {
          if (element.closest(EXCLUDED_SELECTOR)) continue;

          const snapshot = attrOriginalsRef.current.get(element) ?? {};
          if (!attrOriginalsRef.current.has(element)) {
            const placeholder = element.getAttribute('placeholder');
            const title = element.getAttribute('title');
            const ariaLabel = element.getAttribute('aria-label');
            const value =
              element instanceof HTMLInputElement &&
              (element.type === 'button' || element.type === 'submit')
                ? element.value
                : null;

            if (placeholder) snapshot.placeholder = placeholder;
            if (title) snapshot.title = title;
            if (ariaLabel) snapshot['aria-label'] = ariaLabel;
            if (value) snapshot.value = value;
            attrOriginalsRef.current.set(element, snapshot);
          }

          const values = [snapshot.placeholder, snapshot.title, snapshot['aria-label'], snapshot.value];
          for (const val of values) {
            if (val && isTranslatable(val, targetLocale)) {
              pendingTexts.add(normalizeText(val));
            }
          }
        }

        await requestTranslations(Array.from(pendingTexts), targetLocale);

        if (localeRef.current !== targetLocale) return;

        for (const node of textNodes) {
          const original = textOriginalsRef.current.get(node);
          if (!original) continue;

          const { leading, core, trailing } = splitWhitespace(original);
          const normalizedCore = normalizeText(core);
          if (!isTranslatable(normalizedCore, targetLocale)) continue;

          const translated =
            translationCacheRef.current.get(`${targetLocale}:${normalizedCore}`) ??
            normalizedCore;
          node.nodeValue = `${leading}${translated}${trailing}`;
        }

        for (const element of attributeElements) {
          const snapshot = attrOriginalsRef.current.get(element);
          if (!snapshot || element.closest(EXCLUDED_SELECTOR)) continue;

          if (snapshot.placeholder) {
            const normalized = normalizeText(snapshot.placeholder);
            const translated =
              translationCacheRef.current.get(`${targetLocale}:${normalized}`) ??
              snapshot.placeholder;
            element.setAttribute('placeholder', translated);
          }
          if (snapshot.title) {
            const normalized = normalizeText(snapshot.title);
            const translated =
              translationCacheRef.current.get(`${targetLocale}:${normalized}`) ??
              snapshot.title;
            element.setAttribute('title', translated);
          }
          if (snapshot['aria-label']) {
            const normalized = normalizeText(snapshot['aria-label']);
            const translated =
              translationCacheRef.current.get(`${targetLocale}:${normalized}`) ??
              snapshot['aria-label'];
            element.setAttribute('aria-label', translated);
          }
          if (
            snapshot.value &&
            element instanceof HTMLInputElement &&
            (element.type === 'button' || element.type === 'submit')
          ) {
            const normalized = normalizeText(snapshot.value);
            const translated =
              translationCacheRef.current.get(`${targetLocale}:${normalized}`) ??
              snapshot.value;
            element.value = translated;
          }
        }
      } finally {
        isApplyingRef.current = false;
        if (localeRef.current === targetLocale) {
          setTranslationPendingState(false);
        }
        // Persist new translations to sessionStorage for next page navigation
        if (cacheDirtyRef.current) {
          cacheDirtyRef.current = false;
          saveTranslationCache(translationCacheRef.current);
        }
      }
    },
    [requestTranslations, cleanupSnapshots, collectTextNodes, collectAttributeElements, setTranslationPendingState],
  );

  const restoreOriginalLanguage = useCallback(() => {
    cleanupSnapshots();

    for (const [node, original] of textOriginalsRef.current) {
      if (node.isConnected) node.nodeValue = original;
    }

    for (const [element, snapshot] of attrOriginalsRef.current) {
      if (!element.isConnected) continue;

      if (snapshot.placeholder) element.setAttribute('placeholder', snapshot.placeholder);
      if (snapshot.title) element.setAttribute('title', snapshot.title);
      if (snapshot['aria-label']) element.setAttribute('aria-label', snapshot['aria-label']);
      if (
        snapshot.value &&
        element instanceof HTMLInputElement &&
        (element.type === 'button' || element.type === 'submit')
      ) {
        element.value = snapshot.value;
      }
    }

    setTranslationPendingState(false);
  }, [cleanupSnapshots, setTranslationPendingState]);

  const scheduleTranslationPasses = useCallback(() => {
    if (localeRef.current !== 'en') return;
    // Start translating immediately
    void applyTranslationsToRoot(document.body, 'en');
    // Single follow-up pass to catch late-rendered DOM nodes
    setTimeout(() => {
      if (localeRef.current === 'en') {
        void applyTranslationsToRoot(document.body, 'en');
      }
    }, 500);
  }, [applyTranslationsToRoot]);

  // --- Sync locale to ref, localStorage, and document ---
  useEffect(() => {
    localeRef.current = locale;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch { /* ignore */ }
    document.body.setAttribute('data-active-lang', locale);

    if (locale === 'uk') {
      restoreOriginalLanguage();
      // Clear the translation session cache when going back to Ukrainian
      try { sessionStorage.removeItem(TRANSLATION_CACHE_KEY); } catch { /* ignore */ }
      return;
    }

    setTranslationPendingState(true);
    scheduleTranslationPasses();
  }, [locale, restoreOriginalLanguage, setTranslationPendingState, scheduleTranslationPasses]);

  // --- Re-translate on pathname changes when in EN ---
  useEffect(() => {
    if (localeRef.current === 'en') {
      scheduleTranslationPasses();
    }
  }, [pathname, scheduleTranslationPasses]);

  // --- MutationObserver (set up once) ---
  useEffect(() => {
    if (observerRef.current) return;

    observerRef.current = new MutationObserver((mutations) => {
      if (localeRef.current !== 'en' || isApplyingRef.current) return;

      const hasStructuralChanges = mutations.some(
        (mutation) =>
          mutation.type === 'childList' &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0),
      );
      if (!hasStructuralChanges) return;

      if (observerDebounceRef.current !== null) {
        window.clearTimeout(observerDebounceRef.current);
      }

      observerDebounceRef.current = window.setTimeout(() => {
        observerDebounceRef.current = null;
        if (localeRef.current === 'en') {
          void applyTranslationsToRoot(document.body, 'en');
        }
      }, OBSERVER_DEBOUNCE_MS);
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (observerDebounceRef.current !== null) {
        window.clearTimeout(observerDebounceRef.current);
        observerDebounceRef.current = null;
      }
    };
  }, [applyTranslationsToRoot]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}

      <div data-no-translate className="fixed bottom-4 right-4 z-[80]">
        <Button
          type="button"
          variant="outline"
          className="border-[var(--border-color)] bg-[var(--bg-secondary)]/85 backdrop-blur text-[var(--text-primary)] shadow-md"
          onClick={toggleLocale}
          title={locale === 'uk' ? t('translation.toEnglish') : t('translation.toUkrainian')}
        >
          <Languages className="w-4 h-4 mr-2" />
          {locale === 'uk' ? 'EN' : 'UA'}
        </Button>
      </div>
    </TranslationContext.Provider>
  );
}
