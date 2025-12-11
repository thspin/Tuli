'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'
import AddInstitutionButton from './AddInstitutionButton';
import AddProductButton from './AddProductButton';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import InstitutionCarousel from './InstitutionCarousel';
import ProductCard from './ProductCard';
import ProductDetailsPanel from './ProductDetailsPanel';

import { formatNumber } from '@/src/utils/validations';
import {
    Product,
    InstitutionWithProducts,
    DisplayCurrency,
    Currency,
} from '@/src/types';

interface AccountsClientProps {
    institutions: InstitutionWithProducts[];
    cashProducts: Product[];
    usdToArsRate: number | null;
}

const formatCurrency = (amount: number, currency: DisplayCurrency) => {
    const symbol = currency === 'ARS' ? '$' : 'US$';
    const formatted = formatNumber(amount, 2);
    return `${symbol} ${formatted}`;
};

export default function AccountsClient({ institutions, cashProducts, usdToArsRate }: AccountsClientProps) {
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('ARS');
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(
        institutions.length > 0 ? institutions[0].id : null
    );
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

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

    const selectedInstitution = institutions.find(inst => inst.id === selectedInstitutionId);
    const selectedProduct = selectedInstitution?.products.find(p => p.id === selectedProductId) ||
        cashProducts.find(p => p.id === selectedProductId);

    const handleProductClick = (productId: string) => {
        setSelectedProductId(productId);
    };

    const handleClosePanel = () => {
        setSelectedProductId(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header fijo */}
                <div className="mb-6">
                    {/* Navigation */}
                    <div className="mb-6 flex gap-3 justify-between items-center">
                        <Link
                            href="/"
                            className="bg-card hover:bg-accent text-card-foreground px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-border"
                        >
                            ← Inicio
                        </Link>
                        <ThemeSwitcher />
                    </div>

                    {/* Título y subtítulo */}
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Mis Cuentas</h1>
                        <p className="text-muted-foreground text-sm md:text-base">Gestiona tus productos financieros</p>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {/* Currency Toggle */}
                        {usdToArsRate && (
                            <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-xl shadow-sm border border-border">
                                <span className="text-sm text-muted-foreground font-medium">Ver en:</span>
                                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                    <button
                                        onClick={() => setDisplayCurrency('ARS')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${displayCurrency === 'ARS'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        ARS
                                    </button>
                                    <button
                                        onClick={() => setDisplayCurrency('USD')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${displayCurrency === 'USD'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        USD
                                    </button>
                                </div>
                                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                                    1 USD = ${formatNumber(usdToArsRate, 2)}
                                </span>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3 flex-wrap">
                            <AddInstitutionButton />
                            <AddProductButton institutions={institutions} />
                        </div>
                    </div>
                </div>

                {/* Carrusel de Instituciones */}
                {institutions.length > 0 && (
                    <InstitutionCarousel
                        institutions={institutions}
                        selectedInstitutionId={selectedInstitutionId}
                        onSelectInstitution={setSelectedInstitutionId}
                    />
                )}

                {/* Área de Productos */}
                <div className="mb-8">
                    {/* Efectivo - siempre visible si hay */}
                    {cashProducts.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center gap-2 mb-6">
                                <h2 className="text-xl md:text-2xl font-semibold text-foreground">💵 Efectivo</h2>
                                <span className="text-sm text-muted-foreground">({cashProducts.length})</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cashProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        institutionName="Efectivo"
                                        onClick={() => router.push(`/accounts/${product.id}`)}
                                        isSelected={selectedProductId === product.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Productos de la institución seleccionada */}
                    {selectedInstitution && (
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                                    {selectedInstitution.type === 'BANK' ? '🏦' : '📱'} {selectedInstitution.name}
                                </h2>
                                <span className="text-sm text-muted-foreground">
                                    ({selectedInstitution.products.length} {selectedInstitution.products.length === 1 ? 'producto' : 'productos'})
                                </span>
                            </div>

                            {selectedInstitution.products.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {selectedInstitution.products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            institutionName={selectedInstitution.name}
                                            onClick={() => handleProductClick(product.id)}
                                            isSelected={selectedProductId === product.id}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-card border-2 border-dashed border-border rounded-2xl">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-muted-foreground text-lg mb-4">No hay productos en esta institución</p>
                                    <AddProductButton institutions={institutions} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado vacío total */}
                    {institutions.length === 0 && cashProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-card border-2 border-dashed border-border rounded-2xl">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <h3 className="text-foreground text-xl font-semibold mb-2">No tienes cuentas registradas</h3>
                            <p className="text-muted-foreground mb-6">Comienza agregando una institución o efectivo</p>
                            <div className="flex gap-3">
                                <AddInstitutionButton />
                                <AddProductButton institutions={institutions} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel de Detalles */}
            {selectedProductId && selectedProduct && (
                <ProductDetailsPanel
                    product={selectedProduct}
                    institutionName={selectedInstitution?.name || 'Efectivo'}
                    onClose={handleClosePanel}
                />
            )}
        </div>
    );
}
