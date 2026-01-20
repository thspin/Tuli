import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options?: Array<{ value: string; label: string; disabled?: boolean }>;
    placeholder?: string;
    children?: React.ReactNode;
}

export default function Select({
    label,
    error,
    hint,
    options,
    placeholder,
    className = '',
    children,
    ...props
}: SelectProps) {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="
                    text-[11px] font-bold text-white/70 
                    uppercase tracking-[0.15em] ml-1
                    block
                ">
                    {label.includes('*') ? (
                        <>
                            {label.replace(' *', '').replace('*', '')}
                            <span className="text-red-400 ml-0.5">*</span>
                        </>
                    ) : label}
                </label>
            )}
            <div className="relative">
                <select
                    className={`
                        w-full px-5 py-4 pr-12
                        glass-input
                        rounded-2xl
                        text-base text-white font-medium
                        appearance-none
                        cursor-pointer
                        focus:ring-2 focus:ring-blue-500/30
                        transition-all duration-300
                        ${error
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                            : ''
                        }
                        ${!props.value && placeholder ? 'text-white/40' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-slate-800 text-white/40">
                            {placeholder}
                        </option>
                    )}
                    {/* Support both children and options prop */}
                    {children ? children : options?.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className="bg-slate-800 text-white"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    <span className="material-symbols-outlined text-xl">expand_more</span>
                </div>
            </div>
            {hint && !error && (
                <p className="text-xs text-white/40 ml-1">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-400 ml-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </p>
            )}
        </div>
    );
}

// Multi-select variant (checkboxes style)
interface MultiSelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface MultiSelectProps {
    label?: string;
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    error?: string;
    className?: string;
}

export function MultiSelect({
    label,
    options,
    value,
    onChange,
    error,
    className = '',
}: MultiSelectProps) {
    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    return (
        <div className={`w-full space-y-2 ${className}`}>
            {label && (
                <label className="
                    text-[11px] font-bold text-white/60 
                    uppercase tracking-[0.15em] ml-1
                    block
                ">
                    {label}
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleOption(option.value)}
                            className={`
                                px-4 py-2.5 rounded-xl
                                flex items-center gap-2
                                text-sm font-medium
                                transition-all duration-300
                                border
                                ${isSelected
                                    ? 'bg-blue-500/30 border-blue-500/50 text-blue-300'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                                }
                            `}
                        >
                            {option.icon}
                            {option.label}
                            {isSelected && (
                                <span className="material-symbols-outlined text-sm">check</span>
                            )}
                        </button>
                    );
                })}
            </div>
            {error && (
                <p className="text-xs text-red-400 ml-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </p>
            )}
        </div>
    );
}
