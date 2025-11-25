'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddInstitutionButton from './AddInstitutionButton';
import AddProductButton from './AddProductButton';
import AddTransactionButton from '../transactions/AddTransactionButton';
import AddIncomeButton from './AddIncomeButton';

import { getCurrencySymbol, formatNumber } from '@/lib/validations';

type DisplayCurrency = 'ARS' | 'USD';
type ProductType = 'CASH' | 'SAVINGS_ACCOUNT' | 'CHECKING_ACCOUNT' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'LOAN';
type Currency = 'ARS' | 'USD' | 'USDT' | 'USDC' | 'BTC';

interface Product {
    id: string;
    name: string;
    type: ProductType;
    currency: Currency;
    balance: number;
    closingDay?: number | null;
    dueDay?: number | null;
    limit?: number | null;
    sharedLimit?: boolean;
    institutionId?: string | null;
}

interface Institution {
    id: string;
    name: string;
    type: 'BANK' | 'WALLET';
    products: Product[];
}

interface AccountsClientProps {
    institutions: Institution[];
    cashProducts: Product[];
    usdToArsRate: number | null;
}

const PRODUCT_TYPE_ICONS: Record<ProductType, string> = {
    CASH: '💵',
    SAVINGS_ACCOUNT: '🏦',
    CHECKING_ACCOUNT: '📋',
    DEBIT_CARD: '💳',
    CREDIT_CARD: '💳',
    LOAN: '📊',
};

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    CASH: 'Efectivo',
    SAVINGS_ACCOUNT: 'Caja de Ahorro',
    CHECKING_ACCOUNT: 'Cuenta Corriente',
    DEBIT_CARD: 'Tarjeta de Débito',
    CREDIT_CARD: 'Tarjeta de Crédito',
    LOAN: 'Préstamo',
};

const formatCurrency = (amount: number, currency: DisplayCurrency) => {
    const symbol = currency === 'ARS' ? '$' : 'US$';
    const formatted = formatNumber(amount, 2);
    return `${symbol} ${formatted}`;
};

export default function AccountsClient({ institutions, cashProducts, usdToArsRate }: AccountsClientProps) {
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('ARS');

    const router = useRouter();

    const convertAmount = (amount: number, fromCurrency: Currency): number => {
        if (displayCurrency === 'ARS') {
            if (fromCurrency === 'USD') {
                return amount * (usdToArsRate || 1350);
            }
            return amount;
        } else {
            // displayCurrency === 'USD'
            if (fromCurrency === 'ARS') {
                return amount / (usdToArsRate || 1350);
            }
            return amount;
        }
    };

    const calculateInstitutionBalance = (products: Product[]): number => {
        return products.reduce((sum, product) => {
            const converted = convertAmount(product.balance, product.currency);
            return sum + converted;
        }, 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Mis Cuentas</h1>
                    <div className="flex gap-4 items-center">
                        {/* Currency Toggle */}
                        {usdToArsRate && (
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                                <span className="text-sm text-gray-600">Ver en:</span>
                                <button
                                    onClick={() => setDisplayCurrency(displayCurrency === 'ARS' ? 'USD' : 'ARS')}
                                    className={`px-3 py-1 rounded text-sm font-medium transition ${displayCurrency === 'ARS'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    ARS
                                </button>
                                <button
                                    onClick={() => setDisplayCurrency(displayCurrency === 'USD' ? 'ARS' : 'USD')}
                                    className={`px-3 py-1 rounded text-sm font-medium transition ${displayCurrency === 'USD'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    USD
                                </button>
                                <span className="text-xs text-gray-500 ml-2">
                                    1 USD = ${formatNumber(usdToArsRate, 2)}
                                </span>
                            </div>
                        )}

                        <AddTransactionButton institutions={institutions} cashProducts={cashProducts} />
                        <AddIncomeButton institutions={institutions} cashProducts={cashProducts} />
                        <AddInstitutionButton />
                        <AddProductButton institutions={institutions} />
                    </div >
                </div >

                {/* Efectivo */}
                {
                    cashProducts.length > 0 && (
                        <div className="mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold text-gray-700">💵 Efectivo</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {cashProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => router.push(`/accounts/${product.id}`)}
                                        className="bg-white rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <AddProductButton mode="edit" product={product} institutions={institutions} />
                                                </div>
                                                <span className="text-2xl">{PRODUCT_TYPE_ICONS[product.type]}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">{getCurrencySymbol(product.currency)}</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(convertAmount(product.balance, product.currency), displayCurrency)}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Original: {getCurrencySymbol(product.currency)} {formatNumber(product.balance, 2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Instituciones */}
                {
                    institutions.map((institution) => (
                        <div key={institution.id} className="mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="mb-4 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {institution.type === 'BANK' ? '🏦' : '📱'} {institution.name}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            Balance total: {formatCurrency(calculateInstitutionBalance(institution.products), displayCurrency)}
                                        </p>
                                    </div>
                                    <AddInstitutionButton mode="edit" institution={institution} />
                                </div>

                                {institution.products.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {institution.products.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => router.push(`/accounts/${product.id}`)}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700">{product.name}</h4>
                                                        <span className="text-xs text-gray-500">{PRODUCT_TYPE_LABELS[product.type]}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <AddProductButton mode="edit" product={product} institutions={institutions} />
                                                        </div>
                                                        <span className="text-xl">{PRODUCT_TYPE_ICONS[product.type]}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-500 mb-1">Saldo</p>
                                                    <p
                                                        className={`text-xl font-bold ${product.balance < 0 ? 'text-red-600' : 'text-green-600'
                                                            }`}
                                                    >
                                                        {formatCurrency(convertAmount(product.balance, product.currency), displayCurrency)}
                                                    </p>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {getCurrencySymbol(product.currency)} {formatNumber(product.balance, 2)}
                                                    </div>
                                                </div>

                                                {product.type === 'CREDIT_CARD' && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                                                        <span>Cierre: {product.closingDay}</span>
                                                        <span>Vence: {product.dueDay}</span>
                                                    </div>
                                                )}

                                                {product.type === 'LOAN' && product.limit && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                                        <span>Límite disponible: {getCurrencySymbol(product.currency)} {formatNumber(product.limit, 2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">
                                        No hay productos en esta institución
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                }

                {/* Estado vacío */}
                {
                    institutions.length === 0 && cashProducts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg mb-4">
                                No tienes cuentas registradas
                            </p>
                            <p className="text-gray-400">
                                Comienza agregando una institución o efectivo
                            </p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
