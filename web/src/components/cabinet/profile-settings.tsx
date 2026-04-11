'use client';

import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile } from '@/lib/queries';

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors';
const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1.5';

export function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [saved, setSaved] = useState(false);

  const updateMutation = useUpdateProfile();

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
      },
      {
        onSuccess: (updatedUser) => {
          setUser(updatedUser);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      },
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-6">
        Налаштування профілю
      </h1>

      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 max-w-xl space-y-5">
        {/* Email (read-only) */}
        <div>
          <label className={labelClass}>Електронна пошта</label>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className={`${inputClass} opacity-60 cursor-not-allowed`}
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Електронну пошту не можна змінити
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ім&apos;я</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Прізвище</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Телефон</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+380 XX XXX XX XX"
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              'Збереження...'
            ) : saved ? (
              <>
                <Check size={18} />
                Збережено
              </>
            ) : (
              <>
                <Save size={18} />
                Зберегти
              </>
            )}
          </button>

          {updateMutation.isError && (
            <p className="text-sm text-red-400">Помилка збереження</p>
          )}
        </div>

        {/* Role info */}
        <div className="pt-4 border-t border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-secondary)]">
            Роль: <span className="text-[var(--text-primary)] font-medium">{user?.role}</span>
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Зареєстровано: <span className="text-[var(--text-primary)]">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uk') : '—'}</span>
          </p>
        </div>
      </form>
    </div>
  );
}
