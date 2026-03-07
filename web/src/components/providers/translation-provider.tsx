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

const EXCLUDED_SELECTOR = '[data-no-translate],script,style,noscript,textarea,code,pre';
const ATTRIBUTE_SELECTOR =
  '[placeholder],[title],[aria-label],input[type="button"][value],input[type="submit"][value]';
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const LATIN_REGEX = /[A-Za-z]/;
const BATCH_SIZE = 120;
const REQUEST_PARALLELISM = 3;
const FIRST_PASS_DELAY_MS = 60;
const SECOND_PASS_DELAY_MS = 900;
const OBSERVER_DEBOUNCE_MS = 180;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function splitWhitespace(value: string): { leading: string; core: string; trailing: string } {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return { leading: '', core: value, trailing: '' };
  return { leading: match[1], core: match[2], trailing: match[3] };
}

function isFallbackTranslatable(value: string, locale: Locale): boolean {
  const text = normalizeText(value);
  if (text.length < 2) return false;
  return locale === 'en' ? CYRILLIC_REGEX.test(text) : LATIN_REGEX.test(text);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function useTranslation() {
  return useContext(TranslationContext);
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>('uk');
  const localeRef = useRef<Locale>('uk');
  const textOriginalsRef = useRef<Map<Text, string>>(new Map());
  const attrOriginalsRef = useRef<Map<HTMLElement, AttributeSnapshot>>(new Map());
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  const isApplyingRef = useRef(false);
  const observerDebounceRef = useRef<number | null>(null);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === 'uk' ? 'en' : 'uk'));
  }, []);

  useEffect(() => {
    localeRef.current = locale;
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  const requestBatchTranslations = useCallback(
    async (batch: string[], targetLocale: Locale) => {
      if (localeRef.current !== targetLocale) return;

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: batch, targetLocale }),
        });

        if (!response.ok) {
          for (const text of batch) {
            translationCacheRef.current.set(`${targetLocale}:${text}`, text);
          }
          return;
        }

        const payload = await response.json();
        const translations: Record<string, string> = payload?.translations ?? {};
        for (const source of batch) {
          translationCacheRef.current.set(
            `${targetLocale}:${source}`,
            translations[source] ?? source,
          );
        }
      } catch {
        for (const text of batch) {
          translationCacheRef.current.set(`${targetLocale}:${text}`, text);
        }
      }
    },
    [],
  );

  const requestTranslations = useCallback(
    async (texts: string[], targetLocale: Locale) => {
      if (localeRef.current !== targetLocale) return;

      const missing = texts.filter(
        (text) => !translationCacheRef.current.has(`${targetLocale}:${text}`),
      );
      if (!missing.length) return;

      const batches = chunk(missing, BATCH_SIZE);
      for (let i = 0; i < batches.length; i += REQUEST_PARALLELISM) {
        if (localeRef.current !== targetLocale) return;
        const group = batches.slice(i, i + REQUEST_PARALLELISM);
        await Promise.all(
          group.map((batch) => requestBatchTranslations(batch, targetLocale)),
        );
      }
    },
    [requestBatchTranslations],
  );

  const collectTextNodes = (root: ParentNode, locale: Locale): Text[] => {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(EXCLUDED_SELECTOR)) return NodeFilter.FILTER_REJECT;

        const { core } = splitWhitespace(node.nodeValue ?? '');
        if (!isFallbackTranslatable(core, locale)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let current = walker.nextNode();
    while (current) {
      nodes.push(current as Text);
      current = walker.nextNode();
    }

    return nodes;
  };

  const collectAttributeElements = (root: ParentNode): HTMLElement[] => {
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
  };

  const cleanupSnapshots = () => {
    for (const node of Array.from(textOriginalsRef.current.keys())) {
      if (!node.isConnected) textOriginalsRef.current.delete(node);
    }
    for (const element of Array.from(attrOriginalsRef.current.keys())) {
      if (!element.isConnected) attrOriginalsRef.current.delete(element);
    }
  };

  const applyFallbackTranslationsToRoot = useCallback(
    async (root: ParentNode, targetLocale: Locale) => {
      if (!root || localeRef.current !== targetLocale || isApplyingRef.current) return;

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
          if (isFallbackTranslatable(core, targetLocale)) {
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
          for (const value of values) {
            if (value && isFallbackTranslatable(value, targetLocale)) {
              pendingTexts.add(normalizeText(value));
            }
          }
        }

        await requestTranslations(Array.from(pendingTexts), targetLocale);

        for (const node of textNodes) {
          const original = textOriginalsRef.current.get(node);
          if (!original) continue;

          const { leading, core, trailing } = splitWhitespace(original);
          const normalizedCore = normalizeText(core);
          if (!isFallbackTranslatable(normalizedCore, targetLocale)) continue;

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
      }
    },
    [requestTranslations],
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
  }, []);

  useEffect(() => {
    if (observerDebounceRef.current !== null) {
      window.clearTimeout(observerDebounceRef.current);
      observerDebounceRef.current = null;
    }
    restoreOriginalLanguage();

    const firstPass = window.setTimeout(() => {
      void applyFallbackTranslationsToRoot(document.body, locale);
    }, FIRST_PASS_DELAY_MS);

    const secondPass = window.setTimeout(() => {
      void applyFallbackTranslationsToRoot(document.body, locale);
    }, SECOND_PASS_DELAY_MS);

    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return;

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
        const targetLocale = localeRef.current;
        void applyFallbackTranslationsToRoot(document.body, targetLocale);
      }, OBSERVER_DEBOUNCE_MS);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.clearTimeout(firstPass);
      window.clearTimeout(secondPass);
      observer.disconnect();
      if (observerDebounceRef.current !== null) {
        window.clearTimeout(observerDebounceRef.current);
        observerDebounceRef.current = null;
      }
    };
  }, [locale, pathname, applyFallbackTranslationsToRoot, restoreOriginalLanguage]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, toggleLocale, t],
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
