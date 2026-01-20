'use client'

import { useState, useEffect } from 'react';
import { formatNumber } from '@/src/utils/validations';
import { paySummary } from '@/src/actions/summaries/summary-actions';

interface PaySummaryModalProps {
    summary: {
        id: string;
        year: number;
        month: number;
        totalAmount: number;
        product?: {
            id: string;
            name: string;
            institutionId?: string | null;
        };
    };
    availableAccounts: {
        id: string;
        name: string;
        balance: number;
        currency: string;
        type: string;
        institutionId?: string | null;
    }[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PaySummaryModal({
    summary,
    availableAccounts,
    isOpen,
    onClose,
    onSuccess
}: PaySummaryModalProps) {
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter accounts: same institution, liquidity products with sufficient balance
    const productInstitutionId = summary.product?.institutionId;
    const eligibleAccounts = availableAccounts.filter(acc =>
        acc.institutionId === productInstitutionId &&
        ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT'].includes(acc.type) &&
        acc.balance >= summary.totalAmount
    );

    // Also show accounts with insufficient balance for info
    const insufficientAccounts = availableAccounts.filter(acc =>
        acc.institutionId === productInstitutionId &&
        ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT'].includes(acc.type) &&
        acc.balance < summary.totalAmount
    );

    useEffect(() => {
        if (eligibleAccounts.length === 1) {
            setSelectedAccountId(eligibleAccounts[0].id);
        }
    }, [eligibleAccounts]);

    if (!isOpen) return null;

    const handlePay = async () => {
        if (!selectedAccountId) {
            setError('Seleccione una cuenta de origen');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await paySummary(summary.id, selectedAccountId);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            setError(result.error || 'Error al pagar el resumen');
        }

        setIsSubmitting(false);
    };

    const selectedAccount = availableAccounts.find(a => a.id === selectedAccountId);
    const newBalance = selectedAccount ? selectedAccount.balance - summary.totalAmount : 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <h2 className="text-xl font-black">Pagar Resumen</h2>
                    <p className="text-blue-100 text-sm">
                        {summary.product?.name ?? 'Tarjeta de Crédito'} • {MONTH_NAMES[summary.month - 1]} {summary.year}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount to pay */}
                    <div className="text-center py-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monto a Pagar</p>
                        <p className="text-4xl font-black text-slate-900">$ {formatNumber(summary.totalAmount, 0)}</p>
                    </div>

                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Account Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                            Debitar de
                        </label>

                        {eligibleAccounts.length > 0 ? (
                            <div className="space-y-2">
                                {eligibleAccounts.map(acc => (
                                    <button
                                        key={acc.id}
                                        onClick={() => setSelectedAccountId(acc.id)}
                                        className={`
                                            w-full p-4 rounded-xl border-2 text-left transition-all
                                            ${selectedAccountId === acc.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center
                                                    ${selectedAccountId === acc.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}
                                                `}>
                                                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{acc.name}</p>
                                                    <p className="text-xs text-slate-500">Saldo disponible</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600">$ {formatNumber(acc.balance, 0)}</p>
                                                {selectedAccountId === acc.id && (
                                                    <span className="material-symbols-outlined text-blue-500 text-[20px]">check_circle</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl">
                                <span className="material-symbols-outlined text-4xl mb-2">account_balance_wallet</span>
                                <p className="text-sm font-medium">No hay cuentas con saldo suficiente</p>
                                <p className="text-xs mt-1">Necesita $ {formatNumber(summary.totalAmount, 0)} disponibles</p>
                            </div>
                        )}

                        {insufficientAccounts.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-slate-400 mb-2">Saldo insuficiente:</p>
                                <div className="space-y-2 opacity-50">
                                    {insufficientAccounts.map(acc => (
                                        <div
                                            key={acc.id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                                        >
                                            <span className="text-sm text-slate-500">{acc.name}</span>
                                            <span className="text-sm text-rose-500 font-medium">$ {formatNumber(acc.balance, 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {selectedAccount && (
                        <div className="p-4 rounded-xl bg-slate-900 text-white">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resultado del pago</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Saldo actual</span>
                                    <span className="font-semibold">$ {formatNumber(selectedAccount.balance, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-rose-400">
                                    <span>- Pago resumen</span>
                                    <span className="font-semibold">$ {formatNumber(summary.totalAmount, 0)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-2 flex justify-between text-sm">
                                    <span className="text-slate-400">Nuevo saldo</span>
                                    <span className={`font-bold ${newBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        $ {formatNumber(newBalance, 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePay}
                        disabled={!selectedAccountId || isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSubmitting ? 'Procesando...' : `Confirmar Pago`}
                    </button>
                </div>
            </div>
        </>
    );
}
