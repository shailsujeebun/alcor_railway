'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useAllTickets } from '@/lib/queries';
import type { SupportTicket, TicketPriority } from '@/types/api';

const STATUS_TABS = [
  { label: 'Відкриті', value: 'OPEN' },
  { label: 'В роботі', value: 'IN_PROGRESS' },
  { label: 'Вирішені', value: 'RESOLVED' },
  { label: 'Закриті', value: 'CLOSED' },
];

const PRIORITY_BADGE: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: 'Низький', className: 'bg-gray-500/20 text-gray-400' },
  MEDIUM: { label: 'Середній', className: 'bg-yellow-500/20 text-yellow-400' },
  HIGH: { label: 'Високий', className: 'bg-red-500/20 text-red-400' },
};

export default function AdminTickets() {
  const [activeTab, setActiveTab] = useState('OPEN');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAllTickets({
    status: activeTab,
    page: String(page),
    limit: '20',
  });

  const tickets = (data?.data ?? []) as SupportTicket[];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)] mb-6">
        Тікети підтримки
      </h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
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

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-5 bg-[var(--border-color)] rounded w-1/3 mb-2" />
              <div className="h-4 bg-[var(--border-color)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock
            size={48}
            className="mx-auto mb-4 text-[var(--text-secondary)]"
          />
          <p className="text-[var(--text-secondary)]">
            Немає тікетів з цим статусом
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/cabinet/support/${ticket.id}`}
              className="glass-card p-5 block hover:border-blue-bright/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">
                      {ticket.subject}
                    </h3>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[ticket.priority].className}`}
                    >
                      {PRIORITY_BADGE[ticket.priority].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <span>
                      Від: {ticket.user?.firstName || ticket.user?.email || 'Н/Д'}
                    </span>
                    <span>ID: {ticket.id.slice(0, 8)}</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString('uk')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
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
