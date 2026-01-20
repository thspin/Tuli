'use client'

import { ErrorBoundary } from "./ErrorBoundary";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            {children}
        </ErrorBoundary>
    )
}
