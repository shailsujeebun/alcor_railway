'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ListChecks,
  MessageSquare,
  Briefcase,
  Building2,
  Mail,
  PlusCircle,
  Globe,
  Layers,
  FileEdit,
  GitBranch,
  Tags,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/translation-provider';

const sidebarLinks = [
  { href: '/admin', labelKey: 'admin.sidebar.overview', icon: LayoutDashboard },
  { href: '/admin/marketplaces', labelKey: 'admin.sidebar.marketplaces', icon: Globe },
  { href: '/admin/categories', labelKey: 'admin.sidebar.categories', icon: Layers },
  { href: '/admin/subcategories', labelKey: 'admin.sidebar.subcategories', icon: GitBranch },
  { href: '/admin/brands', labelKey: 'admin.sidebar.brands', icon: Tags },
  { href: '/admin/templates', labelKey: 'admin.sidebar.templates', icon: FileEdit },
  { href: '/admin/listings/new', labelKey: 'admin.sidebar.addListing', icon: PlusCircle },
  { href: '/admin/users', labelKey: 'admin.sidebar.users', icon: Users },
  { href: '/admin/moderation', labelKey: 'admin.sidebar.moderation', icon: ListChecks },
  { href: '/admin/tickets', labelKey: 'admin.sidebar.tickets', icon: MessageSquare },
  { href: '/admin/dealer-leads', labelKey: 'admin.sidebar.dealerLeads', icon: Briefcase },
  { href: '/admin/companies', labelKey: 'admin.sidebar.companies', icon: Building2 },
  { href: '/admin/messages', labelKey: 'admin.sidebar.messages', icon: Mail },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated || !user || (user.role !== 'ADMIN' && user.role !== 'MANAGER'))
    ) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="container-main py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-blue-bright border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return null;
  }

  return (
    <div className="container-main pt-16 md:pt-20 pb-16 md:pb-20">
      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] items-start gap-6 md:gap-8 mt-10 md:mt-12">
        <aside className="hidden md:block w-60 flex-shrink-0">
          <nav className="glass-card p-3 sticky top-28 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
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
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
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
