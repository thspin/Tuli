'use client'

import { Product } from '@/src/types';
import { getCurrencySymbol } from '@/src/utils/validations';

interface CompactProductCardProps {
    product: Product;
    institutionName: string;
    onClick: () => void;
    isSelected?: boolean;
}

export default function CompactProductCard({ product, onClick, isSelected }: CompactProductCardProps) {
    const isCredit = product.type === 'CREDIT_CARD';
    const isDebit = product.type === 'DEBIT_CARD';
    const isLoan = product.type === 'LOAN';
    const showCard = isCredit || isDebit;

    return (
        <div
            onClick={onClick}
            className={`
                relative rounded-2xl p-4 cursor-pointer
                transition-all duration-300 ease-out
                group overflow-hidden flex-shrink-0
                ${isSelected
                    ? 'bg-blue-600 shadow-lg shadow-blue-200 scale-105'
                    : 'bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5'
                }
                w-[180px] h-[140px]
            `}
        >
            {/* Icon and Type */}
            <div className="flex items-start justify-between mb-3">
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${isSelected
                        ? 'bg-white/10 text-white'
                        : (isLoan ? 'bg-red-50 text-red-500' : showCard ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500')
                    }
                `}>
                    <span className="material-symbols-outlined text-[20px] font-light">
                        {isLoan ? 'money_off' : showCard ? 'credit_card' : 'account_balance'}
                    </span>
                </div>
                <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {product.type === 'CREDIT_CARD' ? 'Crédito' : product.type === 'DEBIT_CARD' ? 'Débito' : product.type === 'LOAN' ? 'Préstamo' : 'Cuenta'}
                </div>
            </div>

            {/* Product Name */}
            <h4 className={`text-sm font-bold tracking-tight mb-2 line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {product.name}
            </h4>

            {/* Balance */}
            <div className="mt-auto">
                <span className={`text-[8px] font-black uppercase tracking-wider block mb-0.5 ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                    {isLoan ? 'Deuda' : 'Saldo'}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {getCurrencySymbol(product.currency)}
                    </span>
                    <span className={`text-xl font-black tracking-tighter ${isSelected ? 'text-white' : (product.balance < 0 ? 'text-red-600' : 'text-slate-900')}`}>
                        {product.balance.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>

            {/* Card number for cards */}
            {showCard && product.lastFourDigits && (
                <div className={`absolute bottom-2 right-3 text-[10px] font-mono ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                    •••• {product.lastFourDigits}
                </div>
            )}
        </div>
    );
}
