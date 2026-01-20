import type React from "react"
import LoadingSpinner from "./LoadingSpinner"

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline" | "glass"
export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
    loading?: boolean
    icon?: React.ReactNode
    iconPosition?: 'left' | 'right'
    glow?: boolean
    children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: `
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700 
        text-white 
        shadow-lg shadow-blue-500/30
        border border-white/20
    `,
    secondary: `
        bg-white/10 
        hover:bg-white/20 
        text-white 
        border border-white/20
        backdrop-blur-sm
    `,
    success: `
        bg-gradient-to-r from-emerald-500 to-emerald-600 
        hover:from-emerald-600 hover:to-emerald-700 
        text-white 
        shadow-lg shadow-emerald-500/30
        border border-white/20
    `,
    danger: `
        bg-gradient-to-r from-red-500 to-red-600 
        hover:from-red-600 hover:to-red-700 
        text-white 
        shadow-lg shadow-red-500/30
        border border-white/20
    `,
    ghost: `
        bg-transparent 
        hover:bg-white/10 
        text-white/80 
        hover:text-white
    `,
    outline: `
        bg-transparent 
        border-2 border-white/30 
        hover:bg-white/10 
        hover:border-white/50 
        text-white
    `,
    glass: `
        glass-button
    `,
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-5 py-2.5 text-sm rounded-xl",
    md: "px-6 py-3.5 text-base rounded-2xl",
    lg: "px-8 py-4.5 text-lg rounded-2xl",
}

const glowVariants: Partial<Record<ButtonVariant, string>> = {
    primary: "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
    success: "shadow-[0_0_20px_rgba(16,185,129,0.5)]",
    danger: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
}

export default function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = 'left',
    glow = false,
    children,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses = `
        font-bold 
        transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        flex items-center justify-center gap-2.5 
        focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
        hover:scale-[1.02] active:scale-[0.98]
        backdrop-blur-sm
    `
    const widthClass = fullWidth ? "w-full" : ""
    const glowClass = glow && glowVariants[variant] ? glowVariants[variant] : ""

    return (
        <button
            className={`
                ${baseClasses} 
                ${variantClasses[variant]} 
                ${sizeClasses[size]} 
                ${widthClass} 
                ${glowClass}
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Procesando...</span>
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <span className="flex items-center">{icon}</span>
                    )}
                    {children}
                    {icon && iconPosition === 'right' && (
                        <span className="flex items-center">{icon}</span>
                    )}
                </>
            )}
        </button>
    )
}

// Icon Button variant for compact icon-only buttons
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: 'sm' | 'md' | 'lg'
    icon: React.ReactNode
    label: string // For accessibility
}

export function IconButton({
    variant = "ghost",
    size = "md",
    icon,
    label,
    className = "",
    ...props
}: IconButtonProps) {
    const sizeClasses = {
        sm: "w-9 h-9 rounded-xl",
        md: "w-11 h-11 rounded-2xl",
        lg: "w-14 h-14 rounded-2xl",
    }

    return (
        <button
            className={`
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                flex items-center justify-center
                transition-all duration-300
                hover:scale-105 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-white/30
                ${className}
            `}
            aria-label={label}
            {...props}
        >
            {icon}
        </button>
    )
}
