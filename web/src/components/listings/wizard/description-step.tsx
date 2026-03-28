'use client';

import { useEffect, useMemo, useState } from 'react';
import { DynamicForm } from '../dynamic-form';
import { useWizard } from './wizard-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  createCityOption,
  createCountryOption,
} from '@/lib/api';
import {
  useCategories,
  useCategoryTemplate,
  useCities,
  useCountries,
  useMarketplaces,
} from '@/lib/queries';
import {
  filterVisibleCategoryTree,
  getCategoryDisplayName,
  getMarketplaceDisplayName,
} from '@/lib/display-labels';

const CATEGORY_PREVIEW_LIMIT = 12;

function getMarketplaceAccent(key: string): string {
  const normalized = key.toLowerCase();
  if (normalized.includes('agro')) return 'border-emerald-500/50 bg-emerald-500/10';
  if (normalized.includes('auto')) return 'border-blue-500/50 bg-blue-500/10';
  if (normalized.includes('machinery')) return 'border-amber-500/50 bg-amber-500/10';
  return 'border-[var(--border-color)] bg-[var(--bg-secondary)]';
}

function getCategoryIcon(name: string): string {
  const value = name.toLowerCase();

  // Specific mappings first
  if (value.includes('легкові авто') || value.includes('авто') || value === 'cars' || value.includes('car')) return '🚗';

  if (value.includes('airport')) return '🛫';
  if (value.includes('air transport')) return '✈';
  if (value.includes('water transport')) return '🚢';
  if (value.includes('railway')) return '🚆';
  if (value.includes('municipal')) return '🚧';
  if (value.includes('container')) return '📦';
  if (value.includes('service')) return '🛎';
  if (value.includes('spare')) return '🔩';
  if (value.includes('tire') || value.includes('wheel')) return '🛞';
  if (value.includes('camp')) return '🏕';
  if (value.includes('bus')) return '🚌';
  if (value.includes('motorcycle')) return '🏍';
  if (value.includes('tractor')) return '🚜';
  if (value.includes('truck')) return '🚛';
  if (value.includes('trailer')) return '🚚';
  if (value.includes('tank')) return '🛢';
  if (value.includes('van')) return '🚐';
  if (value.includes('commercial')) return '💼';
  if (value.includes('excavator')) return '🏗';
  if (value.includes('loader') || value.includes('handling')) return '🏋';
  if (value.includes('combine') || value.includes('harvester')) return '🌾';
  if (value.includes('header')) return '🌽';
  if (value.includes('irrigation')) return '💧';
  if (value.includes('fertilizer')) return '🧪';
  if (value.includes('livestock') || value.includes('animal')) return '🐄';
  if (value.includes('forestry')) return '🌲';
  if (value.includes('garden')) return '🌿';
  if (value.includes('vineyard')) return '🍇';
  if (value.includes('potato')) return '🥔';
  if (value.includes('crop')) return '🌱';
  if (value.includes('mining')) return '⛏';
  if (value.includes('industrial')) return '🏭';
  if (value.includes('tool')) return '🧰';
  if (value.includes('raw material')) return '🧱';
  if (value.includes('real estate')) return '🏢';
  if (value.includes('energy')) return '⚡';
  if (value.includes('equipment')) return '🧩';
  return '🔹';
}

