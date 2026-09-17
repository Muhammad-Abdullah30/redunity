import React, { useState, useRef, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2';
  const normalStyles = 'border-gray-200 focus:border-brand-red focus:ring-brand-red/20';
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
  const disabledStyles = 'bg-gray-100 cursor-not-allowed opacity-50';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${props.disabled ? disabledStyles : ''} ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export const Select: React.FC<{
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  required?: boolean;
  size?: 'sm' | 'md';
}> = ({
  label,
  error,
  options,
  className = '',
  value = '',
  onChange,
  disabled,
  name,
  id,
  required,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? options[0]?.label ?? 'Select...';
  const isPlaceholder = !selectedOption || selectedOption.value === '';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    setIsOpen(false);
    if (!onChange) return;
    // Call onChange directly with a synthetic-event-compatible object
    onChange({
      target: { value: optionValue, name: name ?? '' }
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  const triggerBorder = error
    ? 'border-red-500 ring-2 ring-red-500/20'
    : isOpen
    ? 'border-red-500 ring-2 ring-red-500/20'
    : 'border-slate-200 hover:border-red-300 shadow-sm';

  const triggerPadding = size === 'sm' ? 'pl-3 pr-2.5 py-1.5' : 'pl-4 pr-3 py-3';
  const triggerText = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          className="block text-sm font-semibold text-slate-700 mb-2 cursor-pointer"
          onClick={() => !disabled && setIsOpen((v) => !v)}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((v) => !v)}
          disabled={disabled}
          className={`w-full flex items-center justify-between bg-white rounded-xl border
            transition-all duration-200 focus:outline-none ${triggerPadding} ${triggerText}
            ${triggerBorder}
            ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <span className={isPlaceholder ? 'text-slate-400' : 'text-slate-800 font-medium'}>
            {displayLabel}
          </span>
          <svg
            className={`w-4 h-4 text-red-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Dropdown List */}
        {isOpen && (
          <div
            className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
            style={{
              animation: 'selectDropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <ul className="max-h-56 overflow-y-auto py-1 scrollbar-none">
              {options.map((option) => {
                const isSelected = option.value === value;
                const isEmpty = option.value === '';
                return (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100
                      ${isSelected
                        ? 'bg-red-50 text-red-600 font-semibold'
                        : isEmpty
                        ? 'text-slate-400 hover:bg-slate-50'
                        : 'text-slate-700 hover:bg-red-50 hover:text-red-600'
                      }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && !isEmpty && (
                      <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};