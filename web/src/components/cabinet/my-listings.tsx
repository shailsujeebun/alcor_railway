'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit, Eye, Send, Pause, Play, RotateCcw, Upload, Download } from 'lucide-react';
import {
  useListings,
  useSubmitListing,
  usePauseListing,
  useResumeListing,
  useResubmitListing,
  useImportListingsCsv,
  useMyCompanies,
} from '@/lib/queries';
import { useAuthStore } from '@/stores/auth-store';
import type { Listing, ListingStatus } from '@/types/api';
import { Modal } from '@/components/ui/modal';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Всі', value: '' },
  { label: 'Чернетки', value: 'DRAFT' },
  { label: 'Подані', value: 'SUBMITTED' },
  { label: 'Активні', value: 'ACTIVE' },
  { label: 'Призупинені', value: 'PAUSED' },
  { label: 'Відхилені', value: 'REJECTED' },
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

export function MyListings() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [defaultCompanyId, setDefaultCompanyId] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const params: Record<string, string> = {
    ownerUserId: user?.id ?? '',
    page: String(page),
    limit: '20',
  };
  if (activeTab) params.status = activeTab;

  const { data, isLoading } = useListings(params);

  const submitMutation = useSubmitListing();
  const pauseMutation = usePauseListing();
  const resumeMutation = useResumeListing();
  const resubmitMutation = useResubmitListing();
  const importCsvMutation = useImportListingsCsv();
  const { data: myCompanies } = useMyCompanies();

  const listings = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const isAnyPending =
    submitMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    resubmitMutation.isPending;

  const csvTemplate = [
    'title,categoryId,brandId,year,priceAmount,priceCurrency,condition,listingType,countryId,cityId,sellerName,sellerEmail,sellerPhones,description',
    'Приклад оголошення,123,,,15000,EUR,USED,SALE,,,Іван,ivan@example.com,"+380681112233;+380671234567",Короткий опис',
  ].join('\n');

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alcor-listings-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async () => {
    setImportError('');
    setImportSuccess('');

    if (!csvFile) {
      setImportError('Оберіть CSV файл.');
      return;
    }

    try {
      const csvContent = await csvFile.text();
      const result = await importCsvMutation.mutateAsync({
        csvContent,
        defaultCompanyId: defaultCompanyId || undefined,
      });
      setImportSuccess(
        `Імпорт завершено: створено ${result.createdCount}, помилок ${result.failedCount}.`,
      );
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Не вдалося імпортувати CSV.',
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
          Мої оголошення
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium hover:border-blue-bright/40 transition-colors"
          >
            <Upload size={16} />
            Імпорт CSV
          </button>
          <Link
            href="/cabinet/listings/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-cta text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={16} />
            Створити
          </Link>
        </div>
      </div>

      {/* Status tabs */}
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

      {/* Listings list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-5 bg-[var(--border-color)] rounded w-1/3 mb-2" />
              <div className="h-4 bg-[var(--border-color)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            {activeTab ? 'Немає оголошень з цим статусом' : 'У вас поки немає оголошень'}
          </p>
          {!activeTab && (
            <Link
              href="/cabinet/listings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-white font-medium hover:opacity-90 transition-opacity"
            >
              <PlusCircle size={18} />
              Створити перше оголошення
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: Listing) => (
            <div key={listing.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-[var(--text-primary)] truncate">
                      {listing.title}
                    </h3>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_BADGE[listing.status].className}`}>
                      {STATUS_BADGE[listing.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    {listing.category && <span>{listing.category.name}</span>}
                    {listing.priceAmount && (
                      <span>{listing.priceAmount.toLocaleString()} {listing.priceCurrency}</span>
                    )}
                    <span>{new Date(listing.createdAt).toLocaleDateString('uk')}</span>
                  </div>
                  {listing.moderationReason && listing.status === 'REJECTED' && (
                    <p className="mt-1.5 text-sm text-red-400">
                      Причина: {listing.moderationReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* View */}
                  <button
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-bright/40 transition-colors"
                    title="Переглянути"
                  >
                    <Eye size={16} />
                  </button>

                  {/* Edit — available for DRAFT, ACTIVE */}
                  {(listing.status === 'DRAFT' || listing.status === 'ACTIVE') && (
                    <button
                      onClick={() => router.push(`/cabinet/listings/${listing.id}/edit`)}
                      className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-bright/40 transition-colors"
                      title="Редагувати"
                    >
                      <Edit size={16} />
                    </button>
                  )}

                  {/* Submit — DRAFT */}
                  {listing.status === 'DRAFT' && (
                    <button
                      onClick={() => submitMutation.mutate(listing.id)}
                      disabled={isAnyPending}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                      title="Подати на модерацію"
                    >
                      <Send size={16} />
                    </button>
                  )}

                  {/* Pause — ACTIVE */}
                  {listing.status === 'ACTIVE' && (
                    <button
                      onClick={() => pauseMutation.mutate(listing.id)}
                      disabled={isAnyPending}
                      className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                      title="Призупинити"
                    >
                      <Pause size={16} />
                    </button>
                  )}

                  {/* Resume — PAUSED */}
                  {listing.status === 'PAUSED' && (
                    <button
                      onClick={() => resumeMutation.mutate(listing.id)}
                      disabled={isAnyPending}
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      title="Відновити"
                    >
                      <Play size={16} />
                    </button>
                  )}

                  {/* Resubmit — REJECTED, EXPIRED */}
                  {(listing.status === 'REJECTED' || listing.status === 'EXPIRED') && (
                    <button
                      onClick={() => resubmitMutation.mutate(listing.id)}
                      disabled={isAnyPending}
                      className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                      title="Повторно подати"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              </div>
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

      <Modal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Імпорт оголошень з CSV"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Завантажте CSV і ми створимо оголошення-чернетки пакетно.
          </p>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-primary)] hover:border-blue-bright/40 transition-colors"
          >
            <Download size={15} />
            Завантажити шаблон CSV
          </button>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              Компанія за замовчуванням (опційно)
            </label>
            <select
              value={defaultCompanyId}
              onChange={(event) => setDefaultCompanyId(event.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:border-blue-bright outline-none"
            >
              <option value="">Без значення (companyId має бути в CSV)</option>
              {(myCompanies ?? []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              CSV файл
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
              className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-[var(--border-color)] file:bg-[var(--bg-primary)] file:text-[var(--text-primary)]"
            />
          </div>

          {importError && (
            <p className="text-sm text-red-400">{importError}</p>
          )}
          {importSuccess && (
            <p className="text-sm text-green-400">{importSuccess}</p>
          )}

          <button
            onClick={handleImportCsv}
            disabled={importCsvMutation.isPending}
            className="w-full gradient-cta text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {importCsvMutation.isPending ? 'Імпорт...' : 'Імпортувати'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
