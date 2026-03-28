'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, ChevronLeft, ShieldCheck, Package, Star, Building2, Clock, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { useCompanyDetail, useCompanyListings, useCompanyReviews } from '@/lib/queries';
import { ListingCard } from '@/components/cards/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewList } from './review-list';
import { ReviewForm } from './review-form';
import { Modal } from '@/components/ui/modal';
import { useTranslation } from '@/components/providers/translation-provider';
import type { CompanyMedia, Listing } from '@/types/api';

type Tab = 'listings' | 'reviews' | 'gallery';

export function CompanyDetail({ slug }: { slug: string }) {
  const { data: company, isLoading, error } = useCompanyDetail(slug);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [listingsPage, setListingsPage] = useState(1);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data: listingsData, isLoading: listingsLoading } = useCompanyListings(
    company?.id ?? '',
    { page: String(listingsPage), limit: '9' },
  );

  const { data: reviewsData, isLoading: reviewsLoading } = useCompanyReviews(
    company?.id ?? '',
    1,
  );

  if (isLoading) {
    return (
      <div className="container-main py-10 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container-main py-20 text-center">
        <Building2 size={48} className="mx-auto text-blue-bright/20 mb-4" />
        <h2 className="font-heading font-bold text-xl text-[var(--text-primary)]">{t('companies.notFoundTitle')}</h2>
        <Link href="/companies" className="text-blue-bright mt-4 inline-block">{t('companies.backToCompanies')}</Link>
      </div>
    );
  }

  const logo = company.media?.find((m: CompanyMedia) => m.kind === 'LOGO');
  const cover = company.media?.find((m: CompanyMedia) => m.kind === 'COVER');
  const galleryPhotos = company.media?.filter((m: CompanyMedia) => m.kind === 'GALLERY') ?? [];

  return (
    <div className="container-main py-10">
      <Link href="/companies" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-blue-bright transition-colors mb-6">
        <ChevronLeft size={16} />
        {t('companies.backToCompanies')}
      </Link>

      {/* Header */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-br from-blue-accent/30 to-orange/10 relative">
          {cover && (
            <img src={cover.url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-8 -mt-12 relative">
          <div className="flex items-end gap-6">
            {logo ? (
              <img src={logo.url} alt={company.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-[var(--bg-primary)] shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-2xl gradient-cta flex items-center justify-center text-white font-bold text-3xl border-4 border-[var(--bg-primary)] shadow-lg">
                {company.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] truncate">
                {company.name}
              </h1>
              {(company.country || company.city) && (
                <p className="flex items-center gap-1 text-sm text-[var(--text-secondary)] mt-1">
                  <MapPin size={14} />
                  {[company.city?.name, company.country?.name].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <StarRating rating={company.ratingAvg} size={16} />
              <span className="text-sm text-[var(--text-secondary)]">
                {t('companies.reviewsCount', {
                  rating: company.ratingAvg.toFixed(1),
                  count: company.reviewsCount,
                })}
              </span>
            </div>
            {company.isVerified && <Badge variant="success"><ShieldCheck size={12} className="mr-1" /> {t('companies.verified')}</Badge>}
            {company.isOfficialDealer && <Badge>{t('companies.officialDealer')}</Badge>}
            {company.isManufacturer && <Badge variant="warning">{t('companies.manufacturer')}</Badge>}
          </div>

          {company.ratingSource && (
            <p className="text-xs text-[var(--text-secondary)] mt-2">{company.ratingSource}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--text-secondary)]">
            {company.yearsOnPlatform != null && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {t('companies.yearsOnPlatform', { count: company.yearsOnPlatform })}
              </span>
            )}
            {company.yearsOnMarket != null && (
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {t('companies.yearsOnMarket', { count: company.yearsOnMarket })}
              </span>
            )}
          </div>

          {company.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">{company.description}</p>
          )}

          {company.phones && company.phones.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {company.phones.map((phone) => (
                <a key={phone.id} href={`tel:${phone.phoneE164}`} className="flex items-center gap-1.5 text-sm text-blue-bright hover:text-blue-light transition-colors">
                  <Phone size={14} />
                  {phone.phoneE164}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'listings' ? 'text-blue-bright' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Package size={16} className="inline mr-2" />
          {t('companies.tabs.listings')} ({company.listingsCount})
          {activeTab === 'listings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-bright rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'reviews' ? 'text-blue-bright' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Star size={16} className="inline mr-2" />
          {t('companies.tabs.reviews')} ({company.reviewsCount})
          {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-bright rounded-full" />}
        </button>
        {galleryPhotos.length > 0 && (
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'gallery' ? 'text-blue-bright' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ImageIcon size={16} className="inline mr-2" />
            {t('companies.tabs.gallery')} ({galleryPhotos.length})
            {activeTab === 'gallery' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-bright rounded-full" />}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listingsLoading
              ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
              : listingsData?.data.map((listing: Listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
          </div>
          {!listingsLoading && (!listingsData?.data || listingsData.data.length === 0) && (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto text-blue-bright/20 mb-3" />
              <p className="text-[var(--text-secondary)]">{t('companies.noListings')}</p>
            </div>
          )}
          {listingsData && listingsData.meta.totalPages > 1 && (
            <Pagination currentPage={listingsPage} totalPages={listingsData.meta.totalPages} onPageChange={setListingsPage} />
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setReviewModalOpen(true)}
              className="gradient-cta text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t('companies.writeReview')}
            </button>
          </div>
          <ReviewList reviews={reviewsData?.data ?? []} isLoading={reviewsLoading} />

          <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title={t('companies.reviewModalTitle')}>
            <ReviewForm companyId={company.id} onSuccess={() => setReviewModalOpen(false)} />
          </Modal>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryPhotos.map((photo) => (
            <div key={photo.id} className="glass-card overflow-hidden aspect-square">
              <img src={photo.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
