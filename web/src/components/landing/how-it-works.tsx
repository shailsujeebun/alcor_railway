'use client';

import { useTranslation } from '@/components/providers/translation-provider';
import { Search, GitCompare, MessageCircle, Handshake } from 'lucide-react';

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    {
      icon: Search,
      title: t('landing.steps.searchTitle'),
      description: t('landing.steps.searchDescription'),
    },
    {
      icon: GitCompare,
      title: t('landing.steps.compareTitle'),
      description: t('landing.steps.compareDescription'),
    },
    {
      icon: MessageCircle,
      title: t('landing.steps.contactTitle'),
      description: t('landing.steps.contactDescription'),
    },
    {
      icon: Handshake,
      title: t('landing.steps.dealTitle'),
      description: t('landing.steps.dealDescription'),
    },
  ];

  return (
    <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container-main">
        <div className="text-center mb-10 md:mb-16" data-aos="fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-orange/10 text-orange border border-orange/20 mb-4">
            {t('landing.processBadge')}
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)]">
            {t('landing.processTitlePrefix')} <span className="gradient-text">{t('landing.processTitleAccent')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative text-center"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-bright/30 to-transparent" />
              )}

              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4 md:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-accent to-blue-bright flex items-center justify-center relative">
                <step.icon className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full gradient-cta text-white text-[10px] sm:text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>

              <h3 className="font-heading font-bold text-sm sm:text-base md:text-lg text-[var(--text-primary)] mb-1 sm:mb-2">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
