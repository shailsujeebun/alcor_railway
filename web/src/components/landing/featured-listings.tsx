'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useListings } from '@/lib/queries';
import { ListingCard } from '@/components/cards/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import type { Listing } from '@/types/api';

export function FeaturedListings() {
  const { data, isLoading } = useListings({ page: '1', limit: '6' });

  return (
    <section className="section-padding">
      <div className="container-main">
        <div className="text-center mb-8 md:mb-12" data-aos="fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-bright/10 text-blue-bright border border-blue-bright/20 mb-4">
            Рекомендовані
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)]">
            Найновіші <span className="gradient-text">оголошення</span>
          </h2>
          <p className="mt-3 text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">
            Ознайомтеся з найновішим обладнанням від перевірених постачальників з усього світу.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8" data-aos="fade-up" data-aos-delay="100">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : data?.data.map((listing: Listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
          {!isLoading && (!data?.data || data.data.length === 0) && (
            <div className="col-span-full text-center py-12 md:py-16">
              <p className="text-[var(--text-secondary)]">Оголошень ще немає. Перевірте пізніше!</p>
            </div>
          )}
        </div>

        <div className="text-center mt-8 md:mt-10" data-aos="fade-up">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-blue-bright hover:text-blue-light font-semibold transition-colors"
          >
            Усі оголошення
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
