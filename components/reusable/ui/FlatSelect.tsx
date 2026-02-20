'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ChevronDown,
  Search,
} from 'lucide-react';

interface Option {
  id: number | string;
  label: string;
}

interface FlatSelectProps {
  label: string;
  value: string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const FlatSelect: React.FC<FlatSelectProps> = ({
  label,
  value,
  options,
  placeholder = 'Select…',
  disabled,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => String(o.id) === value);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* LABEL */}
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {/* CONTROL */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between
          rounded-xl px-4 py-3.5
          text-sm font-medium
          bg-slate-100 
          border border-transparent
          transition-all duration-200
          hover:bg-slate-50 hover:border-slate-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
          ${open ? 'bg-white border-slate-200 shadow-sm' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`
            text-slate-500
            transition-transform duration-200
            ${open ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* DROPDOWN */}
      {open && !disabled && (
        <div
          className="
            absolute z-50 w-full mt-2
            rounded-2xl bg-white
            border border-slate-200
            shadow-xl shadow-slate-200/50
            overflow-hidden
          "
        >
          {/* SEARCH */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="
                w-full pl-11 pr-4 py-3.5
                text-sm font-medium text-slate-800
                bg-slate-50
                placeholder-slate-400
                outline-none border-none
                border-b border-slate-100
              "
            />
          </div>

          {/* OPTIONS */}
          <div className="max-h-56 overflow-y-auto py-1">
           {filtered.map((opt, index) => {
  const isSelected = String(opt.id) === value;

  return (
    <button
      key={`${opt.id}-${index}`}
      onClick={() => {
        onChange(String(opt.id));
        setOpen(false);
        setQuery('');
      }}
      className={`
        w-full text-left px-4 py-3
        text-sm font-medium
        transition-all duration-150
        ${
          isSelected
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }
      `}
    >
      {opt.label}
    </button>
  );
})}

            {filtered.length === 0 && (
              <p className="px-4 py-4 text-sm font-medium text-slate-400 text-center">
                No results found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlatSelect;