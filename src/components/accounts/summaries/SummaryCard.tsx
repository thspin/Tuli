'use client'

import { useState } from 'react';
import { formatDate } from '@/src/utils/date';
import { formatNumber } from '@/src/utils/validations';

interface SummaryCardProps {
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
        paidDate?: Date | string | null;
    };
    productName: string;
    onViewDetails: (summaryId: string) => void;
    onPaySummary?: (summaryId: string) => void;
}

const STATUS_LABELS = {
    DRAFT: 'En construcción',
    CLOSED: 'Pendiente de pago',
    PAID: 'Pagado'
};

const STATUS_COLORS = {
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    CLOSED: 'bg-rose-100 text-rose-700 border-rose-200',
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function SummaryCard({ summary, productName, onViewDetails, onPaySummary }: SummaryCardProps) {
    const dueDate = new Date(summary.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const isOverdue = summary.status !== 'PAID' && daysUntilDue < 0;
    const isUrgent = summary.status !== 'PAID' && daysUntilDue >= 0 && daysUntilDue <= 5;

    return (
        <div className={`
            relative overflow-hidden rounded-2xl border transition-all duration-300
            ${summary.status === 'PAID'
                ? 'bg-slate-50/50 border-slate-100'
                : isOverdue
                    ? 'bg-rose-50/50 border-rose-200 shadow-rose-100/50'
                    : isUrgent
                        ? 'bg-amber-50/50 border-amber-200 shadow-amber-100/50'
                        : 'bg-white border-slate-100 hover:border-blue-200'}
            shadow-sm hover:shadow-md
        `}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold
                        ${summary.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-blue-100 text-blue-600'}
                    `}>
                        {summary.month}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{MONTH_NAMES[summary.month - 1]} {summary.year}</p>
                        <p className="text-xs text-slate-500">{productName}</p>
                    </div>
                </div>
                <span className={`
                    px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                    ${STATUS_COLORS[summary.status]}
                `}>
                    {STATUS_LABELS[summary.status]}
                </span>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {/* Total Amount */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total a Pagar</p>
                        <p className={`text-3xl font-black tracking-tight ${summary.status === 'PAID' ? 'text-slate-400' : 'text-slate-900'}`}>
                            $ {formatNumber(summary.totalAmount, 0)}
                        </p>
                    </div>

                    {summary.status !== 'PAID' && (
                        <div className={`
                            text-right px-3 py-2 rounded-xl text-xs font-bold
                            ${isOverdue
                                ? 'bg-rose-100 text-rose-700'
                                : isUrgent
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'}
                        `}>
                            {isOverdue ? (
                                <span>Vencido hace {Math.abs(daysUntilDue)} días</span>
                            ) : daysUntilDue === 0 ? (
                                <span>Vence hoy</span>
                            ) : (
                                <span>Vence en {daysUntilDue} días</span>
                            )}
                        </div>
                    )}

                    {summary.status === 'PAID' && summary.paidDate && (
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pagado el</p>
                            <p className="text-sm font-bold text-emerald-600">
                                {formatDate(new Date(summary.paidDate), { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Breakdown */}
                {summary.adjustmentsAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-dashed border-slate-100 pt-3">
                        <span>Compras + Cuotas</span>
                        <span className="font-semibold">$ {formatNumber(summary.calculatedAmount, 0)}</span>
                    </div>
                )}
                {summary.adjustmentsAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Comisiones + Impuestos</span>
                        <span className="font-semibold text-amber-600">+ $ {formatNumber(summary.adjustmentsAmount, 0)}</span>
                    </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        <span>Cierre: {formatDate(new Date(summary.closingDate), { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>Vence: {formatDate(dueDate, { day: 'numeric', month: 'short' })}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-slate-50 flex items-center gap-2">
                <button
                    onClick={() => onViewDetails(summary.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    Ver Detalle
                </button>

                {summary.status !== 'PAID' && onPaySummary && (
                    <button
                        onClick={() => onPaySummary(summary.id)}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                    >
                        Pagar Resumen
                    </button>
                )}
            </div>
        </div>
    );
}
