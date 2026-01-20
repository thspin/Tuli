'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
    Product,
    InstitutionWithProducts,
    ParsedStatement,
    ParsedTransaction,
    ParsedAdjustment,
    ReconciliationResult,
    ReconciliationItem,
} from '@/src/types';
import {
    parsePDFStatementAction,
    reconcileStatementAction,
    applyStatementImportAction,
} from '@/src/actions/summaries/pdf-import-actions';

interface UploadStatementModalProps {
    institution: InstitutionWithProducts;
    creditCards: Product[];
    onClose: () => void;
}

type Step = 'upload' | 'preview' | 'reconcile' | 'confirm' | 'success';

export default function UploadStatementModal({
    institution,
    creditCards,
    onClose,
}: UploadStatementModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);

    // Data from each step
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedStatement, setParsedStatement] = useState<ParsedStatement | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string>(
        creditCards.length === 1 ? creditCards[0].id : ''
    );
    const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
    const [confirmedItems, setConfirmedItems] = useState<Map<string, 'accept' | 'reject' | 'create_new'>>(new Map());
    const [importResult, setImportResult] = useState<{ message: string; createdTransactions: number; createdAdjustments: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setError(null);
        } else {
            setError('Por favor selecciona un archivo PDF.');
        }
    }, []);

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    // Step 1: Parse the PDF
    const handleParsePDF = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (password) {
                formData.append('password', password);
            }

            // Pass the institution ID or name if needed for validation
            const result = await parsePDFStatementAction(formData, institution.name);

            if (!result.success) {
                if (result.error?.includes('contraseña') || result.error?.includes('password')) {
                    setNeedsPassword(true);
                    setError(result.error);
                } else {
                    setError(result.error || 'Error al procesar el PDF');
                }
                return;
            }

            setParsedStatement(result.statement!);

            // UX Improvement: Auto-select card based on detected provider
            const detectedProvider = result.statement?.cardProvider;
            if (detectedProvider) {
                const matchingCards = creditCards.filter(c => c.provider === detectedProvider);
                if (matchingCards.length === 1) {
                    setSelectedProductId(matchingCards[0].id);
                }
            }

            setStep('preview');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reconcile with existing transactions
    const handleReconcile = async () => {
        if (!parsedStatement || !selectedProductId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await reconcileStatementAction(parsedStatement, selectedProductId);

            if (!result.success) {
                setError(result.error || 'Error al reconciliar');
                return;
            }

            setReconciliation(result.reconciliation!);

            // Auto-accept exact matches
            const autoConfirmed = new Map<string, 'accept' | 'reject' | 'create_new'>();
            for (const item of result.reconciliation!.transactions) {
                if (item.matchType === 'exact') {
                    autoConfirmed.set(item.matchedTransactionId || item.pdfTransaction.description, 'accept');
                }
            }
            setConfirmedItems(autoConfirmed);

            setStep('reconcile');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    // Exclusions and Modifications
    const [excludedTransactions, setExcludedTransactions] = useState<Set<number>>(new Set());
    const [excludedAdjustments, setExcludedAdjustments] = useState<Set<number>>(new Set());
    const [modifiedTransactions, setModifiedTransactions] = useState<Map<number, Partial<ParsedTransaction>>>(new Map());
    const [modifiedAdjustments, setModifiedAdjustments] = useState<Map<number, Partial<ParsedAdjustment>>>(new Map());

    // Step 3: Apply import
    const handleApplyImport = async () => {
        if (!reconciliation) return;

        setIsLoading(true);
        setError(null);

        try {
            // Create a modified copy of reconciliation based on user edits
            const finalReconciliation = {
                ...reconciliation,
                transactions: reconciliation.transactions
                    .filter((_, i) => !excludedTransactions.has(i))
                    .map((item, i) => {
                        const mods = modifiedTransactions.get(i);
                        if (!mods) return item;
                        return {
                            ...item,
                            pdfTransaction: { ...item.pdfTransaction, ...mods }
                        };
                    }),
                adjustments: reconciliation.adjustments
                    .filter((_, i) => !excludedAdjustments.has(i))
                    .map((item, i) => {
                        const mods = modifiedAdjustments.get(i);
                        if (!mods) return item;
                        return {
                            ...item,
                            pdfAdjustment: { ...item.pdfAdjustment, ...mods }
                        };
                    })
            };

            const confirmedArray = Array.from(confirmedItems.entries()).map(([id, action]) => ({
                transactionId: id,
                action,
            }));

            const result = await applyStatementImportAction(finalReconciliation as any, confirmedArray, true);

            if (!result.success) {
                setError(result.message);
                return;
            }

            setImportResult({
                message: result.message,
                createdTransactions: result.createdTransactions,
                createdAdjustments: result.createdAdjustments,
            });
            setStep('success');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    // UI Helpers for editing
    const handleEditTx = (index: number, description: string) => {
        setModifiedTransactions(prev => {
            const next = new Map(prev);
            next.set(index, { ...next.get(index), description });
            return next;
        });
    };

    const handleEditAdj = (index: number, description: string) => {
        setModifiedAdjustments(prev => {
            const next = new Map(prev);
            next.set(index, { ...next.get(index), description });
            return next;
        });
    };

    // Toggle item confirmation
    const toggleItemConfirmation = (item: ReconciliationItem, action: 'accept' | 'reject' | 'create_new') => {
        const key = item.matchedTransactionId || item.pdfTransaction.description;
        setConfirmedItems(prev => {
            const next = new Map(prev);
            if (next.get(key) === action) {
                next.delete(key);
            } else {
                next.set(key, action);
            }
            return next;
        });
    };

    // Format currency
    const formatMoney = (amount: number, currency: 'ARS' | 'USD' = 'ARS') => {
        return currency === 'USD'
            ? `U$S ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    };

    // Use portal to render outside of the account panel stacking context
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 mx-4">
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                            <span className="material-symbols-outlined text-white text-xl">description</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Subir Resumen</h2>
                            <p className="text-sm text-slate-500">{institution.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="shrink-0 px-6 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        {['upload', 'preview', 'reconcile', 'confirm'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                    ${step === s ? 'bg-blue-600 text-white' :
                                        ['upload', 'preview', 'reconcile', 'confirm'].indexOf(step) > i
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-500'}`}>
                                    {['upload', 'preview', 'reconcile', 'confirm'].indexOf(step) > i
                                        ? <span className="material-symbols-outlined text-[14px]">check</span>
                                        : i + 1}
                                </div>
                                {i < 3 && <div className={`w-8 h-0.5 mx-1 ${['upload', 'preview', 'reconcile', 'confirm'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* Drop Zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                                    ${selectedFile
                                        ? 'border-emerald-400 bg-emerald-50'
                                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-5xl text-emerald-500 mb-3">check_circle</span>
                                        <p className="font-bold text-slate-900">{selectedFile.name}</p>
                                        <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">cloud_upload</span>
                                        <p className="font-bold text-slate-600">Arrastra tu resumen PDF aquí</p>
                                        <p className="text-sm text-slate-400">o haz clic para seleccionar</p>
                                    </div>
                                )}
                            </div>

                            {/* Password Input */}
                            {needsPassword && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Contraseña del PDF
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Ingresa la contraseña..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Los PDFs de Banco Nación suelen tener contraseña (DNI)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && parsedStatement && (
                        <div className="space-y-6">
                            {/* Detected Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Institución</p>
                                    <p className="font-bold text-slate-900 capitalize">{parsedStatement.institution}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tarjeta</p>
                                    <p className="font-bold text-slate-900 uppercase">{parsedStatement.cardProvider}</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Cierre</p>
                                    <p className="font-bold text-blue-900">{formatDate(parsedStatement.closingDate)}</p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-xl">
                                    <p className="text-xs text-orange-600 uppercase tracking-wider mb-1">Vencimiento</p>
                                    <p className="font-bold text-orange-900">{formatDate(parsedStatement.dueDate)}</p>
                                </div>
                            </div>

                            {/* Amounts */}
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl">
                                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Total a Pagar</p>
                                <p className="text-2xl font-black text-slate-900">
                                    {formatMoney(parsedStatement.totalAmount)}
                                    {parsedStatement.totalAmountUSD && parsedStatement.totalAmountUSD > 0 && (
                                        <span className="text-lg ml-2 text-blue-600">
                                            + {formatMoney(parsedStatement.totalAmountUSD, 'USD')}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transacciones</p>
                                    <p className="font-bold text-slate-900">{parsedStatement.transactions.length}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ajustes</p>
                                    <p className="font-bold text-slate-900">{parsedStatement.adjustments.length}</p>
                                </div>
                            </div>

                            {/* Product Selection */}
                            {creditCards.length > 1 && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Selecciona la tarjeta
                                    </label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {creditCards.map(card => {
                                            const isMatch = parsedStatement.cardProvider === card.provider;
                                            return (
                                                <option key={card.id} value={card.id}>
                                                    {card.name} {card.lastFourDigits && `(****${card.lastFourDigits})`}
                                                    {isMatch ? ' (Recomendada✨)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Reconcile */}
                    {step === 'reconcile' && reconciliation && (
                        <div className="space-y-6">
                            {/* Warning if summary already exists */}
                            {!reconciliation.needsNewSummary && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <span className="material-symbols-outlined text-lg">warning</span>
                                        <span className="font-bold">Ya existe un resumen para este período</span>
                                    </div>
                                    <p className="text-sm text-amber-600 mt-1">
                                        El sistema actualizará los datos existentes y solo creará las transacciones faltantes.
                                        Las transacciones que ya coinciden no se duplicarán.
                                    </p>
                                </div>
                            )}

                            {/* Total Amount and Breakdown */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-blue-200 uppercase tracking-wider">Total a Pagar</p>
                                        <p className="text-2xl font-black">
                                            {formatMoney(reconciliation.statement.totalAmount)}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs space-y-0.5">
                                        <p>
                                            <span className="text-blue-200">Compras + Cuotas: </span>
                                            <span className="font-bold">
                                                {formatMoney(reconciliation.statement.transactions.filter(t => !t.isPayment).reduce((sum, t) => sum + t.amount, 0))}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="text-blue-200">Impuestos / Otros: </span>
                                            <span className="font-bold">
                                                {formatMoney(reconciliation.statement.adjustments.filter(a => a.type === 'TAX' || a.type === 'COMMISSION' || a.type === 'INSURANCE' || a.type === 'OTHER').reduce((sum, a) => sum + a.amount, 0))}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="text-blue-200">Intereses: </span>
                                            <span className="font-bold">
                                                {formatMoney(reconciliation.statement.adjustments.filter(a => a.type === 'INTEREST').reduce((sum, a) => sum + a.amount, 0))}
                                            </span>
                                        </p>
                                        {reconciliation.statement.adjustments.filter(a => a.type === 'CREDIT').reduce((sum, a) => sum + a.amount, 0) !== 0 && (
                                            <p>
                                                <span className="text-blue-200">Créditos: </span>
                                                <span className="font-bold text-emerald-300">
                                                    {formatMoney(reconciliation.statement.adjustments.filter(a => a.type === 'CREDIT').reduce((sum, a) => sum + a.amount, 0))}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Match Summary */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-emerald-600">{reconciliation.summary.exactMatches}</p>
                                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Exactos</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-yellow-600">{reconciliation.summary.partialMatches}</p>
                                    <p className="text-[10px] text-yellow-600 uppercase tracking-wider">Parciales</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-red-600">{reconciliation.summary.notFound}</p>
                                    <p className="text-[10px] text-red-600 uppercase tracking-wider">Nuevos</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-slate-600">{reconciliation.summary.totalDBTransactions}</p>
                                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">En Tuli</p>
                                </div>
                            </div>

                            {/* Transactions List */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Transacciones del Resumen
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                    {reconciliation.transactions.map((item, i) => {
                                        if (excludedTransactions.has(i)) return null;
                                        const mods = modifiedTransactions.get(i);
                                        const description = mods?.description ?? item.pdfTransaction.description;

                                        return (
                                            <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group">
                                                {/* Match Status Icon */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                                    ${item.matchType === 'exact' ? 'bg-emerald-100 text-emerald-600' :
                                                        item.matchType === 'partial' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-red-100 text-red-600'}`}>
                                                    <span className="material-symbols-outlined text-lg">
                                                        {item.matchType === 'exact' ? 'check' :
                                                            item.matchType === 'partial' ? 'help' : 'add'}
                                                    </span>
                                                </div>

                                                {/* Transaction Info */}
                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        className="w-full font-medium text-slate-900 truncate text-sm bg-transparent border-none p-0 focus:ring-0 focus:bg-white focus:outline-none"
                                                        value={description}
                                                        onChange={(e) => handleEditTx(i, e.target.value)}
                                                    />
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{formatDate(item.pdfTransaction.date)}</span>
                                                        {item.pdfTransaction.installmentCurrent && (
                                                            <span className="text-blue-500">
                                                                {item.pdfTransaction.installmentCurrent}/{item.pdfTransaction.installmentTotal}
                                                            </span>
                                                        )}
                                                        {item.pdfTransaction.isPlanZ && (
                                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-bold">
                                                                PLAN Z
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-slate-900">
                                                        {formatMoney(item.pdfTransaction.amount, item.pdfTransaction.currency)}
                                                    </p>
                                                </div>

                                                {/* Admin Buttons */}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {item.matchType === 'partial' && (
                                                        <>
                                                            <button
                                                                onClick={() => toggleItemConfirmation(item, 'accept')}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                                                                    ${confirmedItems.get(item.matchedTransactionId!) === 'accept'
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                                            >
                                                                <span className="material-symbols-outlined text-sm">check</span>
                                                            </button>
                                                            <button
                                                                onClick={() => toggleItemConfirmation(item, 'create_new')}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                                                                    ${confirmedItems.get(item.matchedTransactionId!) === 'create_new'
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                                                title="Crear como nueva"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">add</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setExcludedTransactions(prev => new Set(prev).add(i))}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Adjustments */}
                            {reconciliation.adjustments.length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Ajustes del Resumen ({reconciliation.adjustments.length})
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {reconciliation.adjustments.map((adj, i) => {
                                            if (excludedAdjustments.has(i)) return null;
                                            const mods = modifiedAdjustments.get(i);
                                            const description = mods?.description ?? adj.pdfAdjustment.description;

                                            return (
                                                <div key={i} className={`px-4 py-2 flex items-center justify-between group hover:bg-slate-50 transition-colors ${adj.alreadyExists ? 'bg-slate-50 opacity-60' : ''}`}>
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className={`material-symbols-outlined shrink-0 ${adj.alreadyExists ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {adj.alreadyExists ? 'check_circle' : 'receipt_long'}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <input
                                                                className="w-full text-sm text-slate-900 bg-transparent border-none p-0 focus:ring-0 focus:bg-white focus:outline-none"
                                                                value={description}
                                                                onChange={(e) => handleEditAdj(i, e.target.value)}
                                                            />
                                                            <p className="text-xs text-slate-400">
                                                                {adj.pdfAdjustment.type === 'TAX' ? 'Impuesto' :
                                                                    adj.pdfAdjustment.type === 'INTEREST' ? 'Interés' :
                                                                        adj.pdfAdjustment.type === 'COMMISSION' ? 'Comisión' :
                                                                            adj.pdfAdjustment.type === 'INSURANCE' ? 'Seguro' :
                                                                                adj.pdfAdjustment.type === 'CREDIT' ? 'Crédito a Favor' :
                                                                                    'Otro'}
                                                                {adj.alreadyExists && ' • Ya importado'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-bold shrink-0 ${adj.alreadyExists ? 'text-slate-400' : 'text-slate-900'}`}>
                                                            {formatMoney(adj.pdfAdjustment.amount)}
                                                        </span>
                                                        <button
                                                            onClick={() => setExcludedAdjustments(prev => new Set(prev).add(i))}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                            title="Excluir"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && importResult && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-emerald-600">check_circle</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">¡Importación Completa!</h3>
                            <p className="text-slate-500 mb-6">{importResult.message}</p>
                            <div className="flex justify-center gap-4">
                                <div className="px-4 py-2 bg-emerald-50 rounded-xl">
                                    <p className="text-2xl font-black text-emerald-600">{importResult.createdTransactions}</p>
                                    <p className="text-xs text-emerald-600">Transacciones creadas</p>
                                </div>
                                <div className="px-4 py-2 bg-blue-50 rounded-xl">
                                    <p className="text-2xl font-black text-blue-600">{importResult.createdAdjustments}</p>
                                    <p className="text-xs text-blue-600">Ajustes agregados</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                    {step !== 'success' && (
                        <button
                            onClick={() => {
                                if (step === 'upload') onClose();
                                else if (step === 'preview') setStep('upload');
                                else if (step === 'reconcile') setStep('preview');
                            }}
                            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                        >
                            {step === 'upload' ? 'Cancelar' : 'Atrás'}
                        </button>
                    )}

                    {step === 'upload' && (
                        <button
                            onClick={handleParsePDF}
                            disabled={!selectedFile || isLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl 
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    Procesar PDF
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    )}

                    {step === 'preview' && (
                        <button
                            onClick={handleReconcile}
                            disabled={!selectedProductId || isLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl 
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Reconciliando...
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    )}

                    {step === 'reconcile' && (
                        <button
                            onClick={handleApplyImport}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl 
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Aplicando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">check</span>
                                    Aplicar Importación
                                </>
                            )}
                        </button>
                    )}

                    {step === 'success' && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mx-auto"
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div >,
        document.body
    );
}
