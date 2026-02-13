'use client';

import React from 'react';

import { LucideIcon } from 'lucide-react';

interface FlatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
}

const FlatInput: React.FC<FlatInputProps> = ({
  label,
  error,
  icon: Icon,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      <label className="text-xs font-medium text-gray-500">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}

        <input
          {...props}
          className={`
            w-full rounded-xl py-3 text-sm
            bg-gray-100 text-gray-800
            placeholder-gray-400
            transition
            focus:bg-gray-50
            focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]
            ${Icon ? 'pl-11 pr-4' : 'px-4'}
            ${error ? 'bg-red-50 focus:shadow-[0_0_0_2px_rgba(220,38,38,0.2)]' : ''}
          `}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default FlatInput;
