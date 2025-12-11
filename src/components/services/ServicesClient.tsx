'use client'

import React, { useState, useEffect } from 'react';
import { ServiceBill, Service, FinancialProduct, Category } from '@prisma/client';
import BillsManager from './BillsManager';
import ServiceList from './ServiceList';
import Button from '../ui/Button';
import { getMonthlyBills, getServices } from '@/src/actions/services/service-actions';
import { getCategories } from '@/src/actions/categories/category-actions';

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

            if (billsRes.success) {
                setBills(billsRes.data as BillWithDetails[]);
                setOverdueBills((billsRes as any).overdue || []);
            }
            if (servicesRes.success) setServices(servicesRes.data as ServiceWithDetails[]);
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
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Servicios</h1>
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setView('bills')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'bills' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Vencimientos
                        </button>
                        <button
                            onClick={() => setView('services')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'services' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Mis Servicios
                        </button>
                    </div>
                </div>

                {view === 'bills' && (
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => handleMonthChange(-1)}>
                            ← Anterior
                        </Button>
                        <span className="font-semibold text-lg min-w-[140px] text-center capitalize">
                            {selectedDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => handleMonthChange(1)}>
                            Siguiente →
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    );
}
