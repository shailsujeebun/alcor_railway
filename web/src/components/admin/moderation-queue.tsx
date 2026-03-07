'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Clock, Trash2 } from 'lucide-react';
import { useListings, useApproveListing, useRejectListing, useRemoveListing } from '@/lib/queries';
import type { Listing, ListingStatus } from '@/types/api';
import { getCategoryDisplayName } from '@/lib/display-labels';

const STATUS_TABS: { label: string; value: ListingStatus }[] = [
  { label: 'На модерації', value: 'SUBMITTED' },
  { label: 'Очікує перевірки', value: 'PENDING_MODERATION' },
  { label: 'Активні', value: 'ACTIVE' },
  { label: 'Відхилені', value: 'REJECTED' },
  { label: 'Призупинені', value: 'PAUSED' },
];

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

export function ModerationQueue() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ListingStatus>('SUBMITTED');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListings({
    status: activeTab,
    page: String(page),
    limit: '20',
  });

  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();
  const removeMutation = useRemoveListing();
  const isModerationTab =
    activeTab === 'SUBMITTED' || activeTab === 'PENDING_MODERATION';

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(
      { id, reason: rejectReason },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectReason('');
        },
      },
    );
  };

  const listings = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)] mb-6">
        Модерація оголошень
      </h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? 'gradient-cta text-white'
                : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-5 bg-[var(--border-color)] rounded w-1/3 mb-2" />
              <div className="h-4 bg-[var(--border-color)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
          <p className="text-[var(--text-secondary)]">Немає оголошень з цим статусом</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing: Listing) => (
            <div key={listing.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">
                      {listing.title}
                    </h3>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[listing.status].className}`}>
                      {STATUS_BADGE[listing.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    {listing.company && (
                      <span>{listing.company.name}</span>
                    )}
                    {listing.category && (
                      <span>{getCategoryDisplayName(listing.category.name)}</span>
                    )}
                    {listing.priceAmount && (
                      <span>
                        {listing.priceAmount.toLocaleString()} {listing.priceCurrency}
                      </span>
                    )}
                    {listing.submittedAt && (
                      <span>
                        Подано: {new Date(listing.submittedAt).toLocaleDateString('uk')}
                      </span>
                    )}
                  </div>
                  {listing.moderationReason && (
                    <p className="mt-2 text-sm text-red-400">
                      Причина відмови: {listing.moderationReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-bright/40 transition-colors"
                    title="Переглянути"
                  >
                    <Eye size={18} />
                  </button>
                  {isModerationTab && (
                    <>
                      <button
                        onClick={() => handleApprove(listing.id)}
                        disabled={approveMutation.isPending}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        title="Схвалити"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setRejectingId(listing.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Відхилити"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  {listing.status !== 'REMOVED' && (
                    <button
                      onClick={() => removeMutation.mutate(listing.id)}
                      disabled={removeMutation.isPending}
                      className="p-2 rounded-lg bg-red-800/20 text-red-500 hover:bg-red-800/30 transition-colors disabled:opacity-50"
                      title="Видалити"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Reject reason input */}
              {rejectingId === listing.id && (
                <div className="mt-4 flex gap-3">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Причина відмови..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:border-blue-bright outline-none"
                  />
                  <button
                    onClick={() => handleReject(listing.id)}
                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                  >
                    Відхилити
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? 'gradient-cta text-white'
                  : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
