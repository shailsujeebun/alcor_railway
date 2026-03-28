'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCompanies } from '@/lib/queries';
import { CompanyCard } from '@/components/cards/company-card';
import { CompanyCardSkeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/components/providers/translation-provider';

export function CompanyHighlights() {
  const { data, isLoading } = useCompanies({ page: '1', limit: '6' });
  const { t } = useTranslation();

  return (
    <section className="section-padding">
      <div className="container-main">
        <div className="text-center mb-8 md:mb-12" data-aos="fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-bright/10 text-blue-bright border border-blue-bright/20 mb-4">
            {t('landing.suppliersBadge')}
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)]">
            {t('landing.suppliersTitlePrefix')} <span className="gradient-text">{t('landing.suppliersTitleAccent')}</span>
          </h2>
          <p className="mt-3 text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">
            {t('landing.suppliersDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8" data-aos="fade-up" data-aos-delay="100">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CompanyCardSkeleton key={i} />)
            : data?.data.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
          {!isLoading && (!data?.data || data.data.length === 0) && (
            <div className="col-span-full text-center py-12 md:py-16">
              <p className="text-[var(--text-secondary)]">{t('landing.suppliersEmpty')}</p>
            </div>
          )}
        </div>

        <div className="text-center mt-8 md:mt-10" data-aos="fade-up">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-blue-bright hover:text-blue-light font-semibold transition-colors"
          >
            {t('landing.suppliersCta')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
