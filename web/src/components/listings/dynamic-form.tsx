'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormField as TemplateField } from '@/lib/api';
import {
  createBrandOption,
  createModelOption,
  getBrandOptions,
  getModelOptions,
  resolveDbOptions,
} from '@/lib/api';
import {
  collectDependentFieldKeys,
  evaluateRuleTree,
  getChildDependencyMap,
} from '@/lib/dependencyEngine';
import type { FieldOption } from '@/lib/schemaTypes';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from '@/components/providers/translation-provider';
import { tLabel, tGroup, tOption, tPlaceholder, tFieldTypeLabel } from '@/lib/template-i18n';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface DynamicFormProps {
  categoryId: string;
  template:
  | {
    fields: TemplateField[];
    category?: { id: string; slug: string; hasEngine?: boolean };
  }
  | undefined;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  /** Called whenever brand / model / year selections change with their display labels */
  onTitleParts?: (parts: { brand: string; model: string; year: string }) => void;
}

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-blue-bright outline-none transition-colors';
const selectClass = `${inputClass} appearance-none`;
const IMPORTANT_REQUIRED_DYNAMIC_KEYS = new Set([
  'brand',
  'model',
  'year_of_manufacture_year',
  'year',
  'condition',
]);
const HIDDEN_DYNAMIC_KEYS = new Set(['category', 'category_id', 'right_hand_drive']);
const SCREENSHOT_MONTH_PAIR_SLUGS = new Set([
  'combines',
  'grain-harvesters',
  'forage-harvesters',
  'beet-harvesters',
  'combine-headers',
  'grain-headers',
  'corn-headers',
  'sunflower-headers',
]);

