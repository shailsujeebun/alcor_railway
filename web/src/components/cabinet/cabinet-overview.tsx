'use client';

import Link from 'next/link';
import { PlusCircle, List, FileText, CheckCircle, PauseCircle, Clock } from 'lucide-react';
import { useListings } from '@/lib/queries';
import { useAuthStore } from '@/stores/auth-store';
import type { Listing, ListingStatus } from '@/types/api';

const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Чернетка', className: 'bg-gray-500/20 text-gray-400' },
  SUBMITTED: { label: 'Подано', className: 'bg-yellow-500/20 text-yellow-400' },
  PENDING_MODERATION: { label: 'На модерації', className: 'bg-orange-500/20 text-orange-400' },
  ACTIVE: { label: 'Активне', className: 'bg-green-500/20 text-green-400' },
  PAUSED: { label: 'Призупинено', className: 'bg-blue-500/20 text-blue-400' },
  EXPIRED: { label: 'Закінчилось', className: 'bg-gray-500/20 text-gray-400' },
  REJECTED: { label: 'Відхилено', className: 'bg-red-500/20 text-red-400' },
  REMOVED: { label: 'Видалено', className: 'bg-red-800/20 text-red-500' },
};

export function CabinetOverview() {
  const { user } = useAuthStore();

  // Fetch all user listings (no status filter) to calculate counts
  const { data, isLoading } = useListings({
    ownerUserId: user?.id ?? '',
    limit: '100',
  });

  const listings = data?.data ?? [];
  const total = listings.length;
  const active = listings.filter((l: Listing) => l.status === 'ACTIVE').length;
  const drafts = listings.filter((l: Listing) => l.status === 'DRAFT').length;
  const pending = listings.filter((l: Listing) => l.status === 'PENDING_MODERATION').length;
  const recent = listings.slice(0, 5);

  const displayName = (user?.firstName || user?.email?.split('@')[0] || 'Користувач').trim();

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-1">
        Вітаємо, {displayName}!
      </h1>
      <p className="text-[var(--text-secondary)] mb-6">
        Ваш особистий кабінет для управління оголошеннями
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Всього', value: total, icon: FileText, color: 'text-blue-400' },
          { label: 'Активних', value: active, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Чернетки', value: drafts, icon: Clock, color: 'text-gray-400' },
          { label: 'На модерації', value: pending, icon: PauseCircle, color: 'text-yellow-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <Icon size={24} className={stat.color} />
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {isLoading ? '—' : stat.value}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions - only show if there are listings */}
      {total > 0 && (
        <div className="flex gap-3 mb-8">
          <Link
            href="/cabinet/listings/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-white font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={18} />
            Нове оголошення
          </Link>
          <Link
            href="/cabinet/listings"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-bright/40 transition-colors"
          >
            <List size={18} />
            Всі оголошення
          </Link>
        </div>
      )}

      {/* Recent listings */}
      <h2 className="text-lg font-heading font-semibold text-[var(--text-primary)] mb-4">
        Останні оголошення
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-[var(--border-color)] rounded w-1/3 mb-2" />
              <div className="h-3 bg-[var(--border-color)] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-[var(--text-secondary)] mb-4">У вас поки немає оголошень</p>
          <Link
            href="/cabinet/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-white font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={18} />
            Створити перше оголошення
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recent.map((listing: Listing) => (
            <Link
              key={listing.id}
              href={`/cabinet/listings/${listing.id}/edit`}
              className="glass-card p-4 flex items-center justify-between hover:border-blue-bright/30 transition-colors block"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {listing.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {listing.category?.name ?? '—'} · {listing.priceAmount ? `${listing.priceAmount.toLocaleString()} ${listing.priceCurrency}` : 'Ціну не вказано'}
                </p>
              </div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_BADGE[listing.status].className}`}>
                {STATUS_BADGE[listing.status].label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
