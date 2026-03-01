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
import { ChevronDown, MapPin } from 'lucide-react';

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
}

type FieldValidation = {
  min?: number;
  max?: number;
  unit?: string;
  hint?: string;
};

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-blue-bright outline-none transition-colors';
const selectClass = `${inputClass} appearance-none`;

function parseSelection(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFieldHint(validation?: FieldValidation): string | null {
  if (!validation) return null;

  const parts: string[] = [];
  if (typeof validation.min === 'number') parts.push(`min ${validation.min}`);
  if (typeof validation.max === 'number') parts.push(`max ${validation.max}`);
  if (validation.unit) parts.push(`unit: ${validation.unit}`);
  if (validation.hint) parts.push(validation.hint);

  return parts.length > 0 ? parts.join(' • ') : null;
}

function getFieldSpanClass(fieldComponent: string | undefined) {
  if (fieldComponent === 'textarea' || fieldComponent === 'checkbox') {
    return 'md:col-span-2';
  }
  return '';
}

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

export function DynamicForm({ categoryId, template, values, onChange }: DynamicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(values);
  const [optionsMap, setOptionsMap] = useState<Record<string, FieldOption[]>>({});
  const optionsCacheRef = useRef<Map<string, FieldOption[]>>(new Map());
  const [customInputMap, setCustomInputMap] = useState<Record<string, string>>({});
  const [customOpenMap, setCustomOpenMap] = useState<Record<string, boolean>>({});
  const [customSubmitting, setCustomSubmitting] = useState<Record<string, boolean>>({});
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    setFormValues(values);
  }, [values, categoryId]);

  const fields = useMemo(() => {
    const source = template?.fields ?? [];
    return [...source].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  }, [template]);

  const dependencyMap = useMemo(() => getChildDependencyMap(fields), [fields]);

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
        nextOptions = await getBrandOptions(currentValues.category || currentValues.categoryId);
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
        await fetchFieldOptions(field, formValues);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [visibleFields, formValues]);

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

  const sectionEntries = useMemo(() => {
    if (!visibleFields.length) return [];

    const grouped = new Map<string, TemplateField[]>();
    const defaultSectionName = 'Additional details';

    for (const field of visibleFields) {
      const section = field.group || field.section || defaultSectionName;
      const current = grouped.get(section) ?? [];
      current.push(field);
      grouped.set(section, current);
    }

    return Array.from(grouped.entries());
  }, [visibleFields]);

  useEffect(() => {
    if (!sectionEntries.length) {
      setOpenSection(null);
      return;
    }
    const keys = sectionEntries.map(([name]) => name);
    setOpenSection((prev) => (prev && keys.includes(prev) ? prev : keys[0]));
  }, [sectionEntries]);

  if (!fields.length) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
        No additional fields configured for this category.
      </div>
    );
  }

  const renderFieldControl = (field: TemplateField) => {
    const value = formValues[field.key] || '';
    const validation = (field.validationRules ?? {}) as FieldValidation;
    const options = optionsMap[field.key] ?? field.staticOptions ?? field.options ?? [];
    const component = normalizeComponent(field);
    const isDisabled = !hasRequiredParents(field, formValues);

    switch (component) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={inputClass}
            placeholder={field.placeholder || field.label}
            required={Boolean(field.required || field.isRequired || evaluateRuleTree(field.requiredIf, formValues, context))}
          />
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(event) => handleFieldChange(field.key, event.target.value)}
              className={`${inputClass} ${validation.unit ? 'pr-14' : ''}`}
              placeholder={field.placeholder || field.label}
              required={Boolean(field.required || field.isRequired || evaluateRuleTree(field.requiredIf, formValues, context))}
              min={validation.min}
              max={validation.max}
            />
            {validation.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
                {validation.unit}
              </span>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder={field.placeholder || field.label}
            required={Boolean(field.required || field.isRequired || evaluateRuleTree(field.requiredIf, formValues, context))}
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
                  label={option.label}
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
            <OptionChip active={current === 'true'} label="Yes" onClick={() => handleFieldChange(field.key, 'true')} />
            <OptionChip active={current === 'false'} label="No" onClick={() => handleFieldChange(field.key, 'false')} />
            <OptionChip active={current === ''} label="Not set" onClick={() => handleFieldChange(field.key, '')} />
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
                label={option.label}
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
                title={option.label}
                aria-label={option.label}
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
            required={Boolean(field.required || field.isRequired || evaluateRuleTree(field.requiredIf, formValues, context))}
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
                required={Boolean(field.required || field.isRequired || evaluateRuleTree(field.requiredIf, formValues, context))}
                disabled={isDisabled}
              >
                <option value="">Choose {field.label.toLowerCase()}</option>
                {options.map((option) => (
                  <option key={`${field.key}:${option.value}`} value={option.value}>
                    {option.label}
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
                  + Add new {field.label.toLowerCase()}
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
                      placeholder={`New ${field.label.toLowerCase()}...`}
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
                      {customSubmitting[field.key] ? 'Saving...' : 'Save'}
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
              placeholder={field.placeholder || field.label}
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
          className={`rounded-xl border bg-[var(--bg-secondary)]/15 overflow-hidden transition-colors ${openSection === sectionName
            ? 'border-blue-bright/40'
            : 'border-[var(--border-color)] hover:border-blue-bright/30'
            }`}
        >
          <button
            type="button"
            onClick={() =>
              setOpenSection((current) => (current === sectionName ? null : sectionName))
            }
            className="w-full px-5 py-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-center w-full text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              {sectionName}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[var(--text-secondary)] shrink-0 transition-transform ${openSection === sectionName ? 'rotate-180' : 'rotate-0'
                }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${openSection === sectionName ? 'max-h-[3200px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="p-4 sm:p-5 border-t border-[var(--border-color)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {sectionFields.map((field) => {
                  const hint = formatFieldHint((field.validationRules ?? {}) as FieldValidation);
                  const required = Boolean(
                    field.required ||
                    field.isRequired ||
                    evaluateRuleTree(field.requiredIf, formValues, context),
                  );
                  return (
                    <div key={field.key} className={`space-y-2 ${getFieldSpanClass(normalizeComponent(field))}`}>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">
                          {field.label}
                          {required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                          {normalizeComponent(field)}
                        </span>
                      </div>

                      {renderFieldControl(field)}

                      {hint && <p className="text-xs text-[var(--text-secondary)]">{hint}</p>}
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