function parseSelection(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFieldSpanClass(fieldComponent: string | undefined) {
  if (fieldComponent === 'textarea' || fieldComponent === 'checkbox') {
    return 'md:col-span-2';
  }
  return '';
}

function normalizeLabel(label: string): string {
  return String(label ?? '').replace(/\s*\*+\s*$/, '').trim();
}

function stripYearMonthSuffix(label: string): string {
  return normalizeLabel(label).replace(/\s*\((year|month)\)\s*$/i, '').trim();
}

const CALENDAR_WEEKDAYS: Record<string, string[]> = {
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

function formatCalendarValue(date: Date, locale: string) {
  return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildCalendarDays(viewDate: Date) {
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startWeekday = (startOfMonth.getDay() + 6) % 7;
  const startDate = new Date(startOfMonth);
  startDate.setDate(startOfMonth.getDate() - startWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

const CALENDAR_MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function normalizeComponent(field: TemplateField): string {
  if (field.component) return field.component;
  const type = String(field.type ?? '').toUpperCase();
  if (type === 'NUMBER') return 'number';
  if (type === 'SELECT' || type === 'MULTISELECT') return 'select';
  if (type === 'RADIO') return 'radio';
  if (type === 'CHECKBOX_GROUP' || type === 'BOOLEAN') return 'checkbox';
  if (type === 'RICHTEXT') return 'textarea';
  if (type === 'DATE') return 'date';
  if (type === 'COLOR') return 'color';
  return 'text';
}

function shouldAllowFutureYears(field: TemplateField): boolean {
  const key = String(field.key ?? '').toLowerCase();
  const label = String(field.label ?? '').toLowerCase();
  return (
    key.includes('technical_inspection') ||
    key.includes('valid_till') ||
    key.includes('expiry') ||
    key.includes('expiration') ||
    key.includes('expires') ||
    (key.includes('until') && key.endsWith('_year')) ||
    label.includes('valid till') ||
    label.includes('expiry') ||
    label.includes('expiration') ||
    label.includes('expires') ||
    (label.includes('until') && label.includes('year'))
  );
}

function expandYearOptionsForFuture(
  field: TemplateField,
  options: FieldOption[],
): FieldOption[] {
  if (!shouldAllowFutureYears(field)) return options;

  const yearLike = options.every((option) => /^\d{4}$/.test(String(option.value)));
  if (!yearLike) return options;

  const currentYear = new Date().getUTCFullYear();
  const minYear = currentYear - 80;
  const maxYear = currentYear + 15;
  const merged = new Map<string, FieldOption>();

  for (const option of options) {
    merged.set(String(option.value), {
      id: option.id ?? String(option.value),
      value: String(option.value),
      label: String(option.label ?? option.value),
    });
  }

  for (let year = maxYear; year >= minYear; year -= 1) {
    const value = String(year);
    if (!merged.has(value)) {
      merged.set(value, { id: value, value, label: value });
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => Number(b.value) - Number(a.value),
  );
}

function dedupeOptions(options: FieldOption[]): FieldOption[] {
  const seen = new Set<string>();
  const deduped: FieldOption[] = [];
  for (const option of options) {
    const value = String(option.value ?? '').trim();
    const label = String(option.label ?? '').trim();
    const signature = `${value.toLowerCase()}|${label.toLowerCase()}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    deduped.push(option);
  }
  return deduped;
}

function OptionChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${active
        ? 'bg-blue-bright/20 text-blue-bright border-blue-bright/50'
        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-bright/40 hover:text-[var(--text-primary)]'
        }`}
    >
      {label}
    </button>
  );
}

export function DynamicForm({ categoryId, template, values, onChange, onTitleParts }: DynamicFormProps) {
  const { locale } = useTranslation();
  const [formValues, setFormValues] = useState<Record<string, string>>(values);
  const [optionsMap, setOptionsMap] = useState<Record<string, FieldOption[]>>({});
  const optionsCacheRef = useRef<Map<string, FieldOption[]>>(new Map());
  const [customInputMap, setCustomInputMap] = useState<Record<string, string>>({});
  const [customOpenMap, setCustomOpenMap] = useState<Record<string, boolean>>({});
  const [customSubmitting, setCustomSubmitting] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [calendarOpenFor, setCalendarOpenFor] = useState<string | null>(null);
  const [calendarViewMap, setCalendarViewMap] = useState<Record<string, string>>({});
  const [calendarDayMap, setCalendarDayMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormValues(values);
  }, [values, categoryId]);

  const fields = useMemo(() => {
    const source = template?.fields ?? [];
    return [...source]
      .filter((field) => !HIDDEN_DYNAMIC_KEYS.has(String(field.key ?? '').trim().toLowerCase()))
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  }, [template]);

  const fieldsByKey = useMemo(
    () =>
      new Map(fields.map((field) => [String(field.key ?? ''), field])),
    [fields],
  );

  const dependencyMap = useMemo(() => getChildDependencyMap(fields), [fields]);

  const monthPairFieldKeys = useMemo(() => {
    const keys = new Set(fields.map((field) => String(field.key ?? '')));
    const pairs = new Set<string>();

    for (const field of fields) {
      const key = String(field.key ?? '');
      if (!key.endsWith('_year')) continue;
      const monthKey = `${key.slice(0, -5)}_month`;
      if (keys.has(monthKey)) {
        pairs.add(key);
        pairs.add(monthKey);
      }
    }

    return pairs;
  }, [fields]);

  const calendarYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 121 }, (_, index) => currentYear + 15 - index);
  }, []);

  const shouldUseCalendarMonthPairs = useMemo(() => {
    const slug = String(template?.category?.slug ?? '').toLowerCase();
    return !SCREENSHOT_MONTH_PAIR_SLUGS.has(slug);
  }, [template?.category?.slug]);

  const context = useMemo(
    () => ({
      category: {
        id: template?.category?.id ?? categoryId,
        hasEngine: Boolean(template?.category?.hasEngine),
        slug: template?.category?.slug,
      },
    }),
    [template, categoryId],
  );

  const visibleFields = useMemo(() => {
    return fields.filter((field) => evaluateRuleTree(field.visibleIf, formValues, context));
  }, [fields, formValues, context]);

  const hasRequiredParents = (field: TemplateField, currentValues: Record<string, string>) => {
    const parents = field.dependsOn ?? [];
    if (parents.length === 0) return true;
    return parents.every((key) => {
      const value = currentValues[key];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });
  };

  const fetchFieldOptions = async (
    field: TemplateField,
    currentValues: Record<string, string>,
  ) => {
    const component = normalizeComponent(field);
    if (component !== 'select') return;

    const dataSource = field.dataSource ?? 'static';
    const depState = (field.dependsOn ?? []).reduce<Record<string, string>>((acc, depKey) => {
      acc[depKey] = currentValues[depKey];
      return acc;
    }, {});

    const cacheKey = `${field.key}:${JSON.stringify(depState)}`;
    const cached = optionsCacheRef.current.get(cacheKey);
    if (cached) {
      setOptionsMap((prev) => ({ ...prev, [field.key]: cached }));
      return;
    }

    if (!hasRequiredParents(field, currentValues)) {
      setOptionsMap((prev) => ({ ...prev, [field.key]: [] }));
      return;
    }

    let nextOptions: FieldOption[] = [];

    if (dataSource === 'static') {
      nextOptions = field.staticOptions ?? field.options ?? [];
    }

    if (dataSource === 'api') {
      if (field.optionsEndpoint) {
        const endpoint = field.optionsEndpoint.startsWith('http')
          ? field.optionsEndpoint
          : `${API_BASE}${field.optionsEndpoint.startsWith('/') ? '' : '/'}${field.optionsEndpoint}`;
        const url = new URL(endpoint);
        for (const [key, value] of Object.entries(depState)) {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
          }
        }

        const response = await fetch(url.toString(), {
          credentials: 'include',
        });
        const json = await response.json();
        const list = Array.isArray(json) ? json : [];
        const valueKey = field.optionsMapping?.valueKey ?? 'value';
        const labelKey = field.optionsMapping?.labelKey ?? 'label';
        nextOptions = list.map((item: any, index: number) => ({
          id: String(item.id ?? index),
          value: String(item[valueKey] ?? ''),
          label: String(item[labelKey] ?? item[valueKey] ?? ''),
        }));
      } else if (field.key === 'brand') {
        nextOptions = await getBrandOptions(
          currentValues.category || currentValues.categoryId || categoryId,
        );
      } else if (field.key === 'model') {
        nextOptions = await getModelOptions(currentValues.brand || currentValues.brandId);
      }
    }

    if (dataSource === 'db') {
      nextOptions = await resolveDbOptions({
        optionsQuery: field.optionsQuery,
        depends: depState,
      });
    }

    optionsCacheRef.current.set(cacheKey, nextOptions);
    setOptionsMap((prev) => ({ ...prev, [field.key]: nextOptions }));
  };

  useEffect(() => {
    let canceled = false;

    async function load() {
      for (const field of visibleFields) {
        if (normalizeComponent(field) !== 'select') continue;
        if (canceled) return;
        try {
          await fetchFieldOptions(field, formValues);
        } catch (err) {
          console.warn(`[DynamicForm] Failed to load options for "${field.key}":`, err);
        }
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [visibleFields, formValues]);

  // Notify parent about brand / model / year label changes for auto-title
  useEffect(() => {
    if (!onTitleParts) return;
    const brandValue = formValues.brand || '';
    const modelValue = formValues.model || '';
    const yearValue = formValues.year_of_manufacture_year || formValues.year || '';

    const brandOptions = optionsMap.brand ?? [];
    const modelOptions = optionsMap.model ?? [];

    const brandLabel = brandOptions.find((o) => o.value === brandValue)?.label ?? brandValue;
    const modelLabel = modelOptions.find((o) => o.value === modelValue)?.label ?? modelValue;

    onTitleParts({ brand: brandLabel, model: modelLabel, year: yearValue });
  }, [formValues.brand, formValues.model, formValues.year_of_manufacture_year, formValues.year, optionsMap.brand, optionsMap.model, onTitleParts]);

  const handleFieldChange = (key: string, value: string) => {
    const nextValues = { ...formValues, [key]: value };
    const changedField = fields.find((field) => field.key === key);

    const dependentKeys = collectDependentFieldKeys(key, dependencyMap);
    for (const childKey of dependentKeys) {
      nextValues[childKey] = '';
    }

    for (const resetKey of changedField?.resetOnChange ?? []) {
      nextValues[resetKey] = '';
    }

    setFormValues(nextValues);
    onChange(nextValues);
  };

  const handleMonthPairChange = (yearKey: string, dateValue: string) => {
    const prefix = yearKey.slice(0, -5);
    const monthKey = `${prefix}_month`;
    const [year = '', month = '', day = '01'] = dateValue.split('-');

    const nextValues = {
      ...formValues,
      [yearKey]: year,
      [monthKey]: month,
    };

    setFormValues(nextValues);
    setCalendarDayMap((prev) => ({ ...prev, [yearKey]: day }));
    setCalendarViewMap((prev) => ({ ...prev, [yearKey]: `${year || '2000'}-${month || '01'}-01` }));
    onChange(nextValues);
  };

  const sectionEntries = useMemo(() => {
    if (!visibleFields.length) return [];

    const grouped = new Map<string, TemplateField[]>();
    const seenKeys = new Set<string>();
    const seenSignatures = new Set<string>();
    const defaultSectionName = 'Additional details';

    for (const field of visibleFields) {
      const section = field.group || field.section || defaultSectionName;
      const normalizedKey = String(field.key ?? '').trim().toLowerCase();
      const signature = [
        section.toLowerCase(),
        normalizeLabel(field.label).toLowerCase(),
        normalizeComponent(field).toLowerCase(),
      ].join('|');

      if (normalizedKey && seenKeys.has(normalizedKey)) continue;
      if (seenSignatures.has(signature)) continue;

      if (normalizedKey) seenKeys.add(normalizedKey);
      seenSignatures.add(signature);
      const current = grouped.get(section) ?? [];
      current.push(field);
      grouped.set(section, current);
    }

    return Array.from(grouped.entries());
  }, [visibleFields]);

  useEffect(() => {
    if (!sectionEntries.length) {
      setOpenSections(new Set());
      return;
    }
    const keys = sectionEntries.map(([name]) => name);
    setOpenSections(new Set(keys));
  }, [sectionEntries]);

  if (!fields.length) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
        {locale === 'uk' ? 'Додаткових полів для цієї категорії не налаштовано.' : 'No additional fields configured for this category.'}
      </div>
    );
  }

  const renderFieldControl = (field: TemplateField) => {
    const value = formValues[field.key] || '';
    const baseOptions = optionsMap[field.key] ?? field.staticOptions ?? field.options ?? [];
    const options = dedupeOptions(expandYearOptionsForFuture(field, baseOptions));
    const component = normalizeComponent(field);
    const isDisabled = !hasRequiredParents(field, formValues);

    const isRequired = IMPORTANT_REQUIRED_DYNAMIC_KEYS.has(field.key);
    const labelText = normalizeLabel(field.label);
    const localizedLabel = tLabel(labelText, locale);
    const localizedInputPlaceholder = tPlaceholder(
      field.placeholder || labelText,
      locale,
    );

    switch (component) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={inputClass}
            placeholder={localizedInputPlaceholder}
            required={isRequired}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={inputClass}
            placeholder={localizedInputPlaceholder}
            required={isRequired}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder={localizedInputPlaceholder}
            required={isRequired}
          />
        );

      case 'checkbox': {
        const optionList = options.length > 0 ? options : [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ];

        if (optionList.length > 2) {
          const selectedValues = parseSelection(value);
          return (
            <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 p-3">
              {optionList.map((option) => (
                <OptionChip
                  key={`${field.key}:${option.value}`}
                  active={selectedValues.includes(option.value)}
                  label={tOption(option.label, locale)}
                  onClick={() => {
                    const next = selectedValues.includes(option.value)
                      ? selectedValues.filter((item) => item !== option.value)
                      : [...selectedValues, option.value];
                    handleFieldChange(field.key, next.join(','));
                  }}
                />
              ))}
            </div>
          );
        }

        const current = value === 'true' ? 'true' : value === 'false' ? 'false' : '';
        return (
          <div className="flex flex-wrap gap-2">
            <OptionChip active={current === 'true'} label={tOption('Yes', locale)} onClick={() => handleFieldChange(field.key, 'true')} />
            <OptionChip active={current === 'false'} label={tOption('No', locale)} onClick={() => handleFieldChange(field.key, 'false')} />
            <OptionChip active={current === ''} label={tOption('Not set', locale)} onClick={() => handleFieldChange(field.key, '')} />
          </div>
        );
      }

      case 'radio':
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <OptionChip
                key={`${field.key}:${option.value}`}
                active={value === option.value}
                label={tOption(option.label, locale)}
                onClick={() => handleFieldChange(field.key, option.value)}
              />
            ))}
          </div>
        );

      case 'color':
        return (
          <div className="flex flex-wrap gap-3">
            {options.map((option) => (
              <button
                key={`${field.key}:${option.value}`}
                type="button"
                className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${value === option.value ? 'border-blue-bright scale-110 shadow-md ring-2 ring-blue-bright/20' : 'border-black/10 shadow-sm'
                  }`}
                style={{ backgroundColor: option.value }}
                title={tOption(option.label, locale)}
                aria-label={tOption(option.label, locale)}
                onClick={() => handleFieldChange(field.key, option.value)}
              />
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={inputClass}
            required={isRequired}
          />
        );

      case 'month':
        return (
          <input
            type="month"
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={inputClass}
            required={isRequired}
          />
        );

      case 'select':
        return (
          <div className="space-y-2">
            <div className="relative">
              <select
                value={value}
                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                className={`${selectClass} disabled:opacity-50`}
                required={isRequired}
                disabled={isDisabled}
              >
                <option value="">{tPlaceholder(`Choose ${labelText.toLowerCase()}`, locale)}</option>
                {options.map((option) => (
                  <option key={`${field.key}:${option.value}`} value={option.value}>
                    {tOption(option.label, locale)}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {(field.key === 'brand' || field.key === 'model') && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="text-xs text-blue-bright hover:underline"
                  onClick={() =>
                    setCustomOpenMap((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                  }
                >
                  + {locale === 'uk' ? `Додати нову ${localizedLabel.toLowerCase()}` : `Add new ${field.label.toLowerCase()}`}
                </button>

                {customOpenMap[field.key] && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInputMap[field.key] ?? ''}
                      onChange={(event) =>
                        setCustomInputMap((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className={inputClass}
                      placeholder={tPlaceholder(`New ${field.label.toLowerCase()}`, locale)}
                    />
                    <button
                      type="button"
                      disabled={Boolean(customSubmitting[field.key])}
                      className="px-3 py-2 rounded-md border border-[var(--border-color)] text-xs hover:border-blue-bright"
                      onClick={async () => {
                        const name = (customInputMap[field.key] ?? '').trim();
                        if (!name) return;
                        setCustomSubmitting((prev) => ({ ...prev, [field.key]: true }));
                        try {
                          let created: FieldOption | null = null;
                          if (field.key === 'brand') {
                            created = await createBrandOption({
                              name,
                              categoryId:
                                formValues.category || formValues.categoryId || categoryId,
                            });
                          }
                          if (field.key === 'model') {
                            created = await createModelOption({
                              name,
                              brandId: formValues.brand || formValues.brandId,
                              categoryId:
                                formValues.category || formValues.categoryId || categoryId,
                            });
                          }
                          if (!created) return;

                          optionsCacheRef.current.forEach((_val, key) => {
                            if (key.startsWith(`${field.key}:`)) optionsCacheRef.current.delete(key);
                          });
                          const nextOptions = [...(optionsMap[field.key] ?? options), created];
                          setOptionsMap((prev) => ({ ...prev, [field.key]: nextOptions }));
                          setCustomInputMap((prev) => ({ ...prev, [field.key]: '' }));
                          setCustomOpenMap((prev) => ({ ...prev, [field.key]: false }));
                          handleFieldChange(field.key, created.value);
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Failed to create option');
                        } finally {
                          setCustomSubmitting((prev) => ({ ...prev, [field.key]: false }));
                        }
                      }}
                    >
                      {customSubmitting[field.key] ? (locale === 'uk' ? 'Збереження...' : 'Saving...') : (locale === 'uk' ? 'Зберегти' : 'Save')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              size={18}
            />
            <input
              type="text"
              value={value}
              onChange={(event) => handleFieldChange(field.key, event.target.value)}
              className={`${inputClass} pl-10`}
              placeholder={localizedInputPlaceholder}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {sectionEntries.map(([sectionName, sectionFields]) => (
        <section
          key={sectionName}
          className={`rounded-xl border bg-[var(--bg-secondary)]/15 transition-colors ${openSections.has(sectionName)
            ? 'overflow-visible border-blue-bright/40'
            : 'overflow-hidden border-[var(--border-color)] hover:border-blue-bright/30'
            }`}
        >
          <button
            type="button"
            onClick={() =>
              setOpenSections((prev) => {
                const next = new Set(prev);
                if (next.has(sectionName)) next.delete(sectionName);
                else next.add(sectionName);
                return next;
              })
            }
            className="w-full px-5 py-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-center w-full text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              {tGroup(sectionName, locale)}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[var(--text-secondary)] shrink-0 transition-transform ${openSections.has(sectionName) ? 'rotate-180' : 'rotate-0'
                }`}
            />
          </button>

          <div
            className={`transition-all duration-300 ease-out ${openSections.has(sectionName) ? 'max-h-[3200px] overflow-visible opacity-100' : 'max-h-0 overflow-hidden opacity-0'
              }`}
          >
            <div className="p-4 sm:p-5 border-t border-[var(--border-color)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {sectionFields.map((field) => {
                  const fieldKey = String(field.key ?? '');
                  const isMonthPairYearField = fieldKey.endsWith('_year') && monthPairFieldKeys.has(fieldKey);
                  const isMonthPairMonthField = fieldKey.endsWith('_month') && monthPairFieldKeys.has(fieldKey);

                  if (isMonthPairMonthField) {
                    return null;
                  }

                  if (isMonthPairYearField) {
                    const monthKey = `${fieldKey.slice(0, -5)}_month`;
                    const monthField = fieldsByKey.get(monthKey);
                    const yearOptions = dedupeOptions(
                      expandYearOptionsForFuture(
                        field,
                        optionsMap[fieldKey] ?? field.staticOptions ?? field.options ?? [],
                      ),
                    );
                    const monthOptions = monthField
                      ? dedupeOptions(
                          expandYearOptionsForFuture(
                            monthField,
                            optionsMap[monthKey] ?? monthField.staticOptions ?? monthField.options ?? [],
                          ),
                        )
                      : [];
                    const calendarValue = formValues[fieldKey] && formValues[monthKey]
                      ? `${formValues[fieldKey]}-${formValues[monthKey]}-${calendarDayMap[fieldKey] ?? '01'}`
                      : '';
                    const required = IMPORTANT_REQUIRED_DYNAMIC_KEYS.has(field.key);
                    const labelText = stripYearMonthSuffix(field.label);
                    const localizedLabel = tLabel(labelText, locale);

                    if (!shouldUseCalendarMonthPairs) {
                      return (
                        <div key={field.key} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-sm font-medium text-[var(--text-primary)]">
                              {localizedLabel}
                              {required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                              {tFieldTypeLabel('select', locale)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <select
                                value={formValues[fieldKey] || ''}
                                onChange={(event) => handleFieldChange(fieldKey, event.target.value)}
                                className={selectClass}
                                required={required}
                              >
                                <option value="">{tPlaceholder('Year', locale)}</option>
                                {yearOptions.map((option) => (
                                  <option key={`${fieldKey}:${option.value}`} value={option.value}>
                                    {tOption(option.label, locale)}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            <div className="relative">
                              <select
                                value={formValues[monthKey] || ''}
                                onChange={(event) => handleFieldChange(monthKey, event.target.value)}
                                className={selectClass}
                              >
                                <option value="">{tPlaceholder('Month', locale)}</option>
                                {monthOptions.map((option) => (
                                  <option key={`${monthKey}:${option.value}`} value={option.value}>
                                    {tOption(option.label, locale)}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const viewDateSource = calendarViewMap[fieldKey] || calendarValue || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
                    const viewDate = new Date(viewDateSource);
                    const safeViewDate = Number.isNaN(viewDate.getTime()) ? new Date() : viewDate;
                    const calendarDays = buildCalendarDays(safeViewDate);
                    const monthLabel = safeViewDate.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
                      month: 'long',
                      year: 'numeric',
                    });
                    const selectedValue = calendarValue;

                    return (
                      <div key={field.key} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium text-[var(--text-primary)]">
                            {localizedLabel}
                            {required && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                            {tFieldTypeLabel('date', locale)}
                          </span>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarOpenFor((prev) => (prev === fieldKey ? null : fieldKey))
                            }
                            className={`${inputClass} flex items-center justify-between text-left`}
                          >
                            <span className={selectedValue ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]/70'}>
                              {selectedValue
                                ? formatCalendarValue(new Date(selectedValue), locale)
                                : tPlaceholder(`Choose ${labelText.toLowerCase()}`, locale)}
                            </span>
                            <CalendarDays size={18} className="text-[var(--text-secondary)]" />
                          </button>

                          {calendarOpenFor === fieldKey && (
                            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 w-full min-w-[300px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-2xl">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  className="rounded-md border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:border-blue-bright/40 hover:text-[var(--text-primary)]"
                                  onClick={() => {
                                    const next = new Date(safeViewDate);
                                    next.setMonth(next.getMonth() - 1);
                                    setCalendarViewMap((prev) => ({
                                      ...prev,
                                      [fieldKey]: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`,
                                    }));
                                  }}
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <div className="text-sm font-semibold text-[var(--text-primary)]">{monthLabel}</div>
                                <button
                                  type="button"
                                  className="rounded-md border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:border-blue-bright/40 hover:text-[var(--text-primary)]"
                                  onClick={() => {
                                    const next = new Date(safeViewDate);
                                    next.setMonth(next.getMonth() + 1);
                                    setCalendarViewMap((prev) => ({
                                      ...prev,
                                      [fieldKey]: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`,
                                    }));
                                  }}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>

                              <div className="mb-4 grid grid-cols-2 gap-3">
                                <select
                                  value={safeViewDate.getMonth()}
                                  onChange={(event) => {
                                    const next = new Date(safeViewDate);
                                    next.setMonth(Number(event.target.value));
                                    setCalendarViewMap((prev) => ({
                                      ...prev,
                                      [fieldKey]: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`,
                                    }));
                                  }}
                                  className={`${selectClass} h-11 py-2`}
                                >
                                  {CALENDAR_MONTH_OPTIONS.map((monthName, index) => (
                                    <option key={monthName} value={index}>
                                      {tOption(monthName, locale)}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={safeViewDate.getFullYear()}
                                  onChange={(event) => {
                                    const next = new Date(safeViewDate);
                                    next.setFullYear(Number(event.target.value));
                                    setCalendarViewMap((prev) => ({
                                      ...prev,
                                      [fieldKey]: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`,
                                    }));
                                  }}
                                  className={`${selectClass} h-11 py-2`}
                                >
                                  {calendarYearOptions.map((year) => (
                                    <option key={year} value={year}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="mb-3 grid grid-cols-7 gap-2 px-1 text-center text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                {(CALENDAR_WEEKDAYS[locale] ?? CALENDAR_WEEKDAYS.en).map((day) => (
                                  <div key={day} className="py-1">
                                    {day}
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-2 rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/20 p-2">
                                {calendarDays.map((day) => {
                                  const dayValue = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                  const isCurrentMonth = day.getMonth() === safeViewDate.getMonth();
                                  const isSelected = selectedValue === dayValue;

                                  return (
                                    <button
                                      key={dayValue}
                                      type="button"
                                      onClick={() => {
                                        handleMonthPairChange(fieldKey, dayValue);
                                        setCalendarOpenFor(null);
                                      }}
                                      className={cn(
                                        'flex h-10 items-center justify-center rounded-lg text-sm transition-colors',
                                        isSelected
                                          ? 'bg-blue-bright text-white'
                                          : isCurrentMonth
                                            ? 'text-[var(--text-primary)] hover:bg-white/10'
                                            : 'text-[var(--text-secondary)]/40 hover:bg-white/5',
                                      )}
                                    >
                                      {day.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const required = IMPORTANT_REQUIRED_DYNAMIC_KEYS.has(field.key);
                  const labelText = normalizeLabel(field.label);
                  const localizedLabel = tLabel(labelText, locale);
                  return (
                    <div key={field.key} className={`space-y-2 ${getFieldSpanClass(normalizeComponent(field))}`}>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">
                          {localizedLabel}
                          {required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                          {tFieldTypeLabel(normalizeComponent(field), locale)}
                        </span>
                      </div>

                      {renderFieldControl(field)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
