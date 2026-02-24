'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Calendar,
  Building2,
  ChevronDown,
  ChevronLeft,
  ShieldCheck,
  Package,
  Clock,
  ExternalLink,
  MessageSquare,
  Phone,
  Star,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/ui/price-display';
import { StarRating } from '@/components/ui/star-rating';
import { useCategoryTemplate, useListingDetail, useRecordView } from '@/lib/queries';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoriteButton } from './favorite-button';
import { ContactSellerButton } from './contact-seller-button';

const conditionLabels: Record<string, string> = {
  NEW: 'Новий',
  USED: 'Б/в',
  DEMO: 'Демонстраційний',
};

const listingTypeLabels: Record<string, string> = {
  SALE: 'Продаж',
  RENT: 'Оренда',
  FROM_MANUFACTURER: 'Від виробника',
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const normalizeDescription = (value?: string | null) => {
  const clean = value?.trim();
  if (!clean) return null;
  const placeholderValues = new Set(['-', '—', 'n/a', 'na', 'none', 'null']);
  if (placeholderValues.has(clean.toLowerCase())) return null;
  return clean;
};

export function ListingDetail({ id }: { id: string }) {
  const { data: listing, isLoading, error } = useListingDetail(id);
  const categoryId = listing?.categoryId ?? '';
  const { data: template } = useCategoryTemplate(categoryId);
  const { isAuthenticated } = useAuthStore();
  const recordView = useRecordView();

  const [openAttributeSection, setOpenAttributeSection] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (isAuthenticated && id) {
      recordView.mutate(id);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [listing?.id]);

  const templateFieldMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const field of template?.fields ?? []) {
      if (field?.key) map.set(String(field.key), field);
    }
    return map;
  }, [template]);

  const prettifyKey = (key: string) =>
    key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (s) => s.toUpperCase());

  const resolveValueLabel = (field: any, rawValue: string) => {
    const normalizedRaw = String(rawValue).trim().toLowerCase();
    if (normalizedRaw === 'true') return 'Yes';
    if (normalizedRaw === 'false') return 'No';

    const options = [...(field?.options ?? []), ...(field?.staticOptions ?? [])];
    if (options.length === 0) return rawValue;

    const optionMap = new Map(
      options
        .filter((opt: any) => opt?.value !== undefined)
        .map((opt: any) => [String(opt.value), String(opt.label ?? opt.value)]),
    );

    const parts = String(rawValue)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return optionMap.get(String(rawValue)) ?? rawValue;
    }

    return parts.map((entry) => optionMap.get(entry) ?? entry).join(', ');
  };

  const displayAttributes = useMemo(() => {
    return (listing?.attributes ?? []).map((attr: any) => {
      const field = templateFieldMap.get(attr.key);
      return {
        ...attr,
        key: attr.key,
        displayKey: field?.label || prettifyKey(attr.key),
        displayValue: resolveValueLabel(field, String(attr.value ?? '')),
      };
    });
  }, [listing?.attributes, templateFieldMap]);

  const attributeSections = useMemo(() => {
    if (displayAttributes.length === 0) return [];

    const byKey = new Map(displayAttributes.map((attr: any) => [attr.key, attr]));
    const grouped = new Map<string, typeof displayAttributes>();
    const matchedKeys = new Set<string>();

    for (const field of template?.fields ?? []) {
      if (!field?.key) continue;
      const attr = byKey.get(String(field.key));
      if (!attr) continue;

      const sectionName = field.group || field.section || 'Додаткові деталі';
      const current = grouped.get(sectionName) ?? [];
      current.push(attr);
      grouped.set(sectionName, current);
      matchedKeys.add(String(field.key));
    }

    const unmatched = displayAttributes.filter((attr: any) => !matchedKeys.has(attr.key));
    if (unmatched.length > 0) {
      const fallbackSection = grouped.get('Додаткові деталі') ?? [];
      grouped.set('Додаткові деталі', [...fallbackSection, ...unmatched]);
    }

    if (grouped.size === 0) {
      grouped.set('Додаткові деталі', displayAttributes);
    }

    return Array.from(grouped.entries());
  }, [displayAttributes, template?.fields]);

  useEffect(() => {
    if (attributeSections.length === 0) {
      setOpenAttributeSection(null);
      return;
    }
    const names = attributeSections.map(([sectionName]) => sectionName);
    setOpenAttributeSection((current) => (current && names.includes(current) ? current : names[0]));
  }, [attributeSections]);

  const mainImage = listing?.media?.[activeImageIndex]?.url || listing?.media?.[0]?.url;
  const cleanedDescription = normalizeDescription(listing?.description);
  const locationLabel = [listing?.city?.name, listing?.country?.name].filter(Boolean).join(', ');
  const sellerPhone = listing?.sellerPhones?.[0] ?? listing?.company?.phones?.find((phone: any) => phone.isPrimary)?.phoneE164;

  const summaryRows = useMemo(() => {
    const baseRows = [
      { label: 'Brand', value: listing?.brand?.name ?? null },
      { label: 'Category', value: listing?.category?.name ?? null },
      {
        label: 'Condition',
        value: listing?.condition ? conditionLabels[listing.condition] ?? listing.condition : null,
      },
      { label: 'Year', value: listing?.year ? String(listing.year) : null },
      { label: 'Location', value: locationLabel || null },
      { label: 'Published', value: formatDate(listing?.publishedAt || listing?.createdAt) },
    ].filter((row) => row.value && row.value !== '-');

    const takenLabels = new Set(baseRows.map((row) => row.label.toLowerCase()));
    const topAttributes = displayAttributes
      .filter((attr: any) => {
        const value = String(attr.displayValue ?? '').trim();
        if (!value || value === '-' || value === '—') return false;
        return !takenLabels.has(String(attr.displayKey).toLowerCase());
      })
      .slice(0, 4)
      .map((attr: any) => ({
        label: attr.displayKey,
        value: attr.displayValue,
      }));

    return [...baseRows, ...topAttributes];
  }, [
    displayAttributes,
    listing?.brand?.name,
    listing?.category?.name,
    listing?.condition,
    listing?.createdAt,
    listing?.publishedAt,
    listing?.year,
    locationLabel,
  ]);

  if (isLoading) {
    return (
      <div className="container-main py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[420px] w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container-main py-20 text-center">
        <Package size={48} className="mx-auto text-blue-bright/20 mb-4" />
        <h2 className="font-heading font-bold text-xl text-[var(--text-primary)]">Оголошення не знайдено</h2>
        <Link href="/listings" className="text-blue-bright mt-4 inline-block">
          Назад до оголошень
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8 md:py-10">
      <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-gradient-to-b from-[#0c1a33] via-[#071426] to-[#050b14] p-4 md:p-6">
        <div className="pointer-events-none absolute -left-24 -top-24 h-60 w-60 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative z-10">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-blue-bright transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Назад до оголошень
          </Link>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {listing.condition && (
                <Badge variant={listing.condition === 'NEW' ? 'success' : 'warning'}>
                  {conditionLabels[listing.condition] ?? listing.condition}
                </Badge>
              )}
              {listing.listingType && <Badge>{listingTypeLabels[listing.listingType] ?? listing.listingType}</Badge>}
              {listing.brand && <Badge variant="outline">{listing.brand.name}</Badge>}
              {listing.category && <Badge variant="outline">{listing.category.name}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {listing.externalUrl && (
                <a
                  href={listing.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/8"
                >
                  <ExternalLink size={14} />
                  Джерело
                </a>
              )}
              <FavoriteButton listingId={id} />
            </div>
          </div>

          <h1 className="mb-5 text-2xl font-extrabold leading-tight text-white md:text-3xl">{listing.title}</h1>

          <div className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-white/12 bg-[rgba(6,16,32,0.88)] p-4 backdrop-blur-sm animate-[fade-up_0.5s_ease-out_forwards]">
              <PriceDisplay
                amount={listing.priceAmount}
                currency={listing.priceCurrency}
                priceType={listing.priceType}
                className="text-[28px] font-extrabold"
              />

              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:translate-y-[-1px]"
              >
                Contact the seller
              </button>

              <dl className="mt-4 divide-y divide-white/10 text-sm">
                {summaryRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3 py-2.5">
                    <dt className="text-[var(--text-secondary)]">{row.label}</dt>
                    <dd className="max-w-[58%] text-right font-medium text-white">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-white/12 bg-[rgba(8,20,38,0.8)] p-3 backdrop-blur-sm animate-[fade-up_0.65s_ease-out_forwards]">
              {mainImage ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <img
                    key={mainImage}
                    src={mainImage}
                    alt={listing.title}
                    className="h-[420px] w-full object-cover transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="flex h-[420px] items-center justify-center rounded-xl border border-white/10 bg-black/20">
                  <Building2 size={64} className="text-blue-bright/30" />
                </div>
              )}

              {listing.media && listing.media.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {listing.media.slice(0, 10).map((m: any, index: number) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`group overflow-hidden rounded-lg border transition-all duration-300 ${
                        activeImageIndex === index
                          ? 'border-orange-400 shadow-[0_8px_24px_rgba(249,115,22,0.35)]'
                          : 'border-white/15 hover:border-blue-300/60'
                      }`}
                    >
                      <img
                        src={m.url}
                        alt=""
                        className="h-16 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <aside className="rounded-2xl border border-white/12 bg-[rgba(6,16,32,0.9)] p-4 backdrop-blur-sm animate-[fade-up_0.8s_ease-out_forwards]">
              <h3 className="text-base font-bold text-white">Seller&apos;s contacts</h3>

              {listing.company ? (
                <>
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 text-sm font-extrabold text-white">
                      {listing.company.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{listing.company.name}</p>
                      <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <MapPin size={11} />
                        {[listing.company.city?.name, listing.company.country?.name].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    {listing.company.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-1 text-green-300">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <Star size={12} className="fill-current" />
                      {Number(listing.company.ratingAvg || 0).toFixed(1)}
                    </span>
                    <span>({listing.company.reviewsCount} reviews)</span>
                  </div>

                  {sellerPhone && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                      <Phone size={14} className="text-blue-300" />
                      {sellerPhone}
                    </p>
                  )}

                  <Link
                    href={`/companies/${listing.company.slug}`}
                    className="mt-3 block w-full rounded-xl border border-blue-300/30 bg-blue-500/15 px-3 py-2 text-center text-sm font-semibold text-blue-100 hover:bg-blue-500/25"
                  >
                    View company profile
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Інформація про продавця недоступна.</p>
              )}

              <ContactSellerButton listingId={listing.id} sellerId={listing.ownerUserId ?? ''} />

              <div className="mt-3 rounded-xl border border-white/10 bg-[rgba(17,35,60,0.45)] p-3">
                <p className="mb-2 text-sm font-semibold text-white">Send message</p>
                <div className="space-y-2">
                  <input
                    placeholder="Your name"
                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  />
                  <input
                    placeholder="Email"
                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  />
                  <textarea
                    placeholder="I am interested in your ad"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
                  >
                    <Send size={14} />
                    Send
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_0.9s_ease-out_forwards]">
                <h3 className="mb-3 text-base font-bold text-white">Details</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(listing.country || listing.city) && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
                      <MapPin size={14} className="text-blue-300" />
                      <span className="text-[var(--text-secondary)]">Location:</span>
                      <span className="font-medium text-white">{locationLabel}</span>
                    </div>
                  )}
                  {listing.year && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
                      <Calendar size={14} className="text-blue-300" />
                      <span className="text-[var(--text-secondary)]">Year:</span>
                      <span className="font-medium text-white">{listing.year}</span>
                    </div>
                  )}
                  {listing.hoursValue != null && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
                      <Clock size={14} className="text-blue-300" />
                      <span className="text-[var(--text-secondary)]">Hours:</span>
                      <span className="font-medium text-white">
                        {listing.hoursValue} {listing.hoursUnit ?? 'м/г'}
                      </span>
                    </div>
                  )}
                  {listing.euroClass && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
                      <Package size={14} className="text-blue-300" />
                      <span className="text-[var(--text-secondary)]">Євро клас:</span>
                      <span className="font-medium text-white">{listing.euroClass}</span>
                    </div>
                  )}
                </div>
              </section>

              {attributeSections.length > 0 && (
                <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-4 md:p-5 backdrop-blur-sm animate-[fade-up_1.05s_ease-out_forwards]">
                  <h3 className="mb-3 text-base font-bold text-white">Characteristics</h3>
                  <div className="space-y-2.5">
                    {attributeSections.map(([sectionName, items], sectionIndex) => {
                      const isOpen = openAttributeSection === sectionName;

                      return (
                        <section
                          key={sectionName}
                          className={`overflow-hidden rounded-xl border transition-all duration-400 ${
                            isOpen
                              ? 'border-blue-300/40 bg-[rgba(14,30,52,0.92)] shadow-[0_10px_36px_rgba(59,130,246,0.2)]'
                              : 'border-white/12 bg-[rgba(6,14,28,0.88)] hover:border-orange-300/35 hover:bg-[rgba(11,22,40,0.95)]'
                          }`}
                          style={{ transitionDelay: `${sectionIndex * 45}ms` }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenAttributeSection((current) => (current === sectionName ? null : sectionName))
                            }
                            className="flex w-full items-center justify-between px-4 py-3"
                          >
                            <span className="text-sm font-semibold text-white">{sectionName}</span>
                            <ChevronDown
                              className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${
                                isOpen ? 'rotate-180 text-orange-300' : 'rotate-0'
                              }`}
                            />
                          </button>

                          <div
                            className={`grid transition-all duration-500 ease-out ${
                              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2">
                                {items.map((attr: any) => (
                                  <div
                                    key={attr.id}
                                    className="group flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-black/15 px-3 py-2 text-sm transition-all hover:border-orange-300/40 hover:bg-black/25"
                                  >
                                    <span className="text-[var(--text-secondary)] group-hover:text-slate-100">
                                      {attr.displayKey}
                                    </span>
                                    <span className="text-right font-medium text-white">{attr.displayValue}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </section>
              )}

              {(cleanedDescription || listing.externalUrl) && (
                <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.18s_ease-out_forwards]">
                  <h3 className="mb-3 text-base font-bold text-white">More details</h3>
                  {cleanedDescription && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{cleanedDescription}</p>
                  )}
                  {listing.externalUrl && (
                    <a
                      href={listing.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-300 hover:text-orange-300"
                    >
                      <ExternalLink size={14} />
                      View original source
                    </a>
                  )}
                </section>
              )}
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.25s_ease-out_forwards]">
                <h3 className="text-base font-bold text-white">Purchase tips</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Перед купівлею перевірте серійний номер, історію сервісу та відповідність технічних параметрів документам.
                </p>
              </section>

              <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.32s_ease-out_forwards]">
                <h3 className="text-base font-bold text-white">Safety tips</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Використовуйте захищені способи оплати та погоджуйте огляд техніки в присутності відповідального представника.
                </p>
              </section>

              {listing.company && (
                <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.4s_ease-out_forwards]">
                  <h3 className="mb-2 text-base font-bold text-white">Seller snapshot</h3>
                  <p className="text-sm font-semibold text-white">{listing.company.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <StarRating rating={listing.company.ratingAvg} size={14} />
                    <span>{listing.company.reviewsCount} відгуків</span>
                  </div>
                  <Link
                    href={`/companies/${listing.company.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-orange-300"
                  >
                    <MessageSquare size={14} />
                    Перейти в профіль
                  </Link>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
