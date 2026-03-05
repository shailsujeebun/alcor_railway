'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Building2, MapPin } from 'lucide-react';
import { useFavorites, useRemoveFavorite } from '@/lib/queries';
import type { Favorite } from '@/types/api';
import { getCategoryDisplayName } from '@/lib/display-labels';

export function FavoritesList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFavorites(page);
  const removeMutation = useRemoveFavorite();

  const favorites = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-6">
        Обране
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
      ) : favorites.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Heart size={48} className="mx-auto text-[var(--text-secondary)] mb-4 opacity-30" />
          <p className="text-[var(--text-secondary)] mb-4">
            У вас поки немає обраних оголошень
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
          {favorites.map((fav: Favorite) => (
            <div key={fav.id} className="glass-card p-4 flex items-center gap-4">
              <Link href={`/listings/${fav.listing.id}`} className="flex-shrink-0">
                {fav.listing.media?.[0]?.url ? (
                  <img
                    src={fav.listing.media[0].url}
                    alt={fav.listing.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-accent/20 to-orange/10 flex items-center justify-center">
                    <Building2 size={24} className="text-blue-bright/30" />
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/listings/${fav.listing.id}`}>
                  <h3 className="font-medium text-[var(--text-primary)] truncate hover:text-blue-bright transition-colors">
                    {fav.listing.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mt-1">
                  {fav.listing.category && <span>{getCategoryDisplayName(fav.listing.category.name)}</span>}
                  {fav.listing.priceAmount && (
                    <span>{fav.listing.priceAmount.toLocaleString()} {fav.listing.priceCurrency}</span>
                  )}
                  {(fav.listing.city || fav.listing.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {[fav.listing.city?.name, fav.listing.country?.name].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Додано: {new Date(fav.createdAt).toLocaleDateString('uk')}
                </p>
              </div>
              <button
                onClick={() => removeMutation.mutate(fav.listingId)}
                disabled={removeMutation.isPending}
                className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex-shrink-0"
                title="Видалити з обраного"
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
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
