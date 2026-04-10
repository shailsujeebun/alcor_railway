'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SearchableSelectOption[];
  searchPlaceholder?: string;
  emptyText?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  inputClassName?: string;
}

export function SearchableSelect({
  value,
  onChange,
  placeholder,
  options,
  searchPlaceholder = 'Пошук...',
  emptyText = 'Немає результатів',
  triggerClassName,
  dropdownClassName,
  inputClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          triggerClassName,
        )}
      >
        <span className={selectedOption ? 'text-[var(--text-primary)]' : 'text-muted-foreground'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            dropdownClassName,
          )}
        >
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
              placeholder={searchPlaceholder}
              className={cn(
                'w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--blue-bright)]',
                inputClassName,
              )}
            />
          </div>

          <div id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1 text-xs text-gray-400">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    setOpen(false);
                    setSearch('');
                    const nextValue = option.value === value ? '' : option.value;
                    requestAnimationFrame(() => {
                      onChange(nextValue);
                    });
                  }}
                  className="relative flex w-full items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  {option.value === value && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <span>{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
