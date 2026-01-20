import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // ============================================
            // SISTEMA DE COLORES - GLASSMORPHISM 2.0
            // ============================================
            colors: {
                // Shadcn base (mantener compatibilidad)
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",

                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                    50: "var(--primary-50)",
                    100: "var(--primary-100)",
                    500: "var(--primary-500)",
                    600: "var(--primary-600)",
                    700: "var(--primary-700)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                success: {
                    DEFAULT: "var(--success)",
                    foreground: "var(--success-foreground)",
                },
                warning: {
                    DEFAULT: "var(--warning)",
                    foreground: "var(--warning-foreground)",
                },
                info: {
                    DEFAULT: "var(--info)",
                    foreground: "var(--info-foreground)",
                },
                "row-hover": "var(--row-hover)",

                // GLASSMORPHISM 2.0 - Colores específicos
                glass: {
                    white: "rgba(255, 255, 255, 0.1)",
                    "white-strong": "rgba(255, 255, 255, 0.25)",
                    "white-subtle": "rgba(255, 255, 255, 0.05)",
                    dark: "rgba(0, 0, 0, 0.1)",
                    border: "rgba(255, 255, 255, 0.18)",
                    "border-strong": "rgba(255, 255, 255, 0.3)",
                },
            },

            // ============================================
            // BACKGROUND COLORS - GLASSMORPHISM 2.0
            // ============================================
            backgroundColor: {
                "glass-white": "rgba(255, 255, 255, 0.1)",
                "glass-white-strong": "rgba(255, 255, 255, 0.25)",
                "glass-white-subtle": "rgba(255, 255, 255, 0.05)",
                "glass-dark": "rgba(0, 0, 0, 0.1)",
                "glass-card": "rgba(255, 255, 255, 0.1)",
                "glass-elevated": "rgba(255, 255, 255, 0.15)",
                "glass-input": "rgba(255, 255, 255, 0.05)",
            },

            // ============================================
            // BORDER COLORS - GLASSMORPHISM 2.0
            // ============================================
            borderColor: {
                glass: "rgba(255, 255, 255, 0.18)",
                "glass-strong": "rgba(255, 255, 255, 0.3)",
                "glass-subtle": "rgba(255, 255, 255, 0.1)",
            },

            // ============================================
            // BORDER RADIUS - SISTEMA TULI + GLASS
            // ============================================
            borderRadius: {
                // Shadcn base
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",

                // Sistema Tuli específico
                'tuli-xs': '12px',
                'tuli-sm': '16px',
                'tuli-md': '20px',
                'tuli-lg': '24px',
                'tuli-xl': '32px',
                'tuli-2xl': '40px',
                'tuli-full': '9999px',

                // Glassmorphism
                'glass': '24px',
                'glass-lg': '32px',
                'glass-xl': '40px',
            },

            // ============================================
            // SPACING - TOKENS ESPECÍFICOS
            // ============================================
            spacing: {
                'page': '2rem',
                'page-md': '3rem',
                'card': '1.5rem',
                'card-lg': '2rem',
                'section': '4rem',
                'section-lg': '6rem',
            },

            // ============================================
            // SOMBRAS - GLASSMORPHISM 2.0
            // ============================================
            boxShadow: {
                // Sistema Tuli base
                'tuli-xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'tuli-sm': '0 2px 8px -2px rgb(100 116 139 / 0.1)',
                'tuli-md': '0 4px 16px -4px rgb(100 116 139 / 0.15)',
                'tuli-lg': '0 8px 24px -6px rgb(100 116 139 / 0.2)',
                'tuli-xl': '0 20px 40px -12px rgb(100 116 139 / 0.25)',
                'tuli-2xl': '0 24px 48px -12px rgb(100 116 139 / 0.3)',
                'tuli-primary': '0 8px 24px -6px var(--primary)',
                'tuli-success': '0 8px 24px -6px var(--success)',
                'tuli-error': '0 8px 24px -6px var(--destructive)',
                'tuli-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

                // GLASSMORPHISM 2.0 - Sombras difusas
                'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
                'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.2)',
                'glass-xl': '0 24px 64px 0 rgba(31, 38, 135, 0.25)',
                'glass-inset': 'inset 0 2px 8px rgba(0, 0, 0, 0.1)',
                'glass-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',

                // Glow effects para métricas
                'glass-glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
                'glass-glow-green': '0 0 20px rgba(16, 185, 129, 0.4)',
                'glass-glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
                'glass-glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',

                // Combined glass shadow with inner glow
                'glass-card': '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                'glass-elevated': '0 16px 48px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            },

            // ============================================
            // BACKDROP BLUR - GLASSMORPHISM 2.0
            // ============================================
            backdropBlur: {
                'tuli': '12px',
                'glass-sm': '10px',
                'glass-md': '16px',
                'glass-lg': '24px',
                'glass-xl': '40px',
            },

            // ============================================
            // BACKDROP SATURATE
            // ============================================
            backdropSaturate: {
                '150': '150%',
                '180': '180%',
                '200': '200%',
            },

            // ============================================
            // TIPOGRAFÍA
            // ============================================
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
                '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
                '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
                'display': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '900' }],
                'balance': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
                'label': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.2em', fontWeight: '900' }],
            },

            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
                extrabold: '800',
                black: '900',
            },

            // ============================================
            // ANIMACIONES - GLASSMORPHISM 2.0
            // ============================================
            animation: {
                'spin': 'spin 1s linear infinite',
                'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce': 'bounce 1s infinite',
                'fade-in': 'fadeIn 300ms ease-in-out',
                'slide-up': 'slideUp 300ms ease-out',
                'slide-down': 'slideDown 300ms ease-out',
                'scale-in': 'scaleIn 200ms ease-out',
                'shimmer': 'shimmer 2s linear infinite',

                // Glassmorphism animations
                'gradient-shift': 'gradientShift 15s ease infinite',
                'glass-shimmer': 'glassShimmer 2s infinite',
                'glass-pulse': 'glassPulse 2s ease-in-out infinite',
                'glass-float': 'glassFloat 6s ease-in-out infinite',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                // Glassmorphism keyframes
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                glassShimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                glassPulse: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' },
                    '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
                },
                glassFloat: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glowPulse: {
                    '0%, 100%': { opacity: '0.5' },
                    '50%': { opacity: '1' },
                },
            },

            // ============================================
            // TRANSICIONES
            // ============================================
            transitionDuration: {
                'instant': '100ms',
                'fast': '200ms',
                'base': '300ms',
                'slow': '500ms',
            },

            transitionTimingFunction: {
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'glass': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // ============================================
            // Z-INDEX
            // ============================================
            zIndex: {
                'dropdown': '1000',
                'sticky': '1020',
                'modal-backdrop': '1040',
                'modal': '1050',
                'popover': '1060',
                'tooltip': '1070',
            },

            // ============================================
            // BACKGROUND SIZE (for gradients)
            // ============================================
            backgroundSize: {
                '200%': '200% 200%',
                '400%': '400% 400%',
            },
        },
    },
    plugins: [],
};

export default config;
