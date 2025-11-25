'use client'

import { useState, useEffect } from 'react';
import { generateAllSummaries, getProductSummaries, getSummaryDetail } from './actions';
import { payOffSummary, getPaymentAccounts } from './payment-actions';

interface Product {
    id: string;
    name: string;
    type: 'CREDIT_CARD' | 'LOAN';
    currency: string;
    closingDay?: number | null;
    dueDay?: number | null;
}

interface Summary {
    id: string;
    year: number;
    month: number;
    closingDate: Date;
    dueDate: Date;
    totalAmount: number;
    isClosed: boolean;
}

interface SummariesViewProps {
    products: Product[];
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
        try {
            const result = await getPaymentAccounts(Number(selectedSummary.totalAmount));
            if (result.success) {
                setPaymentAccounts(result.accounts || []);
                setShowPaymentModal(true);
                setSelectedPaymentAccount('');
            } else {
                setError(result.error || 'Error al cargar cuentas de pago');
            }
        } catch (err) {
            setError('Error al cargar cuentas de pago');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handlePaySummary = async () => {
        if (!selectedSummary || !selectedPaymentAccount) return;

        const paymentAccountData = paymentAccounts.find(a => a.id === selectedPaymentAccount);

        setIsPaymentLoading(true);
        setError(null);
        try {
            const result = await payOffSummary(selectedSummary.id, selectedPaymentAccount);
            if (result.success) {
                // Preparar datos del comprobante
                const receipt = {
                    date: new Date(),
                    summaryMonth: MONTH_NAMES[selectedSummary.month - 1],
                    summaryYear: selectedSummary.year,
                    amount: Number(selectedSummary.totalAmount),
                    currency: selectedProduct?.currency || 'ARS',
                    productName: selectedProduct?.name || '',
                    paymentAccountName: paymentAccountData?.name || '',
                    paymentAccountType: paymentAccountData?.type || '',
                };

                setReceiptData(receipt);
                setShowPaymentModal(false);
                setSelectedPaymentAccount('');
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-6xl mx-auto p-6">
                {/* Navigation */}
                <div className="mb-6 flex gap-3">
                    <a
                        href="/"
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-gray-200"
                    >
                        ← Inicio
                    </a>
                    <a
                        href="/accounts"
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm border border-gray-200"
                    >
                        📊 Mis Cuentas
                    </a>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Resúmenes</h1>
                    <p className="text-gray-600">Visualiza los resúmenes mensuales de tus tarjetas de crédito y préstamos</p>
                </div>

                {/* Product Selector */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Producto
                    </label>
                    <div className="flex gap-4 items-center">
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Generando...' : 'Generar Todos los Resúmenes'}
                            </button>
                        )}
                    </div>
                    {selectedProduct && selectedProduct.closingDay && selectedProduct.dueDay && (
                        <p className="mt-2 text-sm text-gray-500">
                            Cierre día {selectedProduct.closingDay} · Vencimiento día {selectedProduct.dueDay}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Summaries List */}
                {selectedProductId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: List of summaries */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Resúmenes</h2>
                            {isLoading && !selectedSummary ? (
                                <p className="text-gray-500">Cargando...</p>
                            ) : summaries.length === 0 ? (
                                <p className="text-gray-500">No hay resúmenes disponibles. Genera uno para empezar.</p>
                            ) : (
                                <div className="space-y-3">
                                    {summaries.map((summary) => (
                                        <div
                                            key={summary.id}
                                            onClick={() => loadSummaryDetail(summary)}
                                            className={`p-4 border rounded-lg cursor-pointer transition ${selectedSummary?.id === summary.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">
                                                        {MONTH_NAMES[summary.month - 1]} {summary.year}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {summary.isClosed ? '✅ Cerrado' : '⏳ Parcial'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-gray-800">
                                                        {formatCurrency(Number(summary.totalAmount), selectedProduct?.currency || 'ARS')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
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
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Detalle del Resumen</h2>
                            {!selectedSummary ? (
                                <p className="text-gray-500">Selecciona un resumen para ver los detalles</p>
                            ) : isLoading && selectedSummary ? (
                                <p className="text-gray-500">Cargando detalle...</p>
                            ) : summaryDetail ? (
                                <div>
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600">Período</span>
                                            <span className="text-sm text-gray-800">
                                                {formatDate(summaryDetail.periodStart)} - {formatDate(summaryDetail.periodEnd)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600">Fecha de Vencimiento</span>
                                            <span className="text-sm text-gray-800">{formatDate(summaryDetail.dueDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Estado</span>
                                            <span className={`text-sm font-medium ${selectedSummary.isClosed ? 'text-green-600' : 'text-orange-600'}`}>
                                                {selectedSummary.isClosed ? 'Definitivo' : 'Parcial (hasta cierre)'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-700 mb-3">Transacciones ({summaryDetail.transactions.length})</h3>
                                        {summaryDetail.transactions.length === 0 ? (
                                            <p className="text-sm text-gray-500">No hay transacciones en este período</p>
                                        ) : (
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {summaryDetail.transactions.map((transaction: any) => (
                                                    <div
                                                        key={transaction.id}
                                                        className="p-3 border border-gray-200 rounded-lg"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium text-gray-800">{transaction.description}</p>
                                                                <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                                                            </div>
                                                            <p className="font-semibold text-gray-800">
                                                                {formatCurrency(Number(transaction.amount), selectedProduct?.currency || 'ARS')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-bold text-gray-800">Total a Pagar</span>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(Number(selectedSummary.totalAmount), selectedProduct?.currency || 'ARS')}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleOpenPaymentModal}
                                            disabled={isPaymentLoading}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                        <p className="text-gray-500 text-lg">
                            Selecciona un producto para ver sus resúmenes
                        </p>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Pagar Resumen</h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">Resumen a pagar:</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {MONTH_NAMES[selectedSummary.month - 1]} {selectedSummary.year}
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(Number(selectedSummary.totalAmount), selectedProduct?.currency || 'ARS')}
                                </p>
                            </div>

                            {paymentAccounts.length === 0 ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm mb-4">
                                    No tienes cuentas con saldo suficiente para pagar este resumen.
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cuenta de pago
                                        </label>
                                        <select
                                            value={selectedPaymentAccount}
                                            onChange={(e) => setSelectedPaymentAccount(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="">Seleccionar cuenta...</option>
                                            {paymentAccounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name} ({account.currency}) - Disponible: {formatCurrency(account.balance, account.currency)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowPaymentModal(false)}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handlePaySummary}
                                            disabled={!selectedPaymentAccount || isPaymentLoading}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
                            {/* Close button */}
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-3">✅</div>
                                <h2 className="text-2xl font-bold text-green-600 mb-1">¡Pago Exitoso!</h2>
                                <p className="text-gray-600 text-sm">Tu pago ha sido procesado correctamente</p>
                            </div>

                            {/* Ticket */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6" style={{
                                background: 'repeating-linear-gradient(0deg, #ffffff, #ffffff 10px, #f9fafb 10px, #f9fafb 20px)'
                            }}>
                                {/* Transaction ID */}
                                <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-300">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Comprobante de Pago</p>
                                    <p className="text-xs text-gray-400">
                                        {receiptData.date.toLocaleDateString('es-AR')} • {receiptData.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Resumen Pagado</p>
                                        <p className="font-semibold text-gray-900">
                                            {receiptData.summaryMonth} {receiptData.summaryYear}
                                        </p>
                                        <p className="text-sm text-gray-600">{receiptData.productName}</p>
                                    </div>

                                    <div className="pt-3 border-t border-dashed border-gray-300">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pagado Desde</p>
                                        <p className="font-medium text-gray-900">{receiptData.paymentAccountName}</p>
                                    </div>

                                    <div className="pt-3 border-t border-dashed border-gray-300">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Monto</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {formatCurrency(receiptData.amount, receiptData.currency)}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-center">
                                    <p className="text-xs text-gray-400">
                                        El saldo de tu {receiptData.productName} ha sido restaurado
                                    </p>
                                </div>
                            </div>

                            {/* Action button */}
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
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
