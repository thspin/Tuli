import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export default function Input({
    label,
    error,
    hint,
    icon,
    iconPosition = 'left',
    className = '',
    ...props
}: InputProps) {
    const hasIcon = !!icon;
    const iconPaddingLeft = hasIcon && iconPosition === 'left' ? 'pl-12' : 'pl-5';
    const iconPaddingRight = hasIcon && iconPosition === 'right' ? 'pr-12' : 'pr-5';

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
                {icon && iconPosition === 'left' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        w-full py-4 
                        ${iconPaddingLeft} ${iconPaddingRight}
                        glass-input
                        rounded-2xl
                        text-base text-white font-medium
                        placeholder:text-white/40
                        focus:ring-2 focus:ring-blue-500/30
                        transition-all duration-300
                        ${error
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                            : ''
                        }
                        ${className}
                    `}
                    {...props}
                />
                {icon && iconPosition === 'right' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                        {icon}
                    </div>
                )}
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

// Textarea variant with glass styling
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Textarea({
    label,
    error,
    hint,
    className = '',
    ...props
}: TextareaProps) {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="
                    text-[11px] font-bold text-white/60 
                    uppercase tracking-[0.15em] ml-1
                    block
                ">
                    {label}
                </label>
            )}
            <textarea
                className={`
                    w-full px-5 py-4
                    glass-input
                    rounded-2xl
                    text-white font-medium
                    placeholder:text-white/40
                    focus:ring-2 focus:ring-blue-500/30
                    transition-all duration-300
                    resize-none
                    min-h-[120px]
                    ${error
                        ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                        : ''
                    }
                    ${className}
                `}
                {...props}
            />
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

// Search Input with built-in search icon
interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconPosition'> {
    onSearch?: (value: string) => void;
}

export function SearchInput({ onSearch, ...props }: SearchInputProps) {
    return (
        <Input
            icon={<span className="material-symbols-outlined text-xl">search</span>}
            iconPosition="left"
            placeholder="Buscar..."
            {...props}
        />
    );
}
