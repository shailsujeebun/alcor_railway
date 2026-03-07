'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import { useCategories, useMarketplaces } from '@/lib/queries';
import type { Category } from '@/types/api';
import { getCategoryDisplayName, getMarketplaceDisplayName } from '@/lib/display-labels';

// Helper to get marketplace icon by key
function getMarketplaceIcon(key: string): string {
    const k = key.toLowerCase();
    if (k.includes('agro') || k.includes('farm')) return '🚜';
    if (k.includes('auto') || k.includes('car')) return '🚗';
    if (k.includes('truck') || k.includes('transport')) return '🚛';
    if (k.includes('machinery') || k.includes('industry')) return '⚙️';
    if (k.includes('construct')) return '🏗️';
    return '📦';
}

// Helper function to get category icon based on name
function getCategoryIcon(name: string): string {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('трактор') || nameLower.includes('tractor')) return '🚜';
    if (nameLower.includes('вантаж') || nameLower.includes('truck')) return '🚛';
    if (nameLower.includes('автобус') || nameLower.includes('bus')) return '🚌';
    if (nameLower.includes('причіп') || nameLower.includes('trailer')) return '🚚';
    if (nameLower.includes('легкові авто') || nameLower.includes('авто') || nameLower === 'cars' || nameLower.includes('car')) return '🚗';
    if (nameLower.includes('мото') || nameLower.includes('motorcycle')) return '🏍️';
    if (nameLower.includes('екскаватор') || nameLower.includes('excavator')) return '🏗️';
    if (nameLower.includes('навантажувач') || nameLower.includes('loader')) return '⚙️';
    if (nameLower.includes('комбайн') || nameLower.includes('harvester')) return '🌾';
    if (nameLower.includes('запчастин') || nameLower.includes('parts')) return '🔧';
    if (nameLower.includes('бурова') || nameLower.includes('drill')) return '🔩';
    if (nameLower.includes('кран') || nameLower.includes('crane')) return '🏗️';
    if (nameLower.includes('генератор') || nameLower.includes('generator')) return '⚡';
    if (nameLower.includes('насос') || nameLower.includes('pump')) return '🔧';

    return '📦';
}

