import { useTranslation } from '@/components/providers/translation-provider';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Particles } from '@/components/ui/particles';

export function CTABanner() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 md:py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-accent via-blue-bright to-orange opacity-90" />
      <Particles count={15} />

      <div className="container-main relative z-10 text-center" data-aos="fade-up">
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-5xl text-white mb-4 md:mb-6">
          {t('landing.ctaTitle')}
        </h2>
        <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10">
          {t('landing.ctaDescription')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/listings"
            className="bg-white text-blue-accent px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {t('landing.ctaBrowseEquipment')}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/companies"
            className="border-2 border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm font-semibold hover:bg-white/10 transition-colors text-center w-full sm:w-auto"
          >
            {t('landing.ctaPlaceCompany')}
          </Link>
        </div>
      </div>
    </section>
  );
}
