// src/components/ui/Card.tsx
import React from 'react';

type CardVariant = 'default' | 'elevated' | 'dark' | 'flat';

interface CardProps {
    children: React.ReactNode;
    variant?: CardVariant;
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hover?: boolean;
    glow?: 'none' | 'blue' | 'green' | 'red' | 'purple';
    onClick?: () => void;
    className?: string;
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
};

const variantClasses: Record<CardVariant, string> = {
    default: 'glass-card',
    elevated: 'glass-card-elevated',
    dark: 'glass-card-dark',
    flat: 'bg-white/5 border border-white/10 rounded-[24px]',
};

const glowClasses = {
    none: '',
    blue: 'glass-glow-info',
    green: 'glass-glow-success',
    red: 'glass-glow-error',
    purple: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
};

export default function Card({
    children,
    variant = 'default',
    padding = 'md',
    hover = false,
    glow = 'none',
    onClick,
    className = '',
}: CardProps) {
    const hoverClass = hover
        ? 'hover:bg-white/15 hover:shadow-glass-lg hover:border-white/25 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]'
        : '';
    const clickableClass = onClick
        ? 'cursor-pointer active:scale-[0.98] transition-transform'
        : '';

    return (
        <div
            className={`
                ${variantClasses[variant]} 
                ${paddingClasses[padding]} 
                ${hoverClass} 
                ${clickableClass} 
                ${glowClasses[glow]}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// Card Header component
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`mb-6 ${className}`}>{children}</div>;
}

// Card Title component
export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={`text-2xl font-bold text-white tracking-tight glass-text ${className}`}>
            {children}
        </h3>
    );
}

// Card Description component
export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={`text-sm text-white/60 mt-1 ${className}`}>
            {children}
        </p>
    );
}

// Card Content component
export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
}

// Card Footer component
export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`mt-6 pt-6 border-t border-white/10 ${className}`}>
            {children}
        </div>
    );
}

// Metric Card - For displaying financial metrics
interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    glow?: 'blue' | 'green' | 'red' | 'purple';
    className?: string;
}

export function MetricCard({ icon, label, value, trend, glow, className = '' }: MetricCardProps) {
    return (
        <Card variant="default" padding="md" hover glow={glow} className={className}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/80">
                    {icon}
                </div>
                <span className="text-sm text-white/60 font-medium">{label}</span>
            </div>
            <h2 className="text-3xl font-black text-white glass-text tracking-tight">
                {value}
            </h2>
            {trend && (
                <div className="mt-3 flex items-center gap-2">
                    <span className={`
                        px-2.5 py-1 rounded-full text-xs font-bold
                        ${trend.isPositive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }
                    `}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                </div>
            )}
        </Card>
    );
}
