'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layers, ChevronRight } from 'lucide-react';
import { useCategories, useMarketplaces } from '@/lib/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import {
  dedupeCategoriesByDisplayName,
  getCategoryDisplayName,
  getMarketplaceDisplayName,
  shouldHideCategory,
} from '@/lib/display-labels';
import { useTranslation } from '@/components/providers/translation-provider';

const MARKETPLACE_ORDER = ['agroline', 'autoline', 'machineryline'] as const;
const CATEGORY_PREVIEW_LIMIT = 12;

function iconForCategory(name: string): string {
  const value = name.toLowerCase();

  // Specific mappings first
  if (value.includes('легкові авто') || value.includes('авто') || value === 'cars' || value.includes('car')) return '🚗';

  if (value.includes('airport')) return '🛫';
  if (value.includes('air transport')) return '✈';
  if (value.includes('water transport')) return '🚢';
  if (value.includes('railway')) return '🚆';
  if (value.includes('municipal')) return '🚧';
  if (value.includes('container')) return '📦';
  if (value.includes('service')) return '🛎';
  if (value.includes('spare')) return '🔩';
  if (value.includes('tire') || value.includes('wheel')) return '🛞';
  if (value.includes('camp')) return '🏕';
  if (value.includes('bus')) return '🚌';
  if (value.includes('motorcycle')) return '🏍';
  if (value.includes('tractor')) return '🚜';
  if (value.includes('truck')) return '🚛';
  if (value.includes('trailer')) return '🚚';
  if (value.includes('tank')) return '🛢';
  if (value.includes('van')) return '🚐';
  if (value.includes('commercial')) return '💼';
  if (value.includes('excavator')) return '🏗';
  if (value.includes('loader') || value.includes('handling')) return '🏋';
  if (value.includes('combine') || value.includes('harvester')) return '🌾';
  if (value.includes('header')) return '🌽';
  if (value.includes('irrigation')) return '💧';
  if (value.includes('fertilizer')) return '🧪';
  if (value.includes('livestock') || value.includes('animal')) return '🐄';
  if (value.includes('forestry')) return '🌲';
  if (value.includes('garden')) return '🌿';
  if (value.includes('vineyard')) return '🍇';
  if (value.includes('potato')) return '🥔';
  if (value.includes('crop')) return '🌱';
  if (value.includes('mining')) return '⛏';
  if (value.includes('industrial')) return '🏭';
  if (value.includes('tool')) return '🧰';
  if (value.includes('raw material')) return '🧱';
  if (value.includes('real estate')) return '🏢';
  if (value.includes('energy')) return '⚡';
  if (value.includes('equipment')) return '🧩';
  return '🔹';
}

