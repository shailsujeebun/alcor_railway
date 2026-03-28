'use client';

import { useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { useUsers, useUpdateUser } from '@/lib/queries';
import type { User, UserRole, UserStatus } from '@/types/api';

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Користувач',
  PRO_SELLER: 'Продавець',
  MANAGER: 'Менеджер',
  ADMIN: 'Адміністратор',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Активний',
  RESTRICTED: 'Обмежений',
  BLOCKED: 'Заблокований',
};

const STATUS_BADGE: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  RESTRICTED: 'bg-yellow-500/20 text-yellow-400',
  BLOCKED: 'bg-red-500/20 text-red-400',
};

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:border-blue-bright outline-none transition-colors';

export default function UsersManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const params: Record<string, string> = { page: String(page), limit: '20' };
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useUsers(params);
  const updateMutation = useUpdateUser();

  const users = (data?.data ?? []) as User[];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)] mb-6">
        Управління користувачами
      </h1>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Пошук за email, ім'ям..."
              className={`${inputClass} !pl-10`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">Всі ролі</option>
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">Всі статуси</option>
            {(Object.entries(STATUS_LABELS) as [UserStatus, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-5 bg-[var(--border-color)] rounded w-1/3 mb-2" />
              <div className="h-4 bg-[var(--border-color)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserCheck
            size={48}
            className="mx-auto mb-4 text-[var(--text-secondary)]"
          />
          <p className="text-[var(--text-secondary)]">
            Користувачів не знайдено
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="glass-card p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {u.firstName || ''} {u.lastName || ''}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                      {ROLE_LABELS[u.role]}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[u.status]}`}
                    >
                      {STATUS_LABELS[u.status]}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {u.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateMutation.mutate({
                        userId: u.id,
                        data: { role: e.target.value },
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:border-blue-bright outline-none disabled:opacity-50"
                  >
                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
                      ([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ),
                    )}
                  </select>
                  <select
                    value={u.status}
                    onChange={(e) =>
                      updateMutation.mutate({
                        userId: u.id,
                        data: { status: e.target.value },
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:border-blue-bright outline-none disabled:opacity-50"
                  >
                    {(
                      Object.entries(STATUS_LABELS) as [UserStatus, string][]
                    ).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
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
