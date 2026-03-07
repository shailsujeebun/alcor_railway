'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Building2, MapPin } from 'lucide-react';
import { useViewHistory } from '@/lib/queries';
import type { ViewHistoryItem } from '@/types/api';
import { getCategoryDisplayName } from '@/lib/display-labels';

export function ViewHistoryList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useViewHistory(page);

  const items = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-6">
        Історія переглядів
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-5 bg-[var(--border-color)] rounded w-1/3 mb-2" />
              <div className="h-4 bg-[var(--border-color)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={48} className="mx-auto text-[var(--text-secondary)] mb-4 opacity-30" />
          <p className="text-[var(--text-secondary)] mb-4">
            Ви ще не переглядали жодного оголошення
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-white font-medium hover:opacity-90 transition-opacity"
          >
            Переглянути оголошення
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: ViewHistoryItem) => (
            <Link
              key={item.id}
              href={`/listings/${item.listing.id}`}
              className="glass-card p-4 flex items-center gap-4 hover:border-blue-bright/30 transition-colors block"
            >
              <div className="flex-shrink-0">
                {item.listing.media?.[0]?.url ? (
                  <img
                    src={item.listing.media[0].url}
                    alt={item.listing.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-accent/20 to-orange/10 flex items-center justify-center">
                    <Building2 size={24} className="text-blue-bright/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--text-primary)] truncate">
                  {item.listing.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mt-1">
                  {item.listing.category && <span>{getCategoryDisplayName(item.listing.category.name)}</span>}
                  {item.listing.priceAmount && (
                    <span>{item.listing.priceAmount.toLocaleString()} {item.listing.priceCurrency}</span>
                  )}
                  {(item.listing.city || item.listing.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {[item.listing.city?.name, item.listing.country?.name].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Переглянуто: {new Date(item.viewedAt).toLocaleDateString('uk')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? 'gradient-cta text-white'
                  : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
