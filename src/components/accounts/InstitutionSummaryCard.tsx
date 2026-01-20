'use client'

import React from 'react';
import { InstitutionWithProducts, Product } from '@/src/types';
import { getCurrencySymbol } from '@/src/utils/validations';
import AddTransferButton from './AddTransferButton';
import { Card } from '@/src/components/ui';

interface InstitutionSummaryCardProps {
    institution: InstitutionWithProducts;
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    selectedProductId?: string | null;
}

export default function InstitutionSummaryCard({
    institution,
    institutions,
    cashProducts,
    selectedProductId
}: InstitutionSummaryCardProps) {
    const arsBalance = institution.products
        .filter(p => p.currency === 'ARS' && p.type !== 'CREDIT_CARD' && p.type !== 'LOAN')
        .reduce((sum, p) => sum + p.balance, 0);

    const usdBalance = institution.products
        .filter(p => p.currency === 'USD' && p.type !== 'CREDIT_CARD' && p.type !== 'LOAN')
        .reduce((sum, p) => sum + p.balance, 0);

    const hasUsd = usdBalance > 0 || institution.products.some(p => p.currency === 'USD');

    return (
        <Card padding="none" className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white relative group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-600/10 transition-colors duration-500" />

            {/* Main Content */}
            <div className="p-4 relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <span className="material-symbols-outlined text-xl font-light">
                                {institution.type === 'BANK' ? 'account_balance' : 'phone_iphone'}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Operativa</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                {institution.name}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Saldo Líquido Consolidado
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-3xl font-black tracking-tighter ${arsBalance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {getCurrencySymbol('ARS')} {arsBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        {hasUsd && (
                            <div className="flex items-center gap-2 py-1">
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-lg font-black tracking-tight ${usdBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {getCurrencySymbol('USD')} {usdBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                    <span className="material-symbols-outlined text-[12px] font-bold">trending_up</span>
                                    <span className="text-[9px] font-black uppercase tracking-wider">+2.4%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </Card>
    );
}
