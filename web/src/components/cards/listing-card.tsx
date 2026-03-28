'use client';

import Link from 'next/link';
import { MapPin, Building2, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/ui/price-display';
import type { Listing } from '@/types/api';
import { getCategoryDisplayName } from '@/lib/display-labels';
import { useTranslation } from '@/components/providers/translation-provider';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const thumbnail = listing.media?.[0]?.url;
  const { t } = useTranslation();

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <div className="glass-card card-hover overflow-hidden group">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-accent/20 to-orange/10 flex items-center justify-center">
              <Building2 size={40} className="text-blue-bright/30" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {listing.condition && (
              <Badge variant={listing.condition === 'NEW' ? 'success' : 'warning'}>
                {t(`listingCard.condition.${listing.condition}`) ?? listing.condition}
              </Badge>
            )}
            {listing.listingType && (
              <Badge variant="default">
                {t(`listingCard.listingType.${listing.listingType}`) ?? listing.listingType}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading font-bold text-base text-[var(--text-primary)] line-clamp-2 mb-2">
            {listing.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {listing.brand && <Badge variant="outline">{listing.brand.name}</Badge>}
            {listing.category && <Badge>{getCategoryDisplayName(listing.category.name)}</Badge>}
          </div>

          <div className="mb-3">
            <PriceDisplay
              amount={listing.priceAmount}
              currency={listing.priceCurrency}
              priceType={listing.priceType}
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            {(listing.country || listing.city) && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {[listing.city?.name, listing.country?.name].filter(Boolean).join(', ')}
              </span>
            )}
            {listing.year && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {listing.year}
              </span>
            )}
            {listing.hoursValue != null && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {listing.hoursValue} {listing.hoursUnit ?? 'м/г'}
              </span>
            )}
          </div>

          {listing.company && (
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Building2 size={12} />
                {listing.company.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
