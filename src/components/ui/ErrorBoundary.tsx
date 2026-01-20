'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                    <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-3">Algo salió mal</h2>
                        <p className="text-sm opacity-90 mb-6 font-mono bg-black/20 p-2 rounded break-all">
                            {this.state.error?.message || "Error desconocido"}
                        </p>
                        <button
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors w-full"
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload(); // Hard reload option? Or just retry render?
                                // Usually reset state is better, but loop loops if error persists.
                                // Let's just reset state.
                            }}
                        >
                            Intentar de nuevo
                        </button>
                        <button
                            className="mt-2 px-4 py-2 text-red-400 hover:text-red-300 text-sm w-full"
                            onClick={() => window.location.href = '/'}
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
