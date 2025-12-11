import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Colores Base (Noche Serena Palette available as utilities)
                'fondo-base': 'rgb(23, 33, 54)', // Slightly lighter than original 15, 23, 42
                'superficie-1': 'rgb(30, 41, 59)',
                'superficie-2': 'rgb(51, 65, 85)',
                'borde': 'rgb(62, 78, 100)',

                // Color Primario (Acción)
                'primario': 'rgb(59, 130, 246)',
                'primario-hover': 'rgb(37, 99, 235)',

                // Colores de Texto
                'texto-alto': 'rgb(241, 245, 249)',
                'texto-medio': 'rgb(156, 163, 175)',
                'texto-bajo': 'rgb(100, 116, 139)',
                'texto-deshabilitado': 'rgb(75, 85, 99)',

                // Colores Semánticos
                'exito': 'rgb(34, 197, 94)',
                'alerta': 'rgb(251, 191, 36)',
                'error': 'rgb(239, 68, 68)',
                'info': 'rgb(99, 102, 241)',

                // Semantic Mappings (Restored to CSS Variables for dynamic theming)
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                success: {
                    DEFAULT: "var(--success)",
                    foreground: "var(--success-foreground)",
                },
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'glow': '0 0 20px rgba(59, 130, 246, 0.6)',
            },
        },
    },
    plugins: [],
};
export default config;
