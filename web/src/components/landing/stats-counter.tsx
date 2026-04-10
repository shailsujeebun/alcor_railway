'use client';

import { Package, Building2, Globe, Layers } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useTranslation } from '@/components/providers/translation-provider';

export function StatsCounter() {
  const { t } = useTranslation();
  const stats = [
    { icon: Package, label: t('landing.statsListings'), value: 2500, suffix: '+' },
    { icon: Building2, label: t('landing.statsCompanies'), value: 850, suffix: '+' },
    { icon: Globe, label: t('landing.statsCountries'), value: 40, suffix: '+' },
    { icon: Layers, label: t('landing.statsCategories'), value: 120, suffix: '+' },
  ];

  return (
    <section className="section-padding relative -mt-10 md:-mt-16 z-10">
      <div className="container-main">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6" data-aos="fade-up">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 sm:p-6 md:p-8 text-center card-hover">
              <stat.icon className="mx-auto mb-2 sm:mb-4 text-blue-bright w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              <div className="font-heading font-extrabold text-xl sm:text-2xl md:text-4xl gradient-text mb-1 sm:mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
