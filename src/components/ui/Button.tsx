import type React from "react"

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline"
export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
    loading?: boolean
    icon?: React.ReactNode
    children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    success: "bg-success hover:bg-success/90 text-success-foreground shadow-sm",
    danger: "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm",
    ghost: "bg-transparent hover:bg-muted text-foreground",
    outline: "bg-transparent border-2 border-border hover:bg-muted text-foreground",
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
}

export default function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    icon,
    children,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses =
        "rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    const widthClass = fullWidth ? "w-full" : ""

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>Cargando...</span>
                </>
            ) : (
                <>
                    {icon && <span>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    )
}
