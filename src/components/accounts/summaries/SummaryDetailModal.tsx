'use client'

import { useState, useEffect } from 'react';
import { formatDate } from '@/src/utils/date';
import { formatNumber } from '@/src/utils/validations';
import { addSummaryAdjustment, deleteSummaryAdjustment, closeSummary, updateSummaryDates, resetSummary } from '@/src/actions/summaries/summary-actions';

interface SummaryItem {
    id: string;
    amount: number;
    isReconciled: boolean;
    hasDiscrepancy: boolean;
    note?: string | null;
    transaction: {
        id: string;
        description: string;
        date: Date | string;
        amount: number;
        installmentNumber?: number | null;
        installmentTotal?: number | null;
        category?: {
            name: string;
            icon?: string | null;
        } | null;
    };
}

interface SummaryAdjustment {
    id: string;
    type: 'COMMISSION' | 'TAX' | 'INTEREST' | 'INSURANCE' | 'CREDIT' | 'OTHER';
    description: string;
    amount: number;
    createdAt: Date | string;
}

interface SummaryDetailModalProps {
    summary: {
        id: string;
        year: number;
        month: number;
        closingDate: Date | string;
        dueDate: Date | string;
        calculatedAmount: number;
        adjustmentsAmount: number;
        totalAmount: number;
        status: 'DRAFT' | 'CLOSED' | 'PAID';
        items: SummaryItem[];
        adjustments: SummaryAdjustment[];
        product?: {
            name: string;
            institution?: { name: string } | null;
        };
    };
    isOpen: boolean;
    onClose: () => void;
    onPaySummary?: () => void;
    onRefresh: () => void;
}

