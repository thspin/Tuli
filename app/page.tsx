'use client'

import Link from 'next/link'
import ThemeSwitcher from '@/src/components/ui/ThemeSwitcher'
import TodoList from '@/src/components/home/TodoList'

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            {/* Header con selector de tema */}
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-end mb-8">
                    <ThemeSwitcher />
                </div>
            </div>

            {/* Content */}
            <div className="flex items-center justify-center min-h-[80vh] px-6">
                <div className="text-center max-w-3xl">
                    <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tight">
                        Bienvenido a Tuli
                    </h1>
                    <p className="text-xl text-muted-foreground mb-12">
                        Gestiona tus finanzas de forma simple y eficiente
                    </p>

                    {/* Navigation Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                        <Link
                            href="/accounts"
                            className="group bg-card hover:bg-accent border border-border rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                            <div className="text-5xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Mis Cuentas</h3>
                            <p className="text-sm text-muted-foreground">
                                Gestiona tus productos financieros
                            </p>
                        </Link>

                        <Link
                            href="/transactions"
                            className="group bg-card hover:bg-accent border border-border rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                            <div className="text-5xl mb-4">💸</div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Transacciones</h3>
                            <p className="text-sm text-muted-foreground">
                                Registra ingresos y gastos
                            </p>
                        </Link>

                        <Link
                            href="/services"
                            className="group bg-card hover:bg-accent border border-border rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                            <div className="text-5xl mb-4">💡</div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Servicios</h3>
                            <p className="text-sm text-muted-foreground">
                                Gestiona vencimientos y pagos
                            </p>
                        </Link>

                        <Link
                            href="/summaries"
                            className="group bg-card hover:bg-accent border border-border rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                            <div className="text-5xl mb-4">📄</div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Resúmenes</h3>
                            <p className="text-sm text-muted-foreground">
                                Consulta informes y análisis detallados
                            </p>
                        </Link>

                        <Link
                            href="/categories"
                            className="group bg-card hover:bg-accent border border-border rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                            <div className="text-5xl mb-4">🏷️</div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Categorías</h3>
                            <p className="text-sm text-muted-foreground">
                                Organiza tus transacciones
                            </p>
                        </Link>
                    </div>

                    {/* Todo List Section */}
                    <div className="mb-12">
                        <TodoList />
                    </div>
                </div>
            </div>
        </main>
    )
}
