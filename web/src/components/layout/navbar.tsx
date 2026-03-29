'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  LogIn,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MAIN_LANDING_URL } from '@/lib/landing';
import { useAuthStore } from '@/stores/auth-store';
import { logoutUser } from '@/lib/auth-api';
import { useTheme } from '@/components/providers/theme-provider';
import { MobileMenu } from './mobile-menu';
import { NotificationBell } from './notification-bell';
import { useTranslation } from '../providers/translation-provider';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, accessToken, logout } = useAuthStore();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/listings', label: t('nav.listings') },
    { href: '/companies', label: t('nav.companies') },
    { href: '/categories', label: t('nav.categories') },
    ...(isAdminUser ? [{ href: '/admin', label: t('nav.admin') }] : []),
  ];
  const homeLogoHref = MAIN_LANDING_URL;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logoutUser(accessToken);
    } catch {
      // Ignore errors on logout
    }
    logout();
    router.push('/');
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || t('nav.userFallback');

  return (
    <>
      <header className="site-navbar sticky top-0 z-50 border-b border-[var(--border-color)] bg-[color:var(--bg-secondary)]/90 backdrop-blur-xl">
        <div className="container-main flex items-center justify-between h-18 min-h-[72px]">
          <Link href={homeLogoHref} className="logo-link flex items-center">
            <Image
              src="/alcor-logo.png"
              alt={t('brand.logoAlt')}
              width={58}
              height={58}
              className="logo-image h-[48px] w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 ml-12 mr-16">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'site-nav-link text-sm font-medium transition-colors relative py-1',
                  pathname === link.href
                    ? 'site-nav-link-active text-blue-bright'
                    : 'text-[var(--text-secondary)] hover:text-blue-light',
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-bright rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t('topBar.toggleTheme')}
              title={t('topBar.toggleTheme')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-[var(--border-color)] animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-blue-bright/40 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full gradient-cta flex items-center justify-center text-white text-xs font-bold">
                      {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    <span className="text-sm text-[var(--text-primary)] font-medium max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-[var(--text-secondary)] transition-transform',
                        dropdownOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 glass-card py-2 shadow-xl z-50">
                      <div className="px-4 py-2 border-b border-[var(--border-color)]">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/cabinet"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        {t('nav.cabinet')}
                      </Link>
                      {isAdminUser && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
                        >
                          <Shield size={16} />
                          {t('nav.adminEntry')}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="site-auth-primary gradient-cta text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <LogIn size={16} />
                  {t('nav.authAccess')}
                </Link>
                <Link
                  href="/ad-placement"
                  className="site-action-orange bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5"
                >
                  <span className="text-lg">+</span>
                  {t('nav.placeAd')}
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-[var(--text-secondary)]"
            aria-label={t('nav.openMenu')}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
