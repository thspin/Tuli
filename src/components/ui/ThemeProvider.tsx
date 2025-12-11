"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "blue-sober"

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem("tuli-theme") as Theme
        if (savedTheme && ["light", "dark", "blue-sober"].includes(savedTheme)) {
            setTheme(savedTheme)
        }
    }, [])

    useEffect(() => {
        if (mounted) {
            // Remove all theme classes first
            document.documentElement.classList.remove("dark", "blue-sober")
            // Add the current theme class if not light
            if (theme !== "light") {
                document.documentElement.classList.add(theme)
            }
            localStorage.setItem("tuli-theme", theme)
        }
    }, [theme, mounted])

    // Siempre envolver en el Provider, incluso antes de montar
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
