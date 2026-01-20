'use client'

import React, { useState, useEffect } from 'react';
import { ServiceBill, Service, Category } from '@prisma/client';
import BillsManager from './BillsManager';
import ServiceList from './ServiceList';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import { getMonthlyBills, getServices } from '@/src/actions/services/service-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import { formatDate } from '@/src/utils/date';

type ServiceWithDetails = Service & {
    category: Category;
    paymentRules: any[];
};

type BillWithDetails = ServiceBill & {
    service: ServiceWithDetails;
    transaction: any;
};

export default function ServicesClient() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bills, setBills] = useState<BillWithDetails[]>([]);
    const [overdueBills, setOverdueBills] = useState<BillWithDetails[]>([]);
    const [services, setServices] = useState<ServiceWithDetails[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'bills' | 'services'>('bills');

    const fetchData = async () => {
        setLoading(true);
        try {
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            const [billsRes, servicesRes, categoriesRes] = await Promise.all([
                getMonthlyBills(month, year),
                getServices(),
                getCategories('EXPENSE')
            ]);

            if (billsRes.success && 'data' in billsRes) {
                setBills(billsRes.data as BillWithDetails[]);
                setOverdueBills(('overdue' in billsRes ? billsRes.overdue : []) as BillWithDetails[]);
            }
            if (servicesRes.success && 'data' in servicesRes) {
                setServices(servicesRes.data as ServiceWithDetails[]);
            }
            if (categoriesRes.success) setCategories(categoriesRes.categories);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const handleMonthChange = (increment: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setSelectedDate(newDate);
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Inicio</span>
                            <span className="text-white/30">/</span>
                            <span className="text-blue-300 text-[10px] uppercase tracking-wider font-semibold">Servicios</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white glass-text tracking-tight">Servicios</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Calendar Controls */}
                        <div className={`transition-all duration-300 transform ${view === 'bills' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none hidden md:flex'}`}>
                            {view === 'bills' && (
                                <div className="flex items-center gap-1 glass-card px-2 py-2 pr-4">
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => handleMonthChange(-1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                        </button>
                                        <button
                                            onClick={() => handleMonthChange(1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                        </button>
                                    </div>
                                    <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
                                    <span className="font-bold text-sm text-white capitalize min-w-[100px] text-center">
                                        {formatDate(selectedDate, { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* View Toggle - Glass Style */}
                        <div className="flex glass-card p-1.5">
                            <button
                                onClick={() => setView('bills')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${view === 'bills'
                                    ? 'bg-white/20 text-white shadow-lg'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    }`}
                            >
                                Vencimientos
                            </button>
                            <button
                                onClick={() => setView('services')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${view === 'services'
                                    ? 'bg-white/20 text-white shadow-lg'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    }`}
                            >
                                Mis Servicios
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
                        <LoadingSpinner size="lg" color="blue" />
                        <p className="text-sm font-semibold text-white/60">Cargando servicios...</p>
                    </div>
                ) : (
                    <>
                        {view === 'bills' ? (
                            <BillsManager
                                bills={bills}
                                overdueBills={overdueBills}
                                services={services}
                                onRefresh={fetchData}
                                currentDate={selectedDate}
                            />
                        ) : (
                            <ServiceList
                                services={services}
                                categories={categories}
                                onRefresh={fetchData}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
