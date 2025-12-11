'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateAllSummaries, getProductSummaries, getSummaryDetail } from '@/src/actions/summaries/summary-actions';
import { payOffSummary, getPaymentAccounts } from '@/src/actions/summaries/payment-actions';
import { getCategories } from '@/src/actions/categories/category-actions';
import { Product, Summary, MONTH_NAMES } from '@/src/types';
import ThemeSwitcher from '../ui/ThemeSwitcher';

interface SummariesViewProps {
    products: Product[];
}

export default function SummariesView({ products }: SummariesViewProps) {
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [summaries, setSummaries] = useState<any[]>([]);
    const [selectedSummary, setSelectedSummary] = useState<any>(null);
    const [summaryDetail, setSummaryDetail] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Payment modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
    const [selectedPaymentAccount, setSelectedPaymentAccount] = useState('');
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    // Extra charges states
    const [extraCharges, setExtraCharges] = useState<Array<{ id: string, description: string, amount: string, category: string }>>([]);

    // Categorization states
    const [categories, setCategories] = useState<any[]>([]);
    const [uncategorizedTransactions, setUncategorizedTransactions] = useState<any[]>([]);
    const [transactionCategories, setTransactionCategories] = useState<Map<string, string>>(new Map());
    const [unexplainedAmount, setUnexplainedAmount] = useState<number>(0);
    const [unexplainedCategory, setUnexplainedCategory] = useState<{ description: string, categoryId: string } | null>(null);

    // Receipt modal states
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Cargar resúmenes cuando se selecciona un producto
    useEffect(() => {
        if (selectedProductId) {
            loadSummaries();
        } else {
            setSummaries([]);
            setSelectedSummary(null);
            setSummaryDetail(null);
        }
    }, [selectedProductId]);

    const loadSummaries = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getProductSummaries(selectedProductId);
            if (result.success) {
                setSummaries(result.summaries || []);
            } else {
                setError(result.error || 'Error al cargar resúmenes');
            }
        } catch (err) {
            setError('Error al cargar resúmenes');
        } finally {
            setIsLoading(false);
        }
    };

    const loadSummaryDetail = async (summary: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getSummaryDetail(selectedProductId, summary.year, summary.month);
            if (result.success) {
                setSummaryDetail(result);
                setSelectedSummary(summary);
                // Store uncategorized transactions and unexplained balance
                setUncategorizedTransactions(result.uncategorizedTransactions || []);
                setUnexplainedAmount(result.unexplainedBalance || 0);
            } else {
                setError(result.error || 'Error al cargar detalle');
            }
        } catch (err) {
            setError('Error al cargar detalle');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!selectedProduct) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await generateAllSummaries(selectedProductId);
            if (result.success) {
                await loadSummaries();
                if (result.count && result.count > 0) {
                    setError(null);
                } else {
                    setError('No se encontraron transacciones para generar resúmenes');
                }
            } else {
                setError(result.error || 'Error al generar resúmenes');
            }
        } catch (err) {
            setError('Error al generar resúmenes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenPaymentModal = async () => {
        if (!selectedSummary) return;

        setIsPaymentLoading(true);
        setError(null);
        setExtraCharges([]); // Reset extra charges
        setTransactionCategories(new Map()); // Reset transaction categories
        setUnexplainedCategory(null); // Reset unexplained category

        try {
            // Load payment accounts and categories in parallel
            const [accountsResult, categoriesResult] = await Promise.all([
                getPaymentAccounts(Number(selectedSummary.totalAmount)),
                getCategories('EXPENSE') // Only load expense categories
            ]);

            if (accountsResult.success) {
                setPaymentAccounts(accountsResult.accounts || []);
            } else {
                setError(accountsResult.error || 'Error al cargar cuentas de pago');
                return;
            }

            if (categoriesResult.success) {
                setCategories(categoriesResult.categories || []);
            }

            setShowPaymentModal(true);
            setSelectedPaymentAccount('');
        } catch (err) {
            setError('Error al cargar datos de pago');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const addExtraCharge = () => {
        setExtraCharges([...extraCharges, { id: Date.now().toString(), description: '', amount: '', category: '' }]);
    };

    const removeExtraCharge = (id: string) => {
        setExtraCharges(extraCharges.filter(charge => charge.id !== id));
    };

    const updateExtraCharge = (id: string, field: string, value: string) => {
        setExtraCharges(extraCharges.map(charge =>
            charge.id === id ? { ...charge, [field]: value } : charge
        ));
    };

    const getTotalWithExtras = () => {
        const summaryAmount = Number(selectedSummary?.totalAmount || 0);
        const extrasTotal = extraCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
        return summaryAmount + extrasTotal;
    };

    // Category management functions
    const setTransactionCategory = (transactionId: string, categoryId: string) => {
        const newMap = new Map(transactionCategories);
        newMap.set(transactionId, categoryId);
        setTransactionCategories(newMap);
    };

    const canPay = () => {
        // Check if all uncategorized transactions have been assigned a category
        const allTransactionsCategorized = uncategorizedTransactions.every(
            tx => transactionCategories.has(tx.id)
        );

        // Check if unexplained balance has been categorized (if it exists)
        const unexplainedCategorized = unexplainedAmount === 0 || unexplainedCategory !== null;

        // Check if all extra charges have categories
        const allExtrasCategorized = extraCharges.every(charge => charge.category && charge.description && charge.amount);

        return allTransactionsCategorized && unexplainedCategorized && (extraCharges.length === 0 || allExtrasCategorized);
    };

    const handlePaySummary = async () => {
        if (!selectedSummary || !selectedPaymentAccount) return;

        const paymentAccountData = paymentAccounts.find(a => a.id === selectedPaymentAccount);
        const totalAmount = getTotalWithExtras();

        // Validate extra charges
        const validatedExtras = extraCharges.filter(charge =>
            charge.description.trim() && charge.amount && parseFloat(charge.amount) > 0
        );

        // Prepare transaction categories array
        const transCategories = Array.from(transactionCategories.entries()).map(([transactionId, categoryId]) => ({
            transactionId,
            categoryId
        }));

        // Prepare unexplained balance category (if exists)
        const unexplainedCat = unexplainedAmount > 0 && unexplainedCategory ? {
            ...unexplainedCategory,
            amount: unexplainedAmount
        } : undefined;

        setIsPaymentLoading(true);
        setError(null);
        try {
            const result = await payOffSummary(
                selectedSummary.id,
                selectedPaymentAccount,
                validatedExtras,
                transCategories,
                unexplainedCat
            );
            if (result.success) {
                // Preparar datos del comprobante
                const receipt = {
                    date: new Date(),
                    summaryMonth: MONTH_NAMES[selectedSummary.month - 1],
                    summaryYear: selectedSummary.year,
                    amount: totalAmount,
                    extraCharges: validatedExtras,
                    currency: selectedProduct?.currency || 'ARS',
                    productName: selectedProduct?.name || '',
                    paymentAccountName: paymentAccountData?.name || '',
                    paymentAccountType: paymentAccountData?.type || '',
                };

                setReceiptData(receipt);
                setShowPaymentModal(false);
                setSelectedPaymentAccount('');
                setExtraCharges([]);
                setTransactionCategories(new Map());
                setUnexplainedCategory(null);
                setShowReceiptModal(true);

                // Recargar resúmenes
                await loadSummaries();
                // Limpiar selección
                setSelectedSummary(null);
                setSummaryDetail(null);
            } else {
                setError(result.error || 'Error al pagar el resumen');
            }
        } catch (err) {
            setError('Error al pagar el resumen');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currency === 'USD' ? 'US$' : '$';
        return `${symbol} ${amount.toFixed(2)}`;
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-6">
                {/* Navigation */}
                <div className="mb-6 flex gap-3 justify-between items-center">
                    <div className="flex gap-3">
                        <Link
                            href="/"
                            className="bg-card hover:bg-accent text-card-foreground px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-border"
                        >
                            ← Inicio
                        </Link>
                        <Link
                            href="/accounts"
                            className="bg-card hover:bg-accent text-card-foreground px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-border"
                        >
                            📊 Mis Cuentas
                        </Link>
                    </div>
                    <ThemeSwitcher />
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">Resúmenes</h1>
                    <p className="text-muted-foreground">Visualiza los resúmenes mensuales de tus tarjetas de crédito y préstamos</p>
                </div>

                {/* Product Selector */}
                <div className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
                    <label className="block text-sm font-medium text-card-foreground mb-3">
                        Seleccionar Producto
                    </label>
                    <div className="flex gap-4 items-center">
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="flex-1 p-3 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                            <option value="">Seleccionar...</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.type === 'CREDIT_CARD' ? '💳' : '📊'} {product.name} ({product.currency})
                                </option>
                            ))}
                        </select>
                        {selectedProductId && (
                            <button
                                onClick={handleGenerateSummary}
                                disabled={isLoading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm"
                            >
                                {isLoading ? 'Generando...' : 'Generar Todos los Resúmenes'}
                            </button>
                        )}
                    </div>
                    {selectedProduct && selectedProduct.closingDay && selectedProduct.dueDay && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Cierre día {selectedProduct.closingDay} · Vencimiento día {selectedProduct.dueDay}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
                        {error}
                    </div>
                )}

                {/* Summaries List */}
                {selectedProductId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: List of summaries */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-card-foreground mb-4">Historial de Resúmenes</h2>
                            {isLoading && !selectedSummary ? (
                                <p className="text-muted-foreground">Cargando...</p>
                            ) : summaries.length === 0 ? (
                                <p className="text-muted-foreground">No hay resúmenes disponibles. Genera uno para empezar.</p>
                            ) : (
                                <div className="space-y-3">
                                    {summaries.map((summary) => (
                                        <div
                                            key={summary.id}
                                            onClick={() => loadSummaryDetail(summary)}
                                            className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedSummary?.id === summary.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50 hover:bg-accent'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">
                                                        {MONTH_NAMES[summary.month - 1]} {summary.year}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {summary.isClosed ? '✅ Cerrado' : '⏳ Parcial'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-foreground">
                                                        {formatCurrency(Number(summary.totalAmount), selectedProduct?.currency || 'ARS')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Vence: {formatDate(summary.dueDate)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Summary detail */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-card-foreground mb-4">Detalle del Resumen</h2>
                            {!selectedSummary ? (
                                <p className="text-muted-foreground">Selecciona un resumen para ver los detalles</p>
                            ) : isLoading && selectedSummary ? (
                                <p className="text-muted-foreground">Cargando detalle...</p>
                            ) : summaryDetail ? (
                                <div>
                                    <div className="mb-4 p-4 bg-muted rounded-xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-muted-foreground">Período</span>
                                            <span className="text-sm text-foreground">
                                                {formatDate(summaryDetail.periodStart)} - {formatDate(summaryDetail.periodEnd)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</span>
                                            <span className="text-sm text-foreground">{formatDate(summaryDetail.dueDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-muted-foreground">Estado</span>
                                            <span className={`text-sm font-medium ${selectedSummary.isClosed ? 'text-success' : 'text-primary'}`}>
                                                {selectedSummary.isClosed ? 'Definitivo' : 'Parcial (hasta cierre)'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-semibold text-foreground mb-3">Transacciones ({summaryDetail.transactions.length})</h3>
                                        {summaryDetail.transactions.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No hay transacciones en este período</p>
                                        ) : (
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {summaryDetail.transactions.map((transaction: any) => (
                                                    <div
                                                        key={transaction.id}
                                                        className="p-3 border border-border rounded-xl bg-background"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium text-foreground">{transaction.description}</p>
                                                                <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                                                            </div>
                                                            <p className="font-semibold text-foreground">
                                                                {formatCurrency(Number(transaction.amount), selectedProduct?.currency || 'ARS')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-bold text-foreground">Total a Pagar</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {formatCurrency(Number(selectedSummary.totalAmount), selectedProduct?.currency || 'ARS')}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleOpenPaymentModal}
                                            disabled={isPaymentLoading}
                                            className="w-full bg-success hover:bg-success/90 text-success-foreground py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            💳 Pagar Resumen
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {!selectedProductId && (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg">
                            Selecciona un producto para ver sus resúmenes
                        </p>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-card-foreground">Pagar Resumen</h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                                <p className="text-sm text-muted-foreground mb-1">Resumen a pagar:</p>
                                <p className="text-lg font-bold text-foreground">
                                    {MONTH_NAMES[selectedSummary.month - 1]} {selectedSummary.year}
                                </p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(Number(selectedSummary.totalAmount), selectedProduct?.currency || 'ARS')}
                                </p>
                            </div>

                            {paymentAccounts.length === 0 ? (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm mb-4">
                                    No tienes cuentas con saldo suficiente para pagar este resumen.
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-card-foreground mb-2">
                                            Cuenta de pago
                                        </label>
                                        <select
                                            value={selectedPaymentAccount}
                                            onChange={(e) => setSelectedPaymentAccount(e.target.value)}
                                            className="w-full p-3 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-success focus:border-transparent transition-all"
                                        >
                                            <option value="">Seleccionar cuenta...</option>
                                            {paymentAccounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name} ({account.currency}) - Disponible: {formatCurrency(account.balance, account.currency)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Extra Charges Section */}
                                    <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-foreground">Gastos Adicionales</h4>
                                            <button
                                                onClick={addExtraCharge}
                                                className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                + Agregar Gasto
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            Agrega intereses, comisiones o impuestos que no estén en el resumen
                                        </p>

                                        {extraCharges.length > 0 && (
                                            <div className="space-y-3">
                                                {extraCharges.map((charge) => (
                                                    <div key={charge.id} className="p-3 bg-background rounded-lg border border-border">
                                                        <div className="grid grid-cols-12 gap-2">
                                                            <div className="col-span-5">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Descripción (ej: Intereses)"
                                                                    value={charge.description}
                                                                    onChange={(e) => updateExtraCharge(charge.id, 'description', e.target.value)}
                                                                    className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Monto"
                                                                    step="0.01"
                                                                    value={charge.amount}
                                                                    onChange={(e) => updateExtraCharge(charge.id, 'amount', e.target.value)}
                                                                    className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <select
                                                                    value={charge.category}
                                                                    onChange={(e) => updateExtraCharge(charge.id, 'category', e.target.value)}
                                                                    className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                                >
                                                                    <option value="">Categoría</option>
                                                                    <option value="INTEREST">Intereses</option>
                                                                    <option value="FEE">Comisión</option>
                                                                    <option value="TAX">Impuestos</option>
                                                                    <option value="OTHER">Otro</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-span-1 flex items-center">
                                                                <button
                                                                    onClick={() => removeExtraCharge(charge.id)}
                                                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Categorization Sections */}
                                    {(uncategorizedTransactions.length > 0 || unexplainedAmount > 0) && (
                                        <div className="mb-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                                            <div className="flex items-start gap-2 mb-3">
                                                <span className="text-xl">⚠️</span>
                                                <div>
                                                    <h4 className="font-semibold text-destructive">Categorización Requerida</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Debes categorizar todos los gastos antes de pagar
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Uncategorized Transactions */}
                                            {uncategorizedTransactions.length > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="font-medium text-foreground mb-2">
                                                        Transacciones sin categoría ({uncategorizedTransactions.length})
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {uncategorizedTransactions.map((tx) => (
                                                            <div key={tx.id} className="p-3 bg-background rounded-lg border border-border">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <p className="font-medium text-sm">{tx.description}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {formatDate(tx.date)} • {formatCurrency(tx.amount, selectedProduct?.currency || 'ARS')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <select
                                                                    value={transactionCategories.get(tx.id) || ''}
                                                                    onChange={(e) => setTransactionCategory(tx.id, e.target.value)}
                                                                    className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                                >
                                                                    <option value="">Seleccionar categoría...</option>
                                                                    {categories.map(cat => (
                                                                        <option key={cat.id} value={cat.id}>
                                                                            {cat.icon} {cat.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unexplained Balance */}
                                            {unexplainedAmount > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="font-medium text-foreground mb-2">
                                                        Saldo sin explicar
                                                    </h5>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        Hay ${unexplainedAmount.toFixed(2)} en el resumen que no corresponde a transacciones registradas
                                                    </p>
                                                    <div className="p-3 bg-background rounded-lg border border-border space-y-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Descripción del gasto"
                                                            value={unexplainedCategory?.description || ''}
                                                            onChange={(e) => setUnexplainedCategory(prev => ({
                                                                ...prev,
                                                                description: e.target.value,
                                                                categoryId: prev?.categoryId || ''
                                                            }))}
                                                            className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                        />
                                                        <select
                                                            value={unexplainedCategory?.categoryId || ''}
                                                            onChange={(e) => setUnexplainedCategory(prev => ({
                                                                description: prev?.description || '',
                                                                categoryId: e.target.value
                                                            }))}
                                                            className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">Seleccionar categoría...</option>
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.id}>
                                                                    {cat.icon} {cat.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Total with extras */}
                                    {extraCharges.length > 0 && (
                                        <div className="mb-4 p-4 bg-success/10 rounded-xl border border-success/20">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-foreground">Total a Pagar (con extras):</span>
                                                <span className="text-2xl font-bold text-success">
                                                    {formatCurrency(getTotalWithExtras(), selectedProduct?.currency || 'ARS')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowPaymentModal(false)}
                                            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-xl font-medium transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handlePaySummary}
                                            disabled={!selectedPaymentAccount || isPaymentLoading || !canPay()}
                                            className="flex-1 bg-success hover:bg-success/90 text-success-foreground py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                                        >
                                            {isPaymentLoading ? 'Procesando...' : 'Confirmar Pago'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {showReceiptModal && receiptData && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-card border border-border rounded-2xl max-w-md w-full p-8 relative shadow-xl">
                            {/* Close button */}
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ✕
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-3">✅</div>
                                <h2 className="text-2xl font-bold text-success mb-1">¡Pago Exitoso!</h2>
                                <p className="text-muted-foreground text-sm">Tu pago ha sido procesado correctamente</p>
                            </div>

                            {/* Ticket */}
                            <div className="border-2 border-dashed border-border rounded-xl p-6 mb-6 bg-muted/50">
                                {/* Transaction ID */}
                                <div className="text-center mb-4 pb-4 border-b border-dashed border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Comprobante de Pago</p>
                                    <p className="text-xs text-muted-foreground">
                                        {receiptData.date.toLocaleDateString('es-AR')} • {receiptData.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Resumen Pagado</p>
                                        <p className="font-semibold text-foreground">
                                            {receiptData.summaryMonth} {receiptData.summaryYear}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{receiptData.productName}</p>
                                    </div>

                                    <div className="pt-3 border-t border-dashed border-border">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Pagado Desde</p>
                                        <p className="font-medium text-foreground">{receiptData.paymentAccountName}</p>
                                    </div>

                                    <div className="pt-3 border-t border-dashed border-border">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Monto</p>
                                        <p className="text-3xl font-bold text-success">
                                            {formatCurrency(receiptData.amount, receiptData.currency)}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-4 pt-4 border-t border-dashed border-border text-center">
                                    <p className="text-xs text-muted-foreground">
                                        El saldo de tu {receiptData.productName} ha sido restaurado
                                    </p>
                                </div>
                            </div>

                            {/* Action button */}
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="w-full bg-success hover:bg-success/90 text-success-foreground py-3 rounded-xl font-medium transition-all shadow-sm"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
