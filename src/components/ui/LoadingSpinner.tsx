interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'white' | 'blue' | 'green' | 'red' | 'purple';
    className?: string;
}

const colorMap = {
    white: '#ffffff',
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    purple: '#8B5CF6',
};

export default function LoadingSpinner({
    size = 'md',
    color = 'blue',
    className = ''
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-20 h-20'
    };

    return (
        <svg
            viewBox="25 25 50 50"
            className={`${sizeClasses[size]} loading-spinner-container ${className}`}
        >
            <circle
                cx="50"
                cy="50"
                r="20"
                className="loading-spinner-circle"
                style={{ stroke: colorMap[color] }}
            />
        </svg>
    );
}

// Full page loading overlay
interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = 'Cargando...' }: LoadingOverlayProps) {
    return (
        <div className="
            fixed inset-0 z-50
            glass-modal-backdrop
            flex flex-col items-center justify-center gap-6
        ">
            <div className="
                glass-card p-8
                flex flex-col items-center gap-4
            ">
                <LoadingSpinner size="lg" color="blue" />
                <p className="text-white/80 font-medium">{message}</p>
            </div>
        </div>
    );
}

// Skeleton loader for content placeholders
interface SkeletonProps {
    width?: string;
    height?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'full';
    className?: string;
}

export function Skeleton({
    width = '100%',
    height = '1rem',
    rounded = 'md',
    className = ''
}: SkeletonProps) {
    const roundedClasses = {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        full: 'rounded-full'
    };

    return (
        <div
            className={`
                bg-white/10
                ${roundedClasses[rounded]}
                glass-shimmer
                ${className}
            `}
            style={{ width, height }}
        />
    );
}

// Card skeleton for loading states
export function CardSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`glass-card p-6 space-y-4 ${className}`}>
            <div className="flex items-center gap-3">
                <Skeleton width="48px" height="48px" rounded="lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton width="60%" height="0.75rem" />
                    <Skeleton width="40%" height="0.625rem" />
                </div>
            </div>
            <Skeleton width="100%" height="2rem" />
            <div className="flex gap-2">
                <Skeleton width="80px" height="1.5rem" rounded="full" />
                <Skeleton width="60px" height="1.5rem" rounded="full" />
            </div>
        </div>
    );
}
