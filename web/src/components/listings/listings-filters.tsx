import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketplaces, useCategories, useBrands, useCountries, useCities, useCreateSavedSearch } from '@/lib/queries';
import { useAuthStore } from '@/stores/auth-store';
import {
  dedupeCategoriesByDisplayName,
  getCategoryDisplayName,
  getMarketplaceDisplayName,
  shouldHideCategory,
} from '@/lib/display-labels';

interface FiltersState {
  marketplaceId: string;
  search: string;
  categoryId: string;
  brandId: string;
  condition: string;
  countryId: string;
  cityId: string;
  priceMin: string;
  priceMax: string;
  priceCurrency: string;
  yearMin: string;
  yearMax: string;
  listingType: string;
  euroClass: string;
  sort: string;
}

interface ListingsFiltersProps {
  filters: FiltersState;
  onFilterChange: (key: keyof FiltersState, value: string) => void;
  onClear: () => void;
}

export function ListingsFilters({ filters, onFilterChange, onClear }: ListingsFiltersProps) {
  const { data: marketplaces } = useMarketplaces();
  const { data: categories } = useCategories(filters.marketplaceId || undefined);
  const { data: brands } = useBrands();
  const { data: countries } = useCountries();
  const { data: citiesData } = useCities(filters.countryId || undefined);
  const { isAuthenticated } = useAuthStore();
  const saveMutation = useCreateSavedSearch();
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const flatCategories = dedupeCategoriesByDisplayName(
    (categories?.flatMap((c) => [
      c,
      ...(c.children ?? []),
    ]) ?? []).filter((category) => !shouldHideCategory(category.name)),
  );

  const hasFilters = Object.values(filters).some(Boolean);

  const FilterSelect = ({
    value,
    onChange,
    placeholder,
    options,
  }: {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
  }) => (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Фільтри</h3>
        {hasFilters && (
          <button onClick={onClear} className="text-xs text-blue-bright hover:text-blue-light transition-colors">
            Очистити всі
          </button>
        )}
      </div>

      {/* Marketplace Selector */}
      {marketplaces && marketplaces.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Майданчик</label>
          <FilterSelect
            value={filters.marketplaceId}
            onChange={(v) => onFilterChange('marketplaceId', v)}
            placeholder="Усі майданчики"
            options={marketplaces.map((m) => ({
              value: m.id,
              label: getMarketplaceDisplayName(m.name, m.key),
            }))}
          />
        </div>
      )}

      <SearchInput
        value={filters.search}
        onChange={(v) => onFilterChange('search', v)}
        placeholder="Пошук оголошень..."
      />

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Сортування</label>
        <FilterSelect
          value={filters.sort}
          onChange={(v) => onFilterChange('sort', v)}
          placeholder="За замовчуванням"
          options={[
            { value: 'publishedAt', label: 'Дата розміщення' },
            { value: 'priceDesc', label: 'Спочатку дорогі' },
            { value: 'priceAsc', label: 'Спочатку дешеві' },
            { value: 'yearDesc', label: 'Рік — спочатку нові' },
            { value: 'yearAsc', label: 'Рік — спочатку старі' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Категорія</label>
        <FilterSelect
          value={filters.categoryId}
          onChange={(v) => onFilterChange('categoryId', v)}
          placeholder="Усі категорії"
          options={flatCategories.map((c) => ({
            value: c.id,
            label: c.parentId
              ? `  ${getCategoryDisplayName(c.name)}`
              : getCategoryDisplayName(c.name),
          }))}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Марка</label>
        <FilterSelect
          value={filters.brandId}
          onChange={(v) => onFilterChange('brandId', v)}
          placeholder="Усі марки"
          options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Тип оголошення</label>
        <FilterSelect
          value={filters.listingType}
          onChange={(v) => onFilterChange('listingType', v)}
          placeholder="Усі типи"
          options={[
            { value: 'SALE', label: 'Продаж' },
            { value: 'RENT', label: 'Оренда' },
            { value: 'FROM_MANUFACTURER', label: 'Від виробника' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Стан</label>
        <FilterSelect
          value={filters.condition}
          onChange={(v) => onFilterChange('condition', v)}
          placeholder="Будь-який стан"
          options={[
            { value: 'NEW', label: 'Новий' },
            { value: 'USED', label: 'Б/в' },
            { value: 'DEMO', label: 'Демонстраційний' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Ціна</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Мін"
            value={filters.priceMin}
            onChange={(e) => onFilterChange('priceMin', e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-bright)]"
          />
          <input
            type="number"
            placeholder="Макс"
            value={filters.priceMax}
            onChange={(e) => onFilterChange('priceMax', e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-bright)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Валюта</label>
        <FilterSelect
          value={filters.priceCurrency}
          onChange={(v) => onFilterChange('priceCurrency', v)}
          placeholder="Усі валюти"
          options={[
            { value: 'EUR', label: '€ EUR' },
            { value: 'USD', label: '$ USD' },
            { value: 'UAH', label: '₴ UAH' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Рік випуску</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Мін"
            value={filters.yearMin}
            onChange={(e) => onFilterChange('yearMin', e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-bright)]"
          />
          <input
            type="number"
            placeholder="Макс"
            value={filters.yearMax}
            onChange={(e) => onFilterChange('yearMax', e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-bright)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Євро клас</label>
        <FilterSelect
          value={filters.euroClass}
          onChange={(v) => onFilterChange('euroClass', v)}
          placeholder="Усі класи"
          options={[
            { value: 'Euro 3', label: 'Euro 3' },
            { value: 'Euro 4', label: 'Euro 4' },
            { value: 'Euro 5', label: 'Euro 5' },
            { value: 'Euro 6', label: 'Euro 6' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Країна</label>
        <FilterSelect
          value={filters.countryId}
          onChange={(v) => {
            onFilterChange('countryId', v);
            onFilterChange('cityId', '');
          }}
          placeholder="Усі країни"
          options={(countries ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      {filters.countryId && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Місто</label>
          <FilterSelect
            value={filters.cityId}
            onChange={(v) => onFilterChange('cityId', v)}
            placeholder="Усі міста"
            options={(citiesData?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      )}

      {/* Save search */}
      {isAuthenticated && hasFilters && (
        <div className="pt-3 border-t border-[var(--border-color)]">
          {showSave ? (
            <div className="space-y-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Назва пошуку..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:border-blue-bright outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!saveName.trim()) return;
                    const activeFilters: Record<string, string> = {};
                    for (const [key, value] of Object.entries(filters)) {
                      if (value) activeFilters[key] = value;
                    }
                    saveMutation.mutate(
                      { name: saveName.trim(), filters: activeFilters },
                      {
                        onSuccess: () => {
                          setSaveName('');
                          setShowSave(false);
                        },
                      },
                    );
                  }}
                  disabled={!saveName.trim() || saveMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg gradient-cta text-white text-sm font-medium disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  onClick={() => { setShowSave(false); setSaveName(''); }}
                  className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm"
                >
                  Скасувати
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-bright/40 text-sm font-medium transition-colors"
            >
              <Bookmark size={16} />
              Зберегти пошук
            </button>
          )}
        </div>
      )}
    </div>
  );
}
