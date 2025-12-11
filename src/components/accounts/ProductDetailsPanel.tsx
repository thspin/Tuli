'use client'

import { Product, CARD_PROVIDER_LABELS, PRODUCT_TYPE_LABELS } from '@/src/types';
import { getCurrencySymbol, formatNumber } from '@/src/utils/validations';
import { useState } from 'react';
import EditProductModal from './EditProductModal';

interface ProductDetailsPanelProps {
    product: Product;
    institutionName: string;
    onClose: () => void;
}

export default function ProductDetailsPanel({ product, institutionName, onClose }: ProductDetailsPanelProps) {
    const [showFullNumber, setShowFullNumber] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isCredit = product.type === 'CREDIT_CARD';
    const isDebit = product.type === 'DEBIT_CARD';
    const isCard = isCredit || isDebit;

    // Formatear número de tarjeta
    const cardNumber = showFullNumber && product.lastFourDigits
        ? `1234 5678 9012 ${product.lastFourDigits}`
        : product.lastFourDigits
            ? `•••• •••• •••• ${product.lastFourDigits}`
            : '•••• •••• •••• ••••';

    const expiryDate = product.closingDay && product.dueDay
        ? `${String(product.closingDay).padStart(2, '0')}/${String(new Date().getFullYear() + 5).toString().slice(-2)}`
        : 'N/A';

    return (
        <>
            {/* Backdrop para mobile */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-background border-l border-border shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border px-6 py-5 flex items-start justify-between z-10">
                    <div className="flex items-start gap-3">
                        {/* Ícono con gradiente */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Detalles {isCard ? 'de Tarjeta' : 'del Producto'}</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">{institutionName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0"
                        aria-label="Cerrar"
                    >
                        <svg className="w-5 h-5 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* Balance Actual - Destacado */}
                    <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">💰</span>
                            <p className="text-sm font-medium text-muted-foreground">Saldo Actual</p>
                        </div>
                        <p className={`text-4xl font-bold ${product.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {getCurrencySymbol(product.currency)} {formatNumber(product.balance, 2)}
                        </p>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-border/50" />

                    {/* Información Básica */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Información Básica
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Nombre */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Nombre del Producto</p>
                                <p className="text-base font-semibold text-foreground">{product.name}</p>
                            </div>

                            {/* Tipo */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Tipo</p>
                                <p className="text-base font-semibold text-foreground">{PRODUCT_TYPE_LABELS[product.type]}</p>
                            </div>

                            {/* Provider (solo para tarjetas) */}
                            {isCard && product.provider && (
                                <div className="bg-muted/30 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Proveedor</p>
                                    <p className="text-base font-semibold text-foreground">{CARD_PROVIDER_LABELS[product.provider]}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Separador */}
                    {isCard && <div className="border-t border-border/50" />}

                    {/* Detalles Financieros (solo tarjetas) */}
                    {isCard && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Detalles Financieros
                            </h3>

                            {/* Número de tarjeta */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Número de Tarjeta</p>
                                <p className="text-base font-mono font-semibold text-foreground tracking-wider">{cardNumber}</p>
                            </div>

                            {/* Titular y Vencimiento en grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/30 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Titular</p>
                                    <p className="text-sm font-semibold text-foreground">Usuario Principal</p>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Vencimiento</p>
                                    <p className="text-sm font-mono font-semibold text-foreground">{expiryDate}</p>
                                </div>
                            </div>

                            {/* Días de cierre y vencimiento (solo crédito) */}
                            {isCredit && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/30 rounded-xl p-4">
                                        <p className="text-xs text-muted-foreground mb-1.5 font-medium">Día de Cierre</p>
                                        <p className="text-2xl font-bold text-foreground">{product.closingDay || 'N/A'}</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-xl p-4">
                                        <p className="text-xs text-muted-foreground mb-1.5 font-medium">Vencimiento</p>
                                        <p className="text-2xl font-bold text-foreground">{product.dueDay || 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Límites (para tarjetas de crédito) */}
                            {isCredit && (product.limitSinglePayment || product.limitInstallments) && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-3 font-medium">Límites de Crédito</p>
                                    <div className="space-y-2">
                                        {product.limitSinglePayment && (
                                            <div className="flex justify-between items-center bg-muted/40 rounded-lg px-4 py-3 border border-border/50">
                                                <span className="text-sm text-muted-foreground">Compras</span>
                                                <span className="text-sm font-bold text-foreground">
                                                    {getCurrencySymbol(product.currency)} {formatNumber(product.limitSinglePayment, 2)}
                                                </span>
                                            </div>
                                        )}
                                        {product.limitInstallments && (
                                            <div className="flex justify-between items-center bg-muted/40 rounded-lg px-4 py-3 border border-border/50">
                                                <span className="text-sm text-muted-foreground">Cuotas</span>
                                                <span className="text-sm font-bold text-foreground">
                                                    {getCurrencySymbol(product.currency)} {formatNumber(product.limitInstallments, 2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Separador */}
                    <div className="border-t border-border/50" />

                    {/* Estado y Configuración */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Estado
                        </h3>

                        <div className="flex gap-3">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success text-sm font-semibold border border-success/20">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                Activo
                            </span>
                        </div>
                    </div>

                    {/* Acciones */}
                    {isCard && (
                        <>
                            <div className="border-t border-border/50" />

                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Acciones
                                </h3>

                                <div className="space-y-2">
                                    {/* Mostrar/Ocultar número */}
                                    <button
                                        onClick={() => setShowFullNumber(!showFullNumber)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card hover:bg-accent border border-border hover:border-primary/50 transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {showFullNumber ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                )}
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {showFullNumber ? 'Ocultar Número' : 'Mostrar Número'}
                                        </span>
                                    </button>

                                    {/* Descargar extracto */}
                                    <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card hover:bg-accent border border-border hover:border-primary/50 transition-all group">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Descargar Extracto</span>
                                    </button>

                                    {/* Editar producto */}
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card hover:bg-accent border border-border hover:border-primary/50 transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Editar Producto</span>
                                    </button>

                                    {/* Establecer como predeterminado */}
                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold transition-all shadow-sm hover:shadow-md">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        Establecer como Predeterminado
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Botón editar para productos que no son tarjetas */}
                    {!isCard && (
                        <>
                            <div className="border-t border-border/50" />
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Acciones
                                </h3>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card hover:bg-accent border border-border hover:border-primary/50 transition-all group"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Editar Producto</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Product Modal */}
            <EditProductModal
                product={product}
                institutionName={institutionName}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </>
    );
}
