'use client';

import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/components/providers/translation-provider';
import { registerUser } from '@/lib/auth-api';

export function RegisterForm() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (password !== confirmPassword) {
      setError(t('auth.register.errorPasswordMismatch'));
      return;
    }

    if (!normalizedFirstName || !normalizedLastName) {
      setError(t('auth.register.errorDefault'));
      return;
    }

    if (password.length < 10) {
      setError(t('auth.register.errorPasswordLength'));
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        email,
        password,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      });
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : t('auth.register.errorDefault');
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] text-center">
          {t('auth.register.title')}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t('auth.register.firstName')}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-bright transition-colors"
              placeholder={t('auth.register.firstNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t('auth.register.lastName')}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-bright transition-colors"
              placeholder={t('auth.register.lastNamePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            {t('auth.register.emailLabel')} *
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-bright transition-colors"
            placeholder={t('auth.register.emailPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            {t('auth.register.passwordLabel')} *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={10}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-bright transition-colors pr-11"
              placeholder={t('auth.register.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label={t('auth.register.passwordLabel')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            {t('auth.register.confirmPasswordLabel')} *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-bright transition-colors"
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full gradient-cta text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={18} />
              {t('auth.register.submit')}
            </>
          )}
        </button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          {t('auth.register.hasAccount')}{' '}
          <Link
            href="/login"
            className="text-blue-bright hover:text-blue-light transition-colors font-medium"
          >
            {t('auth.register.loginLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}