export function DescriptionStep() {
  const { form, setForm, setCurrentStep } = useWizard();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: marketplaces = [] } = useMarketplaces();
  const { data: categories = [] } = useCategories();
  const { data: countries, refetch: refetchCountries } = useCountries();
  const { data: citiesData, refetch: refetchCities } = useCities(form.countryId || undefined);
  const cities = citiesData?.data ?? [];
  const [newCountryName, setNewCountryName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [isCreatingCountry, setIsCreatingCountry] = useState(false);
  const [isCreatingCity, setIsCreatingCity] = useState(false);

  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const activeMarketplaces = useMemo(() => {
    const active = marketplaces.filter((marketplace) => marketplace.isActive);
    return active.length > 0 ? active : marketplaces;
  }, [marketplaces]);

  const marketplaceCategories = useMemo(
    () =>
      filterVisibleCategoryTree(
        categories.filter(
          (category) =>
            category.marketplaceId === selectedMarketplaceId &&
            (category.parentId === null || category.parentId === undefined),
        ),
      ),
    [categories, selectedMarketplaceId],
  );

  const selectedCategoryNode = useMemo(
    () => marketplaceCategories.find((category) => category.id === selectedCategoryId),
    [marketplaceCategories, selectedCategoryId],
  );

  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];

    const fromTree = selectedCategoryNode?.children ?? [];
    if (fromTree.length > 0) return fromTree;

    return filterVisibleCategoryTree(
      categories.filter((category) => category.parentId === selectedCategoryId),
    );
  }, [categories, selectedCategoryId, selectedCategoryNode]);

  const hasSubcategories = subCategories.length > 0;

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return marketplaceCategories;
    return marketplaceCategories.filter((category) => {
      const displayName = getCategoryDisplayName(category.name).toLowerCase();
      return category.name.toLowerCase().includes(query) || displayName.includes(query);
    });
  }, [marketplaceCategories, categoryQuery]);

  const visibleCategories = useMemo(() => {
    if (showAllCategories || categoryQuery.trim()) return filteredCategories;
    return filteredCategories.slice(0, CATEGORY_PREVIEW_LIMIT);
  }, [filteredCategories, showAllCategories, categoryQuery]);

  const hasHiddenCategories =
    !showAllCategories &&
    !categoryQuery.trim() &&
    filteredCategories.length > CATEGORY_PREVIEW_LIMIT;

  useEffect(() => {
    if (selectedMarketplaceId || activeMarketplaces.length === 0) return;
    setSelectedMarketplaceId(activeMarketplaces[0].id);
  }, [activeMarketplaces, selectedMarketplaceId]);

  useEffect(() => {
    if (!form.categoryId || categories.length === 0) return;

    let matchedMarketplaceId = '';
    let matchedCategoryId = '';

    for (const rootCategory of categories) {
      if (rootCategory.id === form.categoryId) {
        matchedMarketplaceId = rootCategory.marketplaceId;
        matchedCategoryId = rootCategory.id;
        break;
      }

      const childMatch = rootCategory.children?.find((child) => child.id === form.categoryId);
      if (childMatch) {
        matchedMarketplaceId = rootCategory.marketplaceId;
        matchedCategoryId = rootCategory.id;
        break;
      }
    }

    if (!matchedMarketplaceId) {
      const directMatch = categories.find((category) => category.id === form.categoryId);
      if (directMatch) {
        matchedMarketplaceId = directMatch.marketplaceId;
        matchedCategoryId = directMatch.parentId ?? directMatch.id;
      }
    }

    if (matchedMarketplaceId) setSelectedMarketplaceId(matchedMarketplaceId);
    if (matchedCategoryId) setSelectedCategoryId(matchedCategoryId);
  }, [form.categoryId, categories]);

  const { data: template, isFetching: isTemplateLoading } = useCategoryTemplate(form.categoryId);

  const handleMarketplaceChange = (marketplaceId: string) => {
    setSelectedMarketplaceId(marketplaceId);
    setSelectedCategoryId('');
    setCategoryQuery('');
    setShowAllCategories(false);

    setForm((prev) => ({
      ...prev,
      categoryId: '',
      dynamicAttributes: {},
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    const category = marketplaceCategories.find((item) => item.id === categoryId);
    const nestedChildren = category?.children ?? [];
    const childCategories =
      nestedChildren.length > 0
        ? nestedChildren
        : categories.filter((item) => item.parentId === categoryId);

    if (!categoryId) {
      setForm((prev) => ({ ...prev, categoryId: '', dynamicAttributes: {} }));
      return;
    }

    if (childCategories.length === 0) {
      setForm((prev) => ({ ...prev, categoryId, dynamicAttributes: {} }));
      return;
    }

    setForm((prev) => ({ ...prev, categoryId: '', dynamicAttributes: {} }));
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryId: subcategoryId,
      dynamicAttributes: {},
    }));
  };

  const handleCreateCountry = async () => {
    if (!user) {
      alert('Please log in to create a new country');
      return;
    }
    if (!newCountryName.trim()) return;
    setIsCreatingCountry(true);
    try {
      const created = await createCountryOption({ name: newCountryName.trim() });
      await refetchCountries();
      await queryClient.invalidateQueries({ queryKey: ['countries'] });
      setForm((prev) => ({
        ...prev,
        countryId: created.value,
        cityId: '',
      }));
      setNewCountryName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create country');
    } finally {
      setIsCreatingCountry(false);
    }
  };

  const handleCreateCity = async () => {
    if (!user) {
      alert('Please log in to create a new city');
      return;
    }
    if (!newCityName.trim() || !form.countryId) return;
    setIsCreatingCity(true);
    try {
      const created = await createCityOption({
        name: newCityName.trim(),
        countryId: form.countryId,
      });
      await refetchCities();
      await queryClient.invalidateQueries({ queryKey: ['cities'] });
      setForm((prev) => ({
        ...prev,
        cityId: created.value,
      }));
      setNewCityName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create city');
    } finally {
      setIsCreatingCity(false);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'countryId' ? { cityId: '' } : {}),
    }));
  };

  const handleNext = () => {
    if (!form.title.trim() || !selectedMarketplaceId || !selectedCategoryId || !form.categoryId) {
      alert('Please select marketplace, category, subcategory, and fill in ad title.');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors';
  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1.5';
  const selectClass = `${inputClass} appearance-none`;
  const sectionClass = 'glass-card p-6 sm:p-8 space-y-5 mb-6';
  const sectionTitleClass = 'text-lg font-heading font-bold text-[var(--text-primary)] mb-4';

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Basic information</h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Marketplace *</label>
            <div className="flex flex-wrap gap-2">
              {activeMarketplaces.map((marketplace) => {
                const isActive = selectedMarketplaceId === marketplace.id;
                return (
                  <button
                    key={marketplace.id}
                    type="button"
                    onClick={() => handleMarketplaceChange(marketplace.id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${isActive
                        ? `${getMarketplaceAccent(marketplace.key)} text-[var(--text-primary)]`
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    {getMarketplaceDisplayName(marketplace.name, marketplace.key)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Category *</label>
            <input
              type="text"
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
              placeholder="Search category..."
              className={`${inputClass} mb-3`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleCategories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
                    className={`text-left p-4 rounded-lg border transition-colors ${isSelected
                        ? 'border-blue-bright bg-blue-bright/10'
                        : 'border-[var(--border-color)] hover:border-blue-bright/40'
                      }`}
                  >
                    <p className="text-xl mb-1">{getCategoryIcon(getCategoryDisplayName(category.name))}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{getCategoryDisplayName(category.name)}</p>
                    {category.children && category.children.length > 0 && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {category.children.length} subcategories
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            {filteredCategories.length === 0 && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No categories found for this search.
              </p>
            )}
            {hasHiddenCategories && (
              <button
                type="button"
                onClick={() => setShowAllCategories(true)}
                className="mt-3 text-sm text-blue-bright hover:text-blue-light"
              >
                Show all {filteredCategories.length} categories
              </button>
            )}
            {showAllCategories && !categoryQuery.trim() && filteredCategories.length > CATEGORY_PREVIEW_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllCategories(false)}
                className="mt-3 ml-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Show fewer
              </button>
            )}
          </div>

          {hasSubcategories && (
            <div>
              <label className={labelClass}>Subcategory *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {subCategories.map((subcategory) => {
                  const isSelected = form.categoryId === subcategory.id;
                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => handleSubcategorySelect(subcategory.id)}
                      className={`text-left p-3 rounded-lg border text-sm transition-colors ${isSelected
                          ? 'border-blue-bright bg-blue-bright/10'
                          : 'border-[var(--border-color)] hover:border-blue-bright/40'
                        }`}
                    >
                      {getCategoryDisplayName(subcategory.name)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!hasSubcategories && selectedCategoryId && (
            <p className="text-sm text-[var(--text-secondary)]">
              This category has no subcategories. It will be used directly.
            </p>
          )}

          <div>
            <label className={labelClass}>Ad name *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="For example: CAT 320 2019 excavator"
            />
          </div>
        </div>
      </div>

      {form.categoryId && (
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Details</h2>
          {isTemplateLoading ? (
            <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
              <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading form fields...</span>
            </div>
          ) : template ? (
            <DynamicForm
              categoryId={form.categoryId}
              template={template}
              values={form.dynamicAttributes}
              onChange={(values) => setForm((prev) => ({ ...prev, dynamicAttributes: values }))}
            />
          ) : (
            <p className="text-[var(--text-secondary)] text-sm">
              Additional fields are not configured for this category yet.
            </p>
          )}
        </div>
      )}

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Description</h2>
        <div>
          <label className={labelClass}>Detailed description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            className={inputClass}
            placeholder="Describe the equipment, its condition, and key features..."
          />
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Country</label>
            <select
              name="countryId"
              value={form.countryId}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Choose country</option>
              {countries?.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newCountryName}
                onChange={(event) => setNewCountryName(event.target.value)}
                placeholder="Add new country"
                className={inputClass}
                disabled={!user}
              />
              <button
                type="button"
                onClick={handleCreateCountry}
                disabled={!newCountryName.trim() || isCreatingCountry || !user}
                className="px-3 py-2 rounded-md border border-[var(--border-color)] text-xs disabled:opacity-50"
              >
                {isCreatingCountry ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>City</label>
            <select
              name="cityId"
              value={form.cityId}
              onChange={handleChange}
              disabled={!form.countryId}
              className={`${selectClass} disabled:opacity-50`}
            >
              <option value="">Choose city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newCityName}
                onChange={(event) => setNewCityName(event.target.value)}
                placeholder="Add new city"
                className={inputClass}
                disabled={!form.countryId || !user}
              />
              <button
                type="button"
                onClick={handleCreateCity}
                disabled={!form.countryId || !newCityName.trim() || isCreatingCity || !user}
                className="px-3 py-2 rounded-md border border-[var(--border-color)] text-xs disabled:opacity-50"
              >
                {isCreatingCity ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-lg gradient-cta text-white font-medium hover:opacity-90 transition-opacity"
        >
          Next: Photos and videos →
        </button>
      </div>
    </div>
  );
}
