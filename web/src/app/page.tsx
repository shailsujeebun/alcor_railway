'use client';

import { Hero } from '@/components/landing/hero';
import { StatsCounter } from '@/components/landing/stats-counter';
import { FeaturedListings } from '@/components/landing/featured-listings';
import { CategoriesGrid } from '@/components/landing/categories-grid';
import { CompanyHighlights } from '@/components/landing/company-highlights';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CTABanner } from '@/components/landing/cta-banner';
import { ContactSection } from '@/components/landing/contact-section';

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsCounter />
      <FeaturedListings />
      <CategoriesGrid />
      <CompanyHighlights />
      <HowItWorks />
      <CTABanner />
      <ContactSection />
    </>
  );
}
