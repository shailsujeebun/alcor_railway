'use client';

import { startTransition, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCompanies } from '@/lib/queries';
import { useTranslation } from '@/components/providers/translation-provider';
import { CompaniesFilters } from './companies-filters';
import { CompaniesGrid } from './companies-grid';

interface FiltersState {
  search: string;
  countryId: string;
  cityId: string;
  isVerified: string;
  activityTypeId: string;
  brandId: string;
  isOfficialDealer: string;
}

const emptyFilters: FiltersState = {
  search: '',
  countryId: '',
  cityId: '',
  isVerified: '',
  activityTypeId: '',
  brandId: '',
  isOfficialDealer: '',
};

export function CompaniesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<FiltersState>(() => {
    const init = { ...emptyFilters };
    for (const key of Object.keys(init) as (keyof FiltersState)[]) {
      init[key] = searchParams.get(key) ?? '';
    }
    return init;
  });

  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));

  const queryParams: Record<string, string> = { page: String(page), limit: '12' };
  Object.entries(filters).forEach(([k, v]) => { if (v) queryParams[k] = v; });

  const { data, isLoading } = useCompanies(queryParams);

  const updateFilter = useCallback((key: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    startTransition(() => {
      router.replace(`/companies?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const clearFilters = useCallback(() => {
    setFilters({ ...emptyFilters });
    setPage(1);
    startTransition(() => {
      router.replace('/companies', { scroll: false });
    });
  }, [router]);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    startTransition(() => {
      router.replace(`/companies?${params.toString()}`, { scroll: false });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, router]);

  return (
    <div className="container-main pt-10 pb-24 md:pb-28">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-[var(--text-primary)]">
          {t('companies.catalogTitlePrefix')} <span className="gradient-text">{t('companies.catalogTitleAccent')}</span>
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">{t('companies.catalogDescription')}</p>
      </div>

      <button
        onClick={() => setMobileFiltersOpen(true)}
        className="lg:hidden mb-6 glass-card px-4 py-2.5 text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]"
      >
        <SlidersHorizontal size={16} />
        {t('companies.filtersButton')}
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-[280px] flex-shrink-0 self-start pb-12 md:pb-16">
          <div className="scrollbar-hidden sticky top-20 max-h-[calc(100vh-9rem)] overflow-y-auto pr-3">
            <CompaniesFilters filters={filters} onFilterChange={updateFilter} onClear={clearFilters} />
          </div>
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-[360px] bg-[var(--bg-primary)] p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg">{t('companies.filtersTitle')}</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 text-[var(--text-secondary)]">
                  <X size={20} />
                </button>
              </div>
              <CompaniesFilters filters={filters} onFilterChange={updateFilter} onClear={clearFilters} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <CompaniesGrid data={data} isLoading={isLoading} page={page} onPageChange={handlePageChange} />
        </main>
      </div>
    </div>
  );
}
