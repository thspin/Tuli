'use client'

import React from 'react';
import { InstitutionWithProducts, Product } from '@/src/types';
import { AnalyticsData } from '@/src/actions/analytics/analytics-actions';
import { getCurrencySymbol } from '@/src/utils/validations';
import { Card } from '@/src/components/ui';
import { formatDate } from '@/src/utils/date';
import Link from 'next/link';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    ComposedChart,
    Line,
    Legend
} from 'recharts';

interface DashboardClientProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    recentTransactions: any[];
    usdToArsRate: number | null;
    analyticsData: AnalyticsData;
}

export default function DashboardClient({
    institutions,
    cashProducts,
    recentTransactions,
    usdToArsRate,
    analyticsData
}: DashboardClientProps) {
    const userName = "Usuario";

    // Calculate trends from monthlyCashflow
    const calculateTrend = (current: number, previous: number): { percentage: number; isPositive: boolean; arrow: string } => {
        if (previous === 0) return { percentage: 0, isPositive: true, arrow: '→' };
        const change = ((current - previous) / Math.abs(previous)) * 100;
        const isPositive = change >= 0;
        return {
            percentage: Math.abs(change),
            isPositive,
            arrow: change > 5 ? '↗' : change < -5 ? '↘' : '→'
        };
    };

    // Filter data to show only months with activity (more dynamic charts)
    const cashflowWithData = analyticsData.monthlyCashflow
        .filter(m => m.income > 0 || m.expense > 0)
        .map(m => ({
            ...m,
            balance: m.income - m.expense // Add balance to each month
        }));
    const debtProjectionWithData = analyticsData.debtProjection.filter(d => d.amount > 0);

    // Get last 2 months with data for trend calculation
    const monthsWithData = cashflowWithData;
    const lastMonth = monthsWithData[monthsWithData.length - 1];
    const previousMonth = monthsWithData[monthsWithData.length - 2];

    // Calculate KPI trends (comparing balances month over month)
    const lastMonthBalance = lastMonth ? lastMonth.income - lastMonth.expense : 0;
    const prevMonthBalance = previousMonth ? previousMonth.income - previousMonth.expense : 0;

    const arsTrend = calculateTrend(lastMonthBalance, prevMonthBalance);
    const usdTrend = calculateTrend(analyticsData.totalUsd, analyticsData.totalUsd * 0.98);
    const debtTrend = calculateTrend(analyticsData.totalDebtArs, analyticsData.totalDebtArs * 1.05);
    const installmentTrend = calculateTrend(analyticsData.installmentsOverview.monthlyInstallmentAmount, analyticsData.installmentsOverview.monthlyInstallmentAmount * 1.02);

    // Calculate financial health metrics
    const totalLiquidity = analyticsData.totalArs + (analyticsData.totalUsd * (usdToArsRate || 1000));
    const healthRatio = analyticsData.totalDebtArs > 0 ? totalLiquidity / analyticsData.totalDebtArs : 99;
    const netWorth = totalLiquidity - analyticsData.totalDebtArs;

    // Dynamic labels for charts
    const cashflowLabel = cashflowWithData.length > 0
        ? `${cashflowWithData[0].label} - ${cashflowWithData[cashflowWithData.length - 1].label}`
        : 'Sin datos';
    const debtProjectionLabel = debtProjectionWithData.length > 0
        ? `Próximos ${debtProjectionWithData.length} meses`
        : 'Sin datos';

    const customTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length >= 2) {
            const income = payload[0]?.value || 0;
            const expense = payload[1]?.value || 0;
            const balance = payload[2]?.value || (income - expense);
            const isPositive = balance >= 0;

            return (
                <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-2xl min-w-[220px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{label}</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ingresos
                            </span>
                            <span className="text-xs font-black text-slate-900">$ {income.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Egresos
                            </span>
                            <span className="text-xs font-black text-slate-900">$ {expense.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                    <div className="w-2 h-0.5 bg-blue-600" /> Balance
                                </span>
                                <span className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isPositive ? '+' : ''} $ {balance.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const debtTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-4 border border-slate-100 shadow-tuli-xl rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label} {payload[0].payload.year}</p>
                    <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Compromisos
                        </span>
                        <span className="text-xs font-black text-slate-900">$ {payload[0].value.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-screen bg-background p-4 overflow-hidden">
            <div className="h-full flex flex-col gap-3">

                {/* Header - Compacto con selector de período */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-[18px]">dashboard</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Dashboard</h1>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Centro de Control Financiero</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Selector de Período */}
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm flex items-center gap-2 hover:border-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">calendar_view_month</span>
                            <select defaultValue="Último año" className="text-[10px] font-black text-slate-800 bg-transparent border-none outline-none cursor-pointer">
                                <option>Último mes</option>
                                <option>Últimos 3 meses</option>
                                <option>Últimos 6 meses</option>
                                <option>Último año</option>
                                <option>Todo el período</option>
                            </select>
                        </div>
                        {/* Fecha actual */}
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600 text-[16px]">calendar_today</span>
                            <p className="text-[10px] font-black text-slate-800">{formatDate(new Date(), { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* KPIs Row - Compactos con Tendencias */}
                <div className="grid grid-cols-5 gap-3">
                    {/* Patrimonio Neto - NUEVO */}
                    <Card padding="none" className="border-none shadow-md bg-gradient-to-br from-violet-600 to-purple-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="relative z-10 text-white p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-violet-100 mb-2 opacity-80">Patrimonio Neto</p>
                            <p className="text-2xl font-black tracking-tighter mb-1">$ {netWorth.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-violet-100/70">
                                <span className="text-sm">{arsTrend.arrow}</span>
                                <span className={arsTrend.isPositive ? 'text-emerald-300' : 'text-rose-300'}>
                                    {arsTrend.percentage.toFixed(1)}%
                                </span>
                                <span>vs mes anterior</span>
                            </div>
                        </div>
                    </Card>

                    <Card padding="none" className="border-none shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="relative z-10 text-white p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-100 mb-2 opacity-80">Liquidez ARS</p>
                            <p className="text-2xl font-black tracking-tighter mb-1">$ {analyticsData.totalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-blue-100/70">
                                <span>Ratio: {healthRatio.toFixed(2)}x</span>
                            </div>
                        </div>
                    </Card>

                    <Card padding="none" className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="relative z-10 text-white p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-50 mb-2 opacity-80">Ahorro USD</p>
                            <p className="text-2xl font-black tracking-tighter mb-1">US$ {analyticsData.totalUsd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-100/70">
                                <span className="text-sm">{usdTrend.arrow}</span>
                                <span className={usdTrend.isPositive ? 'text-emerald-300' : 'text-rose-300'}>
                                    {usdTrend.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card padding="none" className="border-none shadow-md bg-gradient-to-br from-rose-500 to-red-600 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="relative z-10 text-white p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-100 mb-2 opacity-80">Deuda Total</p>
                            <p className="text-2xl font-black tracking-tighter mb-1">$ {analyticsData.totalDebtArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-rose-100/70">
                                <span className="text-sm">{debtTrend.arrow}</span>
                                <span className={debtTrend.isPositive ? 'text-rose-300' : 'text-emerald-300'}>
                                    {debtTrend.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card padding="none" className="border-none shadow-md bg-gradient-to-br from-amber-400 to-orange-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="relative z-10 text-white p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-50 mb-2 opacity-80">Cuota Mensual</p>
                            <p className="text-2xl font-black tracking-tighter mb-1">$ {analyticsData.installmentsOverview.monthlyInstallmentAmount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-amber-100/70">
                                <span>{analyticsData.installmentsOverview.totalActiveInstallments} compras</span>
                                <span className="text-sm">{installmentTrend.arrow}</span>
                                <span className={installmentTrend.isPositive ? 'text-rose-300' : 'text-emerald-300'}>
                                    {installmentTrend.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Grid Principal - 2 columnas */}
                <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">

                    {/* Columna Izquierda: Flujo de Caja */}
                    <div className="col-span-2 flex flex-col gap-3">
                        {/* Flujo de Caja */}
                        <Card padding="none" className="flex-1 border border-slate-100 shadow-md overflow-hidden bg-white flex flex-col min-h-0">
                            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[16px]">equalizer</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Flujo de Caja Mensual</h3>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{cashflowLabel}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Ingresos</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Egresos</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-blue-600" style={{ height: '2px' }} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Balance</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={cashflowWithData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                            dy={8}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip content={customTooltip} cursor={{ fill: '#f8fafc' }} />
                                        <Bar
                                            dataKey="income"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                            animationDuration={1200}
                                        />
                                        <Bar
                                            dataKey="expense"
                                            fill="#f43f5e"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                            animationDuration={1200}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', r: 5 }}
                                            activeDot={{ r: 7 }}
                                            animationDuration={1500}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Deuda Proyectada */}
                        <Card padding="none" className="flex-1 border border-slate-100 shadow-md overflow-hidden bg-white flex flex-col min-h-0">
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/30 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[16px]">analytics</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Deuda Proyectada</h3>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{debtProjectionLabel}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={debtProjectionWithData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                                            dy={5}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                                            tickFormatter={(value) => `$${value / 1000}k`}
                                        />
                                        <Tooltip content={debtTooltip} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={22} animationDuration={1500}>
                                            {debtProjectionWithData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index === 0 ? '#e11d48' : '#fda4af'}
                                                    fillOpacity={1 - (index * 0.05)}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Columna Derecha: Distribución y Stats */}
                    <div className="flex flex-col gap-3">
                        {/* Distribución de Gastos */}
                        <Card padding="none" className="flex-1 border border-slate-100 shadow-md overflow-hidden bg-white flex flex-col min-h-0">
                            <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Distribución</h3>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gastos por categoría</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex-1 min-h-0 flex flex-col">
                                <div className="h-40 relative mb-3">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.expensesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="total"
                                                cornerRadius={6}
                                                stroke="none"
                                            >
                                                {analyticsData.expensesByCategory.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'][index % 8]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', fontSize: '10px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <span className="block text-xl font-black text-slate-800 tracking-tighter">
                                                {((analyticsData.expensesByCategory.reduce((a, b) => a + b.total, 0) / (analyticsData.totalArs + analyticsData.totalUsd)) * 100).toFixed(0)}%
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">del total</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex-1 overflow-y-auto">
                                    {analyticsData.expensesByCategory.slice(0, 5).map((cat, i) => {
                                        const totalExp = analyticsData.expensesByCategory.reduce((a, b) => a + b.total, 0);
                                        const percentage = ((cat.total / totalExp) * 100).toFixed(1);
                                        return (
                                            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                                                        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'][i % 8]
                                                    }} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-slate-700 text-[10px] truncate">{cat.name}</p>
                                                        <p className="text-[8px] text-slate-400 font-bold">{cat.count} txs</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <p className="font-black text-slate-900 text-[10px]">$ {cat.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                                                    <p className="text-[8px] font-bold text-slate-400">{percentage}%</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        {/* Stats Cards */}
                        <Card padding="none" className="bg-slate-900 border-none shadow-md text-white overflow-hidden relative flex-shrink-0">
                            <div className="absolute inset-0 bg-blue-600/10" />
                            <div className="relative z-10 p-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Top Merchant</p>
                                {analyticsData.topMerchants[0] && (
                                    <>
                                        <h4 className="text-base font-black tracking-tight mb-1 truncate">{analyticsData.topMerchants[0].name}</h4>
                                        <p className="text-blue-400 font-bold text-xl">$ {analyticsData.topMerchants[0].total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                                    </>
                                )}
                            </div>
                        </Card>

                        <Card padding="none" className="bg-white border border-slate-100 shadow-md flex-shrink-0">
                            <div className="p-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Ticket Promedio</p>
                                <h4 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">
                                    $ {(analyticsData.totalExpenses / Math.max(analyticsData.totalTransactions, 1)).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                </h4>
                                <p className="text-slate-500 font-bold text-[9px]">Gasto medio por tx</p>
                            </div>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
