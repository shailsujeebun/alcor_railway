'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Пошук...', className }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (val: string) => {
    setLocal(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), 300);
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-dim" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-card !bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-gray-dim focus:outline-none focus:ring-2 focus:ring-blue-bright/40 transition-shadow"
      />
      {local && (
        <button onClick={() => handleChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-dim hover:text-[var(--text-primary)]">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
