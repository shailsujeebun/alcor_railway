'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  List,
  PlusCircle,
  Settings,
  Heart,
  Clock,
  MessageSquare,
  HelpCircle,
  Bell,
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/translation-provider';

const sidebarLinks = [
  { href: '/cabinet', labelKey: 'cabinet.sidebar.overview', icon: LayoutDashboard },
  { href: '/cabinet/listings', labelKey: 'cabinet.sidebar.myListings', icon: List },
  { href: '/cabinet/listings/new', labelKey: 'cabinet.sidebar.newListing', icon: PlusCircle },
  { href: '/cabinet/favorites', labelKey: 'cabinet.sidebar.favorites', icon: Heart },
  { href: '/cabinet/history', labelKey: 'cabinet.sidebar.history', icon: Clock },
  { href: '/cabinet/messages', labelKey: 'cabinet.sidebar.messages', icon: MessageSquare },
  { href: '/cabinet/saved-searches', labelKey: 'cabinet.sidebar.savedSearches', icon: Search },
  { href: '/cabinet/notifications', labelKey: 'cabinet.sidebar.notifications', icon: Bell },
  { href: '/cabinet/support', labelKey: 'cabinet.sidebar.support', icon: HelpCircle },
  { href: '/cabinet/settings', labelKey: 'cabinet.sidebar.settings', icon: Settings },
];

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="container-main py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-blue-bright border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="container-main pt-16 md:pt-20 pb-10 md:pb-14">
      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] items-start gap-6 md:gap-8 mt-10 md:mt-12">
        <aside className="hidden md:block w-60 flex-shrink-0">
          <nav className="glass-card p-3 sticky top-28 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/cabinet' ? pathname === '/cabinet' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'gradient-cta text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]',
                  )}
                >
                  <Icon size={18} />
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="md:hidden flex gap-1 overflow-x-auto pb-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/cabinet' ? pathname === '/cabinet' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  isActive ? 'gradient-cta text-white' : 'glass-card text-[var(--text-secondary)]',
                )}
              >
                <Icon size={14} />
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
