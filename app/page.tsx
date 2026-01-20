import React from 'react';
import { Card, MetricCard } from '@/src/components/ui';

import { getAccountsPageData } from '@/src/actions/accounts/account-actions';
import AddTransactionButton from '@/src/components/transactions/AddTransactionButton';
import AddTransferButton from '@/src/components/accounts/AddTransferButton';

export default async function Home() {
    const { institutions, cashProducts } = await getAccountsPageData();

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Page Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black text-white glass-text tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-white/60 text-sm font-medium">
                        Tu resumen financiero personal
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <MetricCard
                        icon={<span className="material-symbols-outlined text-2xl">account_balance</span>}
                        label="Balance Total"
                        value="$1,234,567"
                        trend={{ value: 12.5, isPositive: true }}
                        glow="blue"
                    />
                    <MetricCard
                        icon={<span className="material-symbols-outlined text-2xl">trending_up</span>}
                        label="Ingresos (Mes)"
                        value="$456,789"
                        trend={{ value: 8.3, isPositive: true }}
                        glow="green"
                    />
                    <MetricCard
                        icon={<span className="material-symbols-outlined text-2xl">trending_down</span>}
                        label="Gastos (Mes)"
                        value="$234,567"
                        trend={{ value: 3.2, isPositive: false }}
                        glow="red"
                    />
                    <MetricCard
                        icon={<span className="material-symbols-outlined text-2xl">credit_card</span>}
                        label="Próximo Resumen"
                        value="$89,450"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upcoming Payments (Moved from bottom) */}
                    <Card variant="default" padding="lg" className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white glass-text">
                                Próximos Vencimientos
                            </h2>
                            <span className="glass-badge glass-badge-warning">3 esta semana</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['Netflix', 'Spotify', 'Edenor', 'Gym'].map((service, i) => (
                                <div
                                    key={service}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center
                                        ${i === 0 ? 'bg-red-500/20' : i === 1 ? 'bg-green-500/20' : i === 2 ? 'bg-blue-500/20' : 'bg-orange-500/20'}
                                    `}>
                                        <span className="material-symbols-outlined text-white/70">
                                            {i === 0 ? 'movie' : i === 1 ? 'music_note' : i === 2 ? 'bolt' : 'fitness_center'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{service}</p>
                                        <p className="text-white/50 text-sm">
                                            Vence en {i + 2} días
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">
                                            ${(Math.random() * 5000 + 1000).toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card variant="elevated" padding="lg">
                        <h2 className="text-xl font-bold text-white glass-text mb-6">
                            Acciones Rápidas
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <AddTransactionButton
                                institutions={institutions}
                                cashProducts={cashProducts}
                                type="EXPENSE"
                                variant="cardAction"
                            />
                            <AddTransactionButton
                                institutions={institutions}
                                cashProducts={cashProducts}
                                type="INCOME"
                                variant="cardAction"
                            />
                            <AddTransferButton
                                institutions={institutions}
                                cashProducts={cashProducts}
                                variant="cardAction"
                            />
                            <button className="flex flex-col items-center justify-center gap-2 py-6 hover:bg-white/5 transition-all group rounded-2xl opacity-50 cursor-not-allowed border border-transparent hover:border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-purple-400 text-[22px] group-hover:text-white">upload_file</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-medium">Importar</p>
                                    <p className="text-white/50 text-xs">PDF / Excel</p>
                                </div>
                            </button>
                        </div>
                    </Card>
                </div>


            </div>
        </div>
    );
}
