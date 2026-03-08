import Link from 'next/link';
import { MapPin, Package, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Company, CompanyMedia } from '@/types/api';

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const logo = company.media?.find((m: CompanyMedia) => m.kind === 'LOGO');

  return (
    <Link href={`/companies/${company.slug}`} className="block h-full">
      <div className="glass-card card-hover p-6 h-full min-h-[260px] flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          {logo ? (
            <img src={logo.url} alt={company.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full gradient-cta flex items-center justify-center text-white font-bold text-xl">
              {company.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)] leading-tight min-h-[40px] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden break-words">
              {company.name}
            </h3>
            {(company.country || company.city) && (
              <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-1 whitespace-normal break-words">
                <MapPin size={12} />
                {[company.city?.name, company.country?.name].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {company.isVerified && <Badge variant="success"><ShieldCheck size={12} className="mr-1" /> Верифікований</Badge>}
          {company.isOfficialDealer && <Badge variant="default">Офіційний дилер</Badge>}
          {company.isManufacturer && <Badge variant="warning">Виробник</Badge>}
        </div>

        <div className="text-xs text-[var(--text-secondary)] mt-auto">
          <span className="flex items-center gap-1">
            <Package size={12} />
            В продажу: {company.listingsCount} оголошень
          </span>
        </div>
      </div>
    </Link>
  );
}
