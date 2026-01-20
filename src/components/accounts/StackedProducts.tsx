'use client'

import { useState } from 'react';
import { Product } from '@/src/types';
import { getCurrencySymbol } from '@/src/utils/validations';

interface StackedProductsProps {
    products: Product[];
    institutionName: string;
    onProductClick: (productId: string) => void;
    selectedProductId?: string | null;
    type: 'accounts' | 'cards';
}

export default function StackedProducts({
    products,
    institutionName,
    onProductClick,
    selectedProductId,
    type
}: StackedProductsProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (products.length === 0) return null;

    const getProductIcon = (product: Product) => {
        if (product.type === 'CREDIT_CARD' || product.type === 'DEBIT_CARD') return 'credit_card';
        if (product.type === 'LOAN') return 'money_off';
        return 'account_balance';
    };

    const getProductTypeLabel = (product: Product) => {
        if (product.type === 'CREDIT_CARD') return 'Crédito';
        if (product.type === 'DEBIT_CARD') return 'Débito';
        if (product.type === 'LOAN') return 'Préstamo';
        return 'Cuenta';
    };

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center gap-2 px-1">
                <div className={`w-7 h-7 rounded-lg ${type === 'accounts' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {type === 'accounts' ? 'account_balance' : 'credit_card'}
                    </span>
                </div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">
                    {type === 'accounts' ? 'Cuentas' : 'Tarjetas'}
                </p>
                <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {products.length}
                </span>
            </div>

            {/* Stacked Cards */}
            <div
                className="relative"
                style={{ height: `${Math.min(products.length * 72 + 20, 300)}px` }}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {products.map((product, index) => {
                    const isHovered = hoveredIndex === index;
                    const isSelected = selectedProductId === product.id;
                    const totalProducts = products.length;

                    // Calculate position
                    let translateY = 0;
                    let zIndex = totalProducts - index;

                    if (hoveredIndex !== null) {
                        // When hovering, spread cards out
                        if (index < hoveredIndex) {
                            translateY = index * 80;
                        } else if (index === hoveredIndex) {
                            translateY = index * 80;
                            zIndex = totalProducts + 1;
                        } else {
                            translateY = hoveredIndex * 80 + (index - hoveredIndex) * 80 + 60;
                        }
                    } else {
                        // Default stacked position
                        translateY = index * 20;
                    }

                    return (
                        <div
                            key={product.id}
                            className={`
                                absolute left-0 right-0 transition-all duration-300 ease-out cursor-pointer
                                ${isHovered ? 'scale-105' : 'scale-100'}
                            `}
                            style={{
                                transform: `translateY(${translateY}px)`,
                                zIndex: isSelected ? totalProducts + 10 : zIndex,
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onClick={() => onProductClick(product.id)}
                        >
                            <div className={`
                                rounded-2xl p-4 border-2 transition-all duration-300
                                ${isSelected
                                    ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200'
                                    : isHovered
                                        ? 'bg-white border-slate-200 shadow-xl'
                                        : 'bg-white border-slate-100 shadow-md'
                                }
                            `}>
                                <div className="flex items-center justify-between">
                                    {/* Left: Icon + Name */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`
                                            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                                            ${isSelected
                                                ? 'bg-white/20 text-white'
                                                : product.type === 'LOAN'
                                                    ? 'bg-red-50 text-red-500'
                                                    : type === 'cards'
                                                        ? 'bg-purple-50 text-purple-500'
                                                        : 'bg-blue-50 text-blue-500'
                                            }
                                        `}>
                                            <span className="material-symbols-outlined text-[22px]">
                                                {getProductIcon(product)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-bold tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                {product.name}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {getProductTypeLabel(product)}
                                                </span>
                                                {product.lastFourDigits && (
                                                    <>
                                                        <span className={`text-[10px] ${isSelected ? 'text-white/50' : 'text-slate-300'}`}>•</span>
                                                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                                            •••• {product.lastFourDigits}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Balance */}
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                                {getCurrencySymbol(product.currency)}
                                            </span>
                                            <span className={`text-xl font-black tracking-tighter ${isSelected
                                                ? 'text-white'
                                                : product.balance < 0
                                                    ? 'text-red-600'
                                                    : 'text-slate-900'
                                                }`}>
                                                {product.balance.toLocaleString('es-AR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
