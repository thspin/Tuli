"use client"

import { useTheme } from "./ThemeProvider"

const themes = [
    { value: "light" as const, label: "Claro", icon: "☀️" },
    { value: "dark" as const, label: "Oscuro", icon: "🌙" },
]

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex items-center gap-1 bg-card rounded-xl p-1 shadow-sm border border-border">
            {themes.map((t) => (
                <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${theme === t.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    title={t.label}
                >
                    <span className="mr-1">{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                </button>
            ))}
        </div>
    )
}