export function CategoriesPageContent() {
  const searchParams = useSearchParams();
  const { data: marketplaces, isLoading: loadingMarketplaces } = useMarketplaces();
  const [activeMarketplaceId, setActiveMarketplaceId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { locale } = useTranslation();
  const marketplaceQueryKey = searchParams.get('marketplace')?.trim().toLowerCase() ?? '';

  const orderedMarketplaces = useMemo(() => {
    if (!marketplaces) return [];
    const byKey = new Map(marketplaces.map((marketplace) => [marketplace.key, marketplace]));
    return MARKETPLACE_ORDER
      .map((key) => byKey.get(key))
      .filter((marketplace): marketplace is NonNullable<typeof marketplace> =>
        Boolean(marketplace),
      );
  }, [marketplaces]);

  useEffect(() => {
    if (activeMarketplaceId || orderedMarketplaces.length === 0) return;
    const fromQuery = marketplaceQueryKey
      ? orderedMarketplaces.find((marketplace) => marketplace.key === marketplaceQueryKey)
      : undefined;
    const autoline = orderedMarketplaces.find((marketplace) => marketplace.key === 'autoline');
    setActiveMarketplaceId(fromQuery?.id ?? autoline?.id ?? orderedMarketplaces[0].id);
  }, [orderedMarketplaces, activeMarketplaceId, marketplaceQueryKey]);

  const effectiveMarketplaceId = activeMarketplaceId || orderedMarketplaces[0]?.id || '';
  const { data: categories, isLoading: loadingCategories } = useCategories(
    effectiveMarketplaceId || undefined,
  );
  const topLevel = useMemo(
    () => categories?.filter((category) => !category.parentId) ?? [],
    [categories],
  );

  const filteredTopLevel = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visibleTopLevel = dedupeCategoriesByDisplayName(
      topLevel.filter((category) => !shouldHideCategory(category.name)),
    );
    if (!query) return visibleTopLevel;
    return visibleTopLevel.filter((category) => {
      const displayName = getCategoryDisplayName(category.name, locale).toLowerCase();
      return category.name.toLowerCase().includes(query) || displayName.includes(query);
    });
  }, [topLevel, search, locale]);

  const visibleTopLevel = useMemo(() => {
    if (showAll || search.trim()) return filteredTopLevel;
    return filteredTopLevel.slice(0, CATEGORY_PREVIEW_LIMIT);
  }, [filteredTopLevel, showAll, search]);

  const hasHiddenItems =
    !showAll &&
    !search.trim() &&
    filteredTopLevel.length > CATEGORY_PREVIEW_LIMIT;

  const isLoading = loadingMarketplaces || loadingCategories;

  if (isLoading && !categories) {
    return (
      <div className="container-main pt-10 pb-24 md:pb-28">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-main pt-10 pb-24 md:pb-28">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-[var(--text-primary)]">
          Перегляд <span className="gradient-text">категорій</span>
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">Знайдіть обладнання, організоване за категоріями.</p>
      </div>

      {/* Marketplace Tabs */}
      {orderedMarketplaces.length > 0 && (
        <div className="flex gap-2 mb-8 border-b border-[var(--border-color)] overflow-x-auto">
          {orderedMarketplaces.map((mp) => (
            <button
              key={mp.id}
              onClick={() => {
                setActiveMarketplaceId(mp.id);
                setSearch('');
                setShowAll(false);
              }}
              className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${effectiveMarketplaceId === mp.id
                ? 'text-blue-bright'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              {getMarketplaceDisplayName(mp.name, mp.key, locale)}
              {effectiveMarketplaceId === mp.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-bright rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Пошук категорії..."
          className="w-full md:w-[420px] px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
        />
      </div>

      {filteredTopLevel.length === 0 ? (
        <div className="text-center py-20">
          <Layers size={48} className="mx-auto text-blue-bright/20 mb-4" />
          <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] mb-2">Категорій не знайдено</h3>
          <p className="text-sm text-[var(--text-secondary)]">Спробуйте інший маркетплейс або змініть пошуковий запит.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTopLevel.map((cat) => (
            <div key={cat.id} className="glass-card card-hover p-6" data-aos="fade-up">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-bright/10 flex items-center justify-center">
                  <span className="text-xl">{iconForCategory(getCategoryDisplayName(cat.name))}</span>
                </div>
                <Link
                  href={`/listings?marketplaceId=${effectiveMarketplaceId ?? ''}&categoryId=${cat.id}`}
                  className="font-heading font-bold text-lg text-[var(--text-primary)] hover:text-blue-bright transition-colors"
                >
                  {getCategoryDisplayName(cat.name, locale)}
                </Link>
              </div>

              {cat.children && cat.children.length > 0 && (
                <div className="space-y-2 ml-16">
                  {cat.children
                    .filter((child) => !shouldHideCategory(child.name))
                    .filter((child, index, arr) => {
                      const key = getCategoryDisplayName(child.name).trim().toLowerCase();
                      return arr.findIndex((entry) => getCategoryDisplayName(entry.name).trim().toLowerCase() === key) === index;
                    })
                    .map((child) => (
                    <Link
                      key={child.id}
                      href={`/listings?marketplaceId=${effectiveMarketplaceId ?? ''}&categoryId=${child.id}`}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-blue-bright transition-colors py-1"
                    >
                      <ChevronRight size={14} />
                      {getCategoryDisplayName(child.name, locale)}
                    </Link>
                  ))}
                </div>
              )}

              {(!cat.children || cat.children.length === 0) && (
                <Link
                  href={`/listings?marketplaceId=${effectiveMarketplaceId ?? ''}&categoryId=${cat.id}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-bright hover:text-blue-light transition-colors ml-16"
                >
                  Переглянути оголошення
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {hasHiddenItems && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm text-blue-bright hover:text-blue-light"
          >
            Show all {filteredTopLevel.length} categories
          </button>
        </div>
      )}

      {showAll && !search.trim() && filteredTopLevel.length > CATEGORY_PREVIEW_LIMIT && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Show fewer
          </button>
        </div>
      )}
    </div>
  );
}
