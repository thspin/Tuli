// src/components/ui/Alert.tsx
import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
    glow?: boolean;
}

const variantStyles: Record<AlertVariant, {
    bg: string;
    border: string;
    text: string;
    icon: string;
    iconBg: string;
    glow: string;
}> = {
    info: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        icon: 'info',
        iconBg: 'bg-blue-500/20',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    },
    success: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-300',
        icon: 'check_circle',
        iconBg: 'bg-emerald-500/20',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
    warning: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-300',
        icon: 'warning',
        iconBg: 'bg-amber-500/20',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    },
    error: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-300',
        icon: 'error',
        iconBg: 'bg-red-500/20',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
};

export default function Alert({
    variant = 'info',
    title,
    children,
    onClose,
    className = '',
    glow = false,
}: AlertProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={`
                ${styles.bg} 
                border ${styles.border} 
                backdrop-blur-sm
                rounded-2xl 
                p-5 
                ${glow ? styles.glow : ''}
                ${className}
            `}
        >
            <div className="flex items-start gap-4">
                <div className={`
                    w-10 h-10 rounded-xl 
                    ${styles.iconBg} 
                    flex items-center justify-center 
                    flex-shrink-0
                `}>
                    <span className={`material-symbols-outlined ${styles.text}`}>
                        {styles.icon}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    {title && (
                        <h4 className={`font-bold ${styles.text} mb-1 glass-text`}>
                            {title}
                        </h4>
                    )}
                    <div className={`text-sm text-white/70`}>
                        {children}
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={`
                            w-8 h-8 rounded-lg
                            bg-white/5 hover:bg-white/10
                            flex items-center justify-center
                            text-white/40 hover:text-white/70
                            transition-all duration-200
                            flex-shrink-0
                        `}
                        aria-label="Cerrar"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>
        </div>
    );
}

// Toast-style Alert for notifications
interface ToastProps {
    variant?: AlertVariant;
    message: string;
    onClose?: () => void;
    duration?: number;
    className?: string;
}

export function Toast({
    variant = 'info',
    message,
    onClose,
    className = '',
}: ToastProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={`
                ${styles.bg} 
                border ${styles.border}
                backdrop-blur-md
                rounded-2xl 
                px-5 py-4
                flex items-center gap-3
                ${styles.glow}
                animate-in slide-in-from-right-5 duration-300
                ${className}
            `}
        >
            <span className={`material-symbols-outlined ${styles.text}`}>
                {styles.icon}
            </span>
            <span className="text-white/90 text-sm font-medium">
                {message}
            </span>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-white/40 hover:text-white/70 transition-colors ml-2"
                    aria-label="Cerrar"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            )}
        </div>
    );
}
