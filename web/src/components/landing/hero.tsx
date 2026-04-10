'use client';

import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Particles } from '@/components/ui/particles';
import { useTranslation } from '@/components/providers/translation-provider';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[80vh] md:min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, var(--hero-from), var(--hero-via), var(--hero-to))',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 70%), radial-gradient(ellipse at 70% 50%, rgba(249,115,22,0.1) 0%, transparent 70%)',
        }}
      />
      <Particles count={25} />

      {/* Content */}
      <div className="container-main relative z-10 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center" data-aos="fade-up">
          <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-bright/10 text-blue-bright border border-blue-bright/20 mb-6 md:mb-8">
            {t('landing.heroBadge')}
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight mb-4 md:mb-6">
            {t('landing.heroTitlePrefix')}{' '}
            <span className="gradient-text">{t('landing.heroTitleAccent')}</span>
            {' '}{t('landing.heroTitleSuffix')}
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            {t('landing.heroDescription')}
          </p>

          {/* Search bar */}
          <div className="glass-card p-1.5 sm:p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl mx-auto mb-8 md:mb-10" data-aos="fade-up" data-aos-delay="200">
            <div className="flex-1 flex items-center gap-2 px-3 sm:px-4">
              <Search size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
              <input
                type="text"
                placeholder={t('landing.heroSearchPlaceholder')}
                className="w-full py-2.5 sm:py-3 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
              />
            </div>
            <Link
              href="/listings"
              className="gradient-cta text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 flex-shrink-0"
            >
              {t('landing.heroSearchCta')}
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4" data-aos="fade-up" data-aos-delay="300">
            <Link
              href="/listings"
              className="gradient-cta text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {t('landing.heroBrowseListings')}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/companies"
              className="glass-card !rounded-full px-6 sm:px-8 py-3 sm:py-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-blue-bright/10 transition-colors text-center w-full sm:w-auto"
            >
              {t('landing.heroBrowseCompanies')}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
    </section>
  );
}
