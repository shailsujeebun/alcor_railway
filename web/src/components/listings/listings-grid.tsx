'use client';

import { ListingCard } from '@/components/cards/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Package } from 'lucide-react';
import type { PaginatedResponse, Listing } from '@/types/api';
import { useTranslation } from '@/components/providers/translation-provider';

interface ListingsGridProps {
  data?: PaginatedResponse<Listing>;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function ListingsGrid({ data, isLoading, page, onPageChange }: ListingsGridProps) {
  const { t } = useTranslation();
  return (
    <div>
      {/* Results count */}
      {data && (
        <div className="mb-6 text-sm text-[var(--text-secondary)]">
          {t('listings.resultsCount', { shown: data.data.length, total: data.meta.total })}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : data?.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
      </div>

      {/* Empty state */}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-blue-bright/20 mb-4" />
          <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] mb-2">Оголошень не знайдено</h3>
          <p className="text-sm text-[var(--text-secondary)]">Спробуйте змінити фільтри або пошуковий запит.</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
