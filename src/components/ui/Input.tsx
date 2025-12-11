import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}
            <input
                className={`w-full p-3 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground ${error ? 'border-destructive focus:ring-destructive' : ''
                    } ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