export default function SelectCategoryPage() {
    const router = useRouter();
    const [activeMarketplaceId, setActiveMarketplaceId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const { data: marketplaces, isLoading: loadingMarketplaces } = useMarketplaces();
    const fallbackMarketplaceId = useMemo(
        () => marketplaces?.[0]?.id ?? null,
        [marketplaces],
    );
    const effectiveMarketplaceId = activeMarketplaceId ?? fallbackMarketplaceId;
    const { data: categories, isLoading: loadingCategories } = useCategories(effectiveMarketplaceId ?? undefined);

    const activeMarketplace = marketplaces?.find((m) => m.id === effectiveMarketplaceId);

    // Get top-level categories
    const topLevelCategories = categories?.filter((c) => !c.parentId) ?? [];

    // Filter by search query (search in all levels)
    const matchesSearch = (cat: Category): boolean => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (
          cat.name.toLowerCase().includes(q) ||
          getCategoryDisplayName(cat.name).toLowerCase().includes(q)
        ) return true;
        if (cat.children?.some((child) =>
          child.name.toLowerCase().includes(q) ||
          getCategoryDisplayName(child.name).toLowerCase().includes(q)
        )) return true;
        return false;
    };

    const filteredCategories = topLevelCategories.filter(matchesSearch);

    // Check if a category is a leaf (has no children)
    const isLeaf = (cat: Category) => !cat.children || cat.children.length === 0;

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) next.delete(categoryId);
            else next.add(categoryId);
            return next;
        });
    };

    const handleCategorySelect = (categoryId: string) => {
        router.push(`/ad-placement/details?categoryId=${categoryId}&marketplaceId=${effectiveMarketplaceId ?? ''}`);
    };

    const isLoading = loadingMarketplaces || loadingCategories;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Breadcrumb */}
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div className="container-main py-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Link href="/" className="hover:text-[var(--text-primary)]">Головна</Link>
                        <span>/</span>
                        <Link href="/ad-placement" className="hover:text-[var(--text-primary)]">Розміщення оголошення</Link>
                        <span>/</span>
                        <span className="text-[var(--text-primary)]">
                            {activeMarketplace
                              ? getMarketplaceDisplayName(activeMarketplace.name, activeMarketplace.key)
                              : 'Оберіть розділ'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="container-main py-8">
                {/* Step Indicator */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-bright text-white flex items-center justify-center font-bold">
                            1
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
                            Оберіть розділ
                        </h1>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
                        <input
                            type="text"
                            placeholder="Пошук категорії..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Marketplace Tabs */}
                <div className="flex gap-2 mb-8 border-b border-[var(--border-color)] overflow-x-auto">
                    {loadingMarketplaces ? (
                        <div className="flex gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="px-6 py-3 h-12 bg-[var(--border-color)] rounded-t-lg animate-pulse w-32" />
                            ))}
                        </div>
                    ) : (
                        marketplaces?.map((mp) => (
                            <button
                                key={mp.id}
                                onClick={() => setActiveMarketplaceId(mp.id)}
                                className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${effectiveMarketplaceId === mp.id
                                    ? 'text-blue-bright'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>{getMarketplaceIcon(mp.key)}</span>
                                    {getMarketplaceDisplayName(mp.name, mp.key)}
                                </span>
                                {effectiveMarketplaceId === mp.id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-bright" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Categories — Hierarchical */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-card p-6 animate-pulse">
                                <div className="h-6 bg-[var(--border-color)] rounded w-3/4 mb-4" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-[var(--border-color)] rounded w-1/2" />
                                    <div className="h-4 bg-[var(--border-color)] rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="glass-card p-5 hover:border-blue-bright/30 transition-all">
                                {isLeaf(category) ? (
                                    /* Leaf category (no children) — directly clickable */
                                    <button
                                        onClick={() => handleCategorySelect(category.id)}
                                        className="w-full flex items-center gap-3 text-left group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-bright/10 flex items-center justify-center text-2xl flex-shrink-0">
                                            {getCategoryIcon(getCategoryDisplayName(category.name))}
                                        </div>
                                        <div>
                                            <p className="font-heading font-bold text-[var(--text-primary)] group-hover:text-blue-bright transition-colors">
                                                {getCategoryDisplayName(category.name)}
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)]">Розмістити оголошення →</p>
                                        </div>
                                    </button>
                                ) : (
                                    /* Parent category with subcategories */
                                    <>
                                        <button
                                            onClick={() => toggleExpand(category.id)}
                                            className="w-full flex items-center gap-3 text-left group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-blue-bright/10 flex items-center justify-center text-2xl flex-shrink-0">
                                                {getCategoryIcon(getCategoryDisplayName(category.name))}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-heading font-bold text-[var(--text-primary)] group-hover:text-blue-bright transition-colors">
                                                    {getCategoryDisplayName(category.name)}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {category.children?.length} підкатегорій
                                                </p>
                                            </div>
                                            {expandedCategories.has(category.id) ? (
                                                <ChevronDown size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
                                            ) : (
                                                <ChevronRight size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
                                            )}
                                        </button>

                                        {/* Subcategories (expanded) */}
                                        {expandedCategories.has(category.id) && (
                                            <div className="mt-3 ml-15 space-y-1 border-t border-[var(--border-color)] pt-3">
                                                {category.children
                                                    ?.filter((child) => {
                                                      if (!searchQuery) return true;
                                                      const query = searchQuery.toLowerCase();
                                                      return (
                                                        child.name.toLowerCase().includes(query) ||
                                                        getCategoryDisplayName(child.name).toLowerCase().includes(query)
                                                      );
                                                    })
                                                    .map((child) => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => handleCategorySelect(child.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-blue-bright hover:bg-blue-bright/5 transition-colors text-left"
                                                        >
                                                            <ChevronRight size={14} className="flex-shrink-0" />
                                                            {getCategoryDisplayName(child.name)}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {filteredCategories.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <p className="text-[var(--text-secondary)]">
                            Категорій не знайдено. Спробуйте інший пошуковий запит.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
