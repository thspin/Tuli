import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    children: React.ReactNode;
}

export default function Select({ label, error, className = '', children, ...props }: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}
            <select
                className={`w-full p-3 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${error ? 'border-destructive focus:ring-destructive' : ''
                    } ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
