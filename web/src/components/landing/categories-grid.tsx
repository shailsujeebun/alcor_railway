'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useMarketplaces } from '@/lib/queries';
import { getMarketplaceDisplayName } from '@/lib/display-labels';
import { useTranslation } from '@/components/providers/translation-provider';

const MARKETPLACE_ORDER = ['agroline', 'autoline', 'machineryline'] as const;

function marketplaceIcon(key: string): string {
  if (key === 'autoline') return '🚛';
  if (key === 'machineryline') return '🏗';
  if (key === 'agroline') return '🚜';
  return '📦';
}

export function CategoriesGrid() {
  const { data: marketplaces = [] } = useMarketplaces();
  const { t, locale } = useTranslation();
  const marketplaceSubtitleLabel = (key: string) => {
    if (key === 'autoline') return t('landing.categorySubtitleAutoline');
    if (key === 'machineryline') return t('landing.categorySubtitleMachineryline');
    if (key === 'agroline') return t('landing.categorySubtitleAgroline');
    return t('landing.categorySubtitleDefault');
  };

  const ordered = MARKETPLACE_ORDER
    .map((key) => marketplaces.find((marketplace) => marketplace.key === key))
    .filter((marketplace): marketplace is NonNullable<typeof marketplace> =>
      Boolean(marketplace),
    );

  return (
    <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container-main">
        <div className="text-center mb-8 md:mb-12" data-aos="fade-up" suppressHydrationWarning>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-orange/10 text-orange border border-orange/20 mb-4" suppressHydrationWarning>
            {t('landing.categoriesBadge')}
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)]" suppressHydrationWarning>
            {t('landing.categoriesTitlePrefix')} <span className="gradient-text">{t('landing.categoriesTitleAccent')}</span>
          </h2>
          <p className="mt-3 text-[var(--text-secondary)]" suppressHydrationWarning>
            {t('landing.categoriesDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8" data-aos="fade-up" data-aos-delay="100">
          {ordered.map((marketplace) => (
            <Link
              key={marketplace.id}
              href={`/categories?marketplace=${marketplace.key}`}
              className="glass-card card-hover p-6 sm:p-7 text-center group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-blue-bright/10 flex items-center justify-center group-hover:bg-blue-bright/20 transition-colors">
                <span className="text-2xl sm:text-3xl">{marketplaceIcon(marketplace.key)}</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] leading-tight">
                {getMarketplaceDisplayName(marketplace.name, marketplace.key, locale)}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{marketplaceSubtitleLabel(marketplace.key)}</p>
              <p className="text-xs text-blue-bright mt-4">{t('landing.categoriesOpenAll')}</p>
            </Link>
          ))}
          {ordered.length === 0 && (
            <div className="col-span-full text-center py-8 text-[var(--text-secondary)]">
              {t('landing.categoriesEmpty')}
            </div>
          )}
        </div>

        <div className="text-center mt-8 md:mt-10" data-aos="fade-up">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-blue-bright hover:text-blue-light font-semibold transition-colors"
          >
            {t('landing.categoriesCta')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
