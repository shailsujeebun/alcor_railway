'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Package, Building2, MessageSquare } from 'lucide-react';
import { useAdminStats } from '@/lib/queries';
import { changeAdminPassword } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

const quickLinks = [
  { href: '/admin/users', label: 'Управління користувачами', desc: 'Перегляд та редагування користувачів' },
  { href: '/admin/moderation', label: 'Модерація оголошень', desc: 'Схвалення та відхилення нових оголошень' },
  { href: '/admin/tickets', label: 'Тікети підтримки', desc: 'Перегляд всіх звернень' },
  { href: '/admin/dealer-leads', label: 'Заявки дилерів', desc: 'Обробка заявок на реєстрацію' },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const statCards = [
    { label: 'Користувачі', value: stats?.usersCount ?? 0, icon: Users, bgClass: 'bg-blue-500/20', iconClass: 'text-blue-400' },
    { label: 'Оголошення', value: stats?.listingsCount ?? 0, icon: Package, bgClass: 'bg-orange-500/20', iconClass: 'text-orange-400' },
    { label: 'Компанії', value: stats?.companiesCount ?? 0, icon: Building2, bgClass: 'bg-green-500/20', iconClass: 'text-green-400' },
    { label: 'Активні тікети', value: stats?.activeTicketsCount ?? 0, icon: MessageSquare, bgClass: 'bg-purple-500/20', iconClass: 'text-purple-400' },
  ];

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Заповніть всі поля.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Новий пароль і підтвердження не співпадають.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changeAdminPassword({ currentPassword, newPassword });
      setPasswordSuccess('Пароль змінено. Увійдіть повторно.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logout();
      router.push('/login');
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Не вдалося змінити пароль.',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-5 md:p-7">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold bg-blue-bright/10 text-blue-bright border border-blue-bright/25">
            Центр адміністратора
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-[var(--text-primary)]">
            Панель адміністратора
          </h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)]">
            Контролюйте ключові показники платформи, модеруйте контент і керуйте операційними процесами.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${card.bgClass} flex items-center justify-center`}>
                  <Icon size={24} className={card.iconClass} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {isLoading ? '...' : card.value.toLocaleString()}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="glass-card p-6 md:p-7">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-[var(--text-primary)] mb-5">
          Швидкі дії
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="p-4 md:p-5 rounded-xl border border-[var(--border-color)] hover:border-blue-bright/40 hover:bg-blue-bright/[0.04] transition-all"
            >
              <div className="font-semibold text-[var(--text-primary)]">{link.label}</div>
              <div className="text-sm text-[var(--text-secondary)] mt-1.5">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {user?.role === 'ADMIN' && (
      <div className="glass-card p-6 md:p-7">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-[var(--text-primary)] mb-2">
          Зміна пароля адміністратора
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Доступно лише для ролі ADMIN.
        </p>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Поточний пароль"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            autoComplete="current-password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Новий пароль"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Підтвердження нового пароля"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            autoComplete="new-password"
          />
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 rounded-lg gradient-cta text-white text-sm font-semibold disabled:opacity-50"
            >
              {passwordLoading ? 'Збереження...' : 'Змінити пароль'}
            </button>
            {passwordError && <span className="text-sm text-red-400">{passwordError}</span>}
            {passwordSuccess && <span className="text-sm text-green-400">{passwordSuccess}</span>}
          </div>
        </form>
      </div>
      )}
    </div>
  );
}
