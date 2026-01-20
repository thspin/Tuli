'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddActionMenu from './AddActionMenu';
import AddTransferButton from './AddTransferButton';
import AddInstitutionButton from './AddInstitutionButton';
import InstitutionListItem from './InstitutionListItem';
import ProductCard from './ProductCard';
import ProductDetailsPanel from './ProductDetailsPanel';
import CreditCardStack from './CreditCardStack';
import AccountCarousel from './AccountCarousel';
import UploadStatementButton from './UploadStatementButton';
import { Card } from '@/src/components/ui';

import {
    Product,
    InstitutionWithProducts,
} from '@/src/types';

interface AccountsClientProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    usdToArsRate: number | null;
}

export default function AccountsClient({ institutions, cashProducts, usdToArsRate }: AccountsClientProps) {
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(
        institutions.length > 0 ? institutions[0].id : null
    );
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const selectedInstitution = institutions.find(inst => inst.id === selectedInstitutionId);

    // Get all liquidity accounts for credit card payments
    const allLiquidityAccounts = institutions.flatMap(inst =>
        inst.products
            .filter(p => ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT'].includes(p.type))
            .map(p => ({
                id: p.id,
                name: p.name,
                balance: p.balance,
                currency: p.currency,
                type: p.type,
                institutionId: inst.id
            }))
    );

    const totalBalance = selectedInstitution?.products.reduce((sum, product) => {
        const balance = product.currency === 'ARS' ? Number(product.balance) : (product.currency === 'USD' && usdToArsRate ? Number(product.balance) * usdToArsRate : 0);
        return sum + balance;
    }, 0) || 0;

    const balanceColorClass = totalBalance >= 0 ? 'text-white' : 'text-red-400';

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">Finance OS</span>
                        <span className="text-white/30">/</span>
                        <span className="text-blue-300 text-[10px] uppercase tracking-[0.2em] font-black">Billetera</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight glass-text">Billetera</h1>
                            <p className="text-white/60 font-medium text-sm">Gestiona tu liquidez y activos financieros.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <AddTransferButton
                                institutions={institutions}
                                cashProducts={cashProducts}
                            />
                            <AddActionMenu institutions={institutions} />
                        </div>
                    </div>
                </div>

                {/* Main Content: Institutions List */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Institutions List - Glass Card */}
                    <div className="lg:col-span-4 glass-card p-6">
                        <div className="flex items-center gap-3 mb-6 px-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <span className="material-symbols-outlined text-xl">account_balance</span>
                            </div>
                            <h2 className="text-lg font-bold text-white glass-text">Instituciones</h2>
                        </div>

                        {institutions.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                {institutions.map((institution) => (
                                    <InstitutionListItem
                                        key={institution.id}
                                        institution={institution}
                                        onClick={() => setSelectedInstitutionId(institution.id)}
                                        isSelected={selectedInstitutionId === institution.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-white/30 mb-3">account_balance</span>
                                <p className="text-white/70 font-medium text-sm">No hay instituciones</p>
                                <p className="text-white/40 text-xs mt-1">Agrega tu primera institución</p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Account Details Panel - Glass Card */}
                    <div className="lg:col-span-8">
                        {selectedInstitution ? (
                            <div className="glass-card p-6">
                                {/* Institution Header */}
                                <div className="mb-6 pb-6 border-b border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-2xl font-bold text-white glass-text">
                                            {selectedInstitution.name}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <UploadStatementButton institution={selectedInstitution} />
                                            <AddInstitutionButton
                                                mode="edit"
                                                institution={selectedInstitution}
                                                variant="default"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white/60">Total balance:</span>
                                        <span className={`text-xl font-bold ${balanceColorClass} glass-text`}>
                                            $ {totalBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Accounts Section */}
                                <div className="mb-6">
                                    {selectedInstitution.products.filter(p => !['CREDIT_CARD', 'DEBIT_CARD'].includes(p.type)).length > 0 ? (
                                        <AccountCarousel
                                            products={selectedInstitution.products
                                                .filter(p => !['CREDIT_CARD', 'DEBIT_CARD'].includes(p.type))
                                                .sort((a, b) => b.balance - a.balance)
                                            }
                                            institutionName={selectedInstitution.name}
                                            onSelect={(product) => setSelectedProduct(product)}
                                            selectedProductId={selectedProduct?.id}
                                        />
                                    ) : (
                                        <div className="h-32 flex flex-col items-center justify-center text-center border border-dashed border-white/20 rounded-2xl bg-white/5">
                                            <span className="material-symbols-outlined text-4xl text-white/20 mb-2">savings</span>
                                            <p className="text-white/40 font-medium text-sm">No hay cuentas activas</p>
                                        </div>
                                    )}
                                </div>

                                {/* Cards Section */}
                                {selectedInstitution.products.filter(p => ['CREDIT_CARD', 'DEBIT_CARD'].includes(p.type)).length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4 px-1">
                                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">TARJETAS</h3>
                                        </div>
                                        <CreditCardStack
                                            products={selectedInstitution.products.filter(p => ['CREDIT_CARD', 'DEBIT_CARD'].includes(p.type))}
                                            institutionName={selectedInstitution.name}
                                            onSelect={(product) => setSelectedProduct(product)}
                                            selectedProductId={selectedProduct?.id}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-white/40">touch_app</span>
                                </div>
                                <h3 className="text-xl font-bold text-white/70 glass-text">Selecciona una institución</h3>
                                <p className="text-white/40 text-sm mt-2">Elige una institución para ver sus productos</p>
                            </div>
                        )}
                    </div>

                    {/* Empty State */}
                    {institutions.length === 0 && cashProducts.length === 0 && (
                        <div className="lg:col-span-12 glass-card p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-3xl animate-ping" />
                                <span className="material-symbols-outlined text-blue-400 text-5xl relative z-10">wallet</span>
                            </div>
                            <h3 className="text-white text-3xl font-black mb-4 tracking-tight glass-text">Tu billetera está vacía</h3>
                            <p className="text-white/60 font-medium mb-8 text-center max-w-sm text-lg">
                                Comienza agregando tus cuentas bancarias, billeteras virtuales o efectivo para un control inteligente.
                            </p>
                            <AddActionMenu institutions={institutions} />
                        </div>
                    )}
                </div>

                {/* Product Details Panel */}
                {selectedProduct && selectedInstitution && (
                    <ProductDetailsPanel
                        product={selectedProduct}
                        institutionName={selectedInstitution.name}
                        institutionId={selectedInstitution.id}
                        availableAccounts={allLiquidityAccounts}
                        onClose={() => setSelectedProduct(null)}
                    />
                )}
            </div>
        </div>
    );
}