const ADJUSTMENT_TYPE_LABELS = {
    COMMISSION: 'Comisión',
    TAX: 'Impuesto',
    INTEREST: 'Interés',
    INSURANCE: 'Seguro',
    CREDIT: 'A favor',
    OTHER: 'Otro'
};

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function SummaryDetailModal({
    summary,
    isOpen,
    onClose,
    onPaySummary,
    onRefresh
}: SummaryDetailModalProps) {
    const [showAddAdjustment, setShowAddAdjustment] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<'COMMISSION' | 'TAX' | 'INTEREST' | 'INSURANCE' | 'CREDIT' | 'OTHER'>('COMMISSION');
    const [adjustmentDescription, setAdjustmentDescription] = useState('');
    const [adjustmentAmount, setAdjustmentAmount] = useState('');

    // Date editing states
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [newClosingDate, setNewClosingDate] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAddAdjustment = async () => {
        if (!adjustmentDescription.trim() || !adjustmentAmount) {
            setError('Complete todos los campos');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await addSummaryAdjustment(summary.id, {
            type: adjustmentType as any,
            description: adjustmentDescription,
            amount: parseFloat(adjustmentAmount)
        });

        if (result.success) {
            setShowAddAdjustment(false);
            setAdjustmentDescription('');
            setAdjustmentAmount('');
            onRefresh();
        } else {
            setError(result.error || 'Error al agregar ajuste');
        }

        setIsSubmitting(false);
    };

    const handleDeleteAdjustment = async (adjustmentId: string) => {
        if (!confirm('¿Eliminar este ajuste?')) return;

        setIsSubmitting(true);
        setError(null);

        const result = await deleteSummaryAdjustment(adjustmentId);

        if (result.success) {
            // Refresh the summary data
            onRefresh();
        } else {
            setError(result.error || 'Error al eliminar ajuste');
        }

        setIsSubmitting(false);
    };

    const handleCloseSummary = async () => {
        if (!confirm('¿Cerrar el resumen? No podrá agregar más ajustes después de cerrarlo.')) return;

        setIsSubmitting(true);
        const result = await closeSummary(summary.id);

        if (result.success) {
            onRefresh();
        } else {
            setError(result.error || 'Error al cerrar resumen');
        }

        setIsSubmitting(false);
    };

    const handleResetSummary = async () => {
        if (!confirm('¿Estás seguro de que quieres limpiar todos los datos de este resumen? Se borrarán todos los ajustes y movimientos vinculados para que puedas volver a importarlo.')) return;

        setIsSubmitting(true);
        const result = await resetSummary(summary.id);

        if (result.success) {
            onRefresh();
        } else {
            setError(result.error || 'Error al resetear resumen');
        }
        setIsSubmitting(false);
    };

    const handleUpdateDates = async () => {
        if (!newClosingDate || !newDueDate) return;

        setIsSubmitting(true);
        const result = await updateSummaryDates(summary.id, newClosingDate, newDueDate);

        if (result.success) {
            setIsEditingDates(false);
            onRefresh();
        } else {
            setError(result.error || 'Error al actualizar fechas');
        }
        setIsSubmitting(false);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Resumen {MONTH_NAMES[summary.month - 1]} {summary.year}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {summary.product?.name ?? 'Tarjeta de Crédito'} • {summary.product?.institution?.name ?? ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 opacity-80">Total a Pagar</p>
                            <p className="text-4xl font-black tracking-tight">$ {formatNumber(summary.totalAmount, 2)}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex items-center gap-2 text-xs text-blue-100">
                                <span>Compras + Cuotas:</span>
                                <span className="font-bold">$ {formatNumber(summary.calculatedAmount, 2)}</span>
                            </div>
                            {/* Calculation of breakdowns for better visualization */}
                            {(() => {
                                const interestAdjustments = summary.adjustments.filter(a => a.type === 'INTEREST');
                                const creditAdjustments = summary.adjustments.filter(a => a.type === 'CREDIT');
                                const otherAdjustments = summary.adjustments.filter(a => a.type !== 'INTEREST' && a.type !== 'CREDIT');

                                const interestsAmount = interestAdjustments.reduce((sum, a) => sum + Number(a.amount), 0);
                                const creditsAmount = creditAdjustments.reduce((sum, a) => sum + Number(a.amount), 0);
                                const othersAmount = otherAdjustments.reduce((sum, a) => sum + Number(a.amount), 0);

                                return (
                                    <>
                                        {othersAmount > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-blue-100">
                                                <span>Impuestos / Otros:</span>
                                                <span className="font-bold">$ {formatNumber(othersAmount, 2)}</span>
                                            </div>
                                        )}
                                        {interestsAmount > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-blue-100">
                                                <span>Intereses:</span>
                                                <span className="font-bold text-amber-200">$ {formatNumber(interestsAmount, 2)}</span>
                                            </div>
                                        )}
                                        {creditsAmount !== 0 && (
                                            <div className="flex items-center gap-2 text-xs text-emerald-100 italic">
                                                <span>A favor:</span>
                                                <span className="font-bold">- $ {formatNumber(Math.abs(creditsAmount), 2)}</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-blue-600">receipt_long</span>
                                Movimientos ({summary.items.length})
                            </h3>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {summary.items.map(item => (
                                <div
                                    key={item.id}
                                    className={`
                                        flex items-center justify-between p-3 rounded-xl border transition-colors
                                        ${item.hasDiscrepancy
                                            ? 'bg-amber-50 border-amber-200'
                                            : item.isReconciled
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-slate-50 border-slate-100'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{item.transaction.category?.icon || '💳'}</span>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{item.transaction.description}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatDate(new Date(item.transaction.date), { day: 'numeric', month: 'short' })}
                                                {item.transaction.installmentTotal && (
                                                    <span className="ml-2 text-blue-600">
                                                        Cuota {item.transaction.installmentNumber}/{item.transaction.installmentTotal}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-slate-900">$ {formatNumber(item.amount, 2)}</p>
                                </div>
                            ))}

                            {summary.items.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                    <p className="text-sm">No hay movimientos en este resumen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Adjustments */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-amber-600">tune</span>
                                    Ajustes e Intereses ({summary.adjustments.length})
                                </h3>
                                <div className="flex items-center gap-3 ml-7">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Otros: {summary.adjustments.filter(a => a.type !== 'INTEREST').length}
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-500 uppercase">
                                        Intereses: {summary.adjustments.filter(a => a.type === 'INTEREST').length}
                                    </span>
                                </div>
                            </div>

                            {summary.status === 'DRAFT' && (
                                <button
                                    onClick={() => setShowAddAdjustment(!showAddAdjustment)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    + Agregar Ajuste
                                </button>
                            )}
                        </div>

                        {/* Add Adjustment Form */}
                        {showAddAdjustment && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                                        <select
                                            value={adjustmentType}
                                            onChange={(e) => setAdjustmentType(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        >
                                            <option value="COMMISSION">Comisión</option>
                                            <option value="TAX">Impuesto / IVA</option>
                                            <option value="INTEREST">Interés</option>
                                            <option value="INSURANCE">Seguro</option>
                                            <option value="CREDIT">A favor (saldo positivo)</option>
                                            <option value="OTHER">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Monto</label>
                                        <input
                                            type="number"
                                            value={adjustmentAmount}
                                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={adjustmentDescription}
                                        onChange={(e) => setAdjustmentDescription(e.target.value)}
                                        placeholder="Ej: IVA servicios, Seguro de vida..."
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowAddAdjustment(false)}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddAdjustment}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Guardando...' : 'Agregar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {summary.adjustments.map(adj => (
                                <div
                                    key={adj.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${adj.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {adj.type === 'TAX' ? 'receipt' : adj.type === 'INTEREST' ? 'percent' : adj.type === 'CREDIT' ? 'account_balance_wallet' : 'payments'}
                                            </span>
                                        </span>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{adj.description}</p>
                                            <p className="text-xs text-slate-500">{ADJUSTMENT_TYPE_LABELS[adj.type]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold ${adj.type === 'CREDIT' ? 'text-emerald-600' : 'text-amber-700'}`}>
                                            {adj.type === 'CREDIT' ? '-' : '+'} $ {formatNumber(Math.abs(Number(adj.amount)), 2)}
                                        </p>
                                        {summary.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handleDeleteAdjustment(adj.id)}
                                                disabled={isSubmitting}
                                                className="w-7 h-7 rounded-lg hover:bg-rose-100 flex items-center justify-center text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {summary.adjustments.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-sm">
                                    Sin ajustes adicionales
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="text-xs text-slate-500">
                        {isEditingDates ? (
                            <div className="flex items-center gap-2">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cierre</label>
                                    <input
                                        type="date"
                                        value={newClosingDate}
                                        onChange={(e) => setNewClosingDate(e.target.value)}
                                        className="px-2 py-1 rounded border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Vencimiento</label>
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="px-2 py-1 rounded border border-slate-200 text-xs"
                                    />
                                </div>
                                <div className="flex items-end gap-1 h-full pb-0.5">
                                    <button
                                        onClick={handleUpdateDates}
                                        disabled={isSubmitting}
                                        className="w-7 h-7 rounded bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                    </button>
                                    <button
                                        onClick={() => setIsEditingDates(false)}
                                        className="w-7 h-7 rounded bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <span>
                                    Cierre: {formatDate(new Date(summary.closingDate), { day: 'numeric', month: 'long' })} •
                                    Vence: {formatDate(new Date(summary.dueDate), { day: 'numeric', month: 'long' })}
                                </span>
                                {summary.status !== 'PAID' && (
                                    <button
                                        onClick={() => {
                                            setNewClosingDate(new Date(summary.closingDate).toISOString().split('T')[0]);
                                            setNewDueDate(new Date(summary.dueDate).toISOString().split('T')[0]);
                                            setIsEditingDates(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-100"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        <span className="text-[11px] font-bold uppercase">Editar Fechas</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {summary.status === 'DRAFT' && (
                            <>
                                <button
                                    onClick={handleResetSummary}
                                    disabled={isSubmitting}
                                    title="Limpiar todos los ajustes y movimientos"
                                    className="p-2.5 rounded-xl text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                                </button>
                                <button
                                    onClick={handleCloseSummary}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    Cerrar Resumen
                                </button>
                            </>
                        )}

                        {summary.status !== 'PAID' && onPaySummary && (
                            <button
                                onClick={onPaySummary}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
                            >
                                Pagar $ {formatNumber(summary.totalAmount, 0)}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
