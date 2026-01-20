'use client'

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PayServiceModal from './PayServiceModal';
import AddBillModal from './AddBillModal';
import EditBillModal from './EditBillModal';
import { deleteBill } from '@/src/actions/services/service-actions';
import { formatDate } from '@/src/utils/date';
import { getServiceIcon } from '@/src/utils/service-icons';

interface BillsManagerProps {
    bills: any[];
    overdueBills?: any[];
    services: any[];
    onRefresh: () => void;
    currentDate: Date;
}

export default function BillsManager({ bills, overdueBills = [], services, onRefresh, currentDate }: BillsManagerProps) {
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<any | null>(null);
    const [deletingBill, setDeletingBill] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const pendingBills = bills.filter(b => b.status === 'PENDING');
    const paidBills = bills.filter(b => b.status === 'PAID');
    const skippedBills = bills.filter(b => b.status === 'SKIPPED');

    const totalOverdue = overdueBills.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPendingCurrent = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalToPay = totalOverdue + totalPendingCurrent;

    const totalPaid = paidBills.reduce((sum, b) => sum + Number(b.transaction?.amount || b.amount), 0);

    const handlePayClick = (bill: any) => {
        setSelectedBill(bill);
        setIsPayModalOpen(true);
    };

    const handleDeleteBill = async () => {
        if (!deletingBill) return;
        setIsDeleting(true);
        const res = await deleteBill(deletingBill.id);
        setIsDeleting(false);
        if (res.success) {
            setDeletingBill(null);
            onRefresh();
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards - Glass Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Total a Pagar</span>
                        <span className="text-3xl font-black text-white mt-2">
                            ${totalToPay.toLocaleString('es-AR')}
                        </span>
                        <div className="flex gap-2 mt-3 text-xs">
                            <span className={overdueBills.length > 0 ? "text-red-400 font-semibold" : "text-white/40"}>
                                {overdueBills.length > 0 ? `${overdueBills.length} vencidas` : "0 vencidas"}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-white/40">{pendingBills.length} del mes</span>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-5">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Pagado este Mes</span>
                        <span className="text-3xl font-black text-emerald-400 mt-2">
                            ${totalPaid.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs text-white/40 mt-3">{paidBills.length} facturas pagadas</span>
                    </div>
                </div>
                <div className="glass-card p-5">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Próximo Vencimiento</span>
                        {overdueBills.length > 0 ? (
                            <>
                                <span className="text-xl font-bold text-red-400 mt-2">
                                    ¡Vencido!
                                </span>
                                <span className="text-sm text-red-300 truncate mt-1">
                                    {overdueBills[0].service.name} ({formatDate(overdueBills[0].dueDate, { day: 'numeric', month: 'short' })})
                                </span>
                            </>
                        ) : pendingBills.length > 0 ? (
                            <>
                                <span className="text-xl font-bold text-white mt-2">
                                    {formatDate(pendingBills[0].dueDate, { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-sm text-white/60 truncate mt-1">{pendingBills[0].service.name}</span>
                            </>
                        ) : (
                            <span className="text-lg text-white/60 mt-2">¡Todo al día! 🎉</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white/80">Boletas del Mes</h2>
                <Button onClick={() => setIsAddModalOpen(true)} variant="primary" size="sm" icon={<span className="material-symbols-outlined text-[18px]">add</span>}>
                    Nueva Boleta
                </Button>
            </div>

            {/* Bills List */}
            <div className="grid grid-cols-1 gap-4">
                {overdueBills.length === 0 && pendingBills.length === 0 && paidBills.length === 0 && skippedBills.length === 0 ? (
                    <div className="glass-card p-8 text-center text-white/50">
                        No hay boletas para este mes ni deudas anteriores.
                    </div>
                ) : (
                    <>
                        {/* Overdue Bills Section */}
                        {overdueBills.length > 0 && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 mb-2">
                                <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">warning</span>
                                    Boletas Vencidas (Meses Anteriores)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {overdueBills.map(bill => (
                                        <BillCard
                                            key={bill.id}
                                            bill={bill}
                                            onPay={() => handlePayClick(bill)}
                                            onEdit={() => setEditingBill(bill)}
                                            onDelete={() => setDeletingBill(bill)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Bills */}
                        {pendingBills.length > 0 && (
                            <>
                                <h3 className="text-sm font-medium text-white/50 mt-2">Pendientes del Mes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pendingBills.map(bill => (
                                        <BillCard
                                            key={bill.id}
                                            bill={bill}
                                            onPay={() => handlePayClick(bill)}
                                            onEdit={() => setEditingBill(bill)}
                                            onDelete={() => setDeletingBill(bill)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Paid Bills */}
                        {paidBills.length > 0 && (
                            <>
                                <h3 className="text-sm font-medium text-white/50 mt-6">Pagadas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                                    {paidBills.map(bill => (
                                        <BillCard
                                            key={bill.id}
                                            bill={bill}
                                            isPaid
                                            onDelete={() => setDeletingBill(bill)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Skipped Bills */}
                        {skippedBills.length > 0 && (
                            <>
                                <h3 className="text-sm font-medium text-white/50 mt-6">Saltadas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                                    {skippedBills.map(bill => (
                                        <BillCard
                                            key={bill.id}
                                            bill={bill}
                                            isSkipped
                                            onEdit={() => setEditingBill(bill)}
                                            onDelete={() => setDeletingBill(bill)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Pay Modal */}
            {selectedBill && (
                <PayServiceModal
                    isOpen={isPayModalOpen}
                    onClose={() => { setIsPayModalOpen(false); setSelectedBill(null); }}
                    bill={selectedBill}
                    onSuccess={() => {
                        setIsPayModalOpen(false);
                        setSelectedBill(null);
                        onRefresh();
                    }}
                />
            )}

            {/* Add Bill Modal */}
            <AddBillModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                services={services}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    onRefresh();
                }}
            />

            {/* Edit Bill Modal */}
            {editingBill && (
                <EditBillModal
                    isOpen={!!editingBill}
                    onClose={() => setEditingBill(null)}
                    bill={editingBill}
                    onSuccess={() => {
                        setEditingBill(null);
                        onRefresh();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deletingBill}
                onClose={() => setDeletingBill(null)}
                title="Eliminar Boleta"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-white/80">
                        ¿Estás seguro de que querés eliminar la boleta de <b className="text-white">{deletingBill?.service?.name}</b>?
                    </p>
                    <p className="text-sm text-white/50">
                        Período: {deletingBill && new Date(deletingBill.year, deletingBill.month - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setDeletingBill(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleDeleteBill} loading={isDeleting}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

interface BillCardProps {
    bill: any;
    onPay?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isPaid?: boolean;
    isSkipped?: boolean;
}

function BillCard({ bill, onPay, onEdit, onDelete, isPaid = false, isSkipped = false }: BillCardProps) {
    const isOverdue = !isPaid && !isSkipped && new Date(bill.dueDate) < new Date();
    const dueDate = new Date(bill.dueDate);
    const icon = getServiceIcon(bill.service.name, bill.service.category?.icon);
    const isEmoji = icon && !/^[a-z0-9_]+$/.test(icon);

    return (
        <div className={`glass-card relative overflow-hidden transition-all hover:bg-white/20 group ${isPaid ? 'opacity-75' : isSkipped ? 'opacity-60' : ''
            }`}>
            {isOverdue && (
                <div className="absolute top-0 right-0 bg-red-500/20 text-red-300 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 border-l border-b border-red-500/30">
                    <span className="material-symbols-outlined text-[10px]">warning</span> VENCIDO
                </div>
            )}

            <div className="flex flex-col h-full relative z-0 p-1">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isPaid ? 'bg-emerald-500/20 text-emerald-400' :
                            isSkipped ? 'bg-white/10 text-white/40' :
                                'bg-blue-500/20 text-blue-400'
                        }`}>
                        {isEmoji ? (
                            <span>{icon}</span>
                        ) : (
                            <span className="material-symbols-outlined">{icon}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white leading-tight truncate pr-6 text-base">{bill.service.name}</h3>
                        <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-red-400' : 'text-white/50'}`}>
                            {isPaid ? 'Pagado el ' + formatDate(new Date(), { day: 'numeric', month: 'short' }) :
                                isSkipped ? 'Saltado' :
                                    `Vence el ${formatDate(dueDate)}`}
                        </p>
                    </div>
                </div>

                {/* Amount */}
                <div className="mt-auto mb-4">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Total</p>
                    <p className={`text-3xl font-black tracking-tight ${isPaid ? 'text-emerald-400' :
                            isSkipped ? 'text-white/40 line-through' :
                                'text-white'
                        }`}>
                        <span className="text-lg align-top font-bold mr-0.5">$</span>
                        {Number(bill.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    {/* Promo Warning */}
                    <div className="flex-1 min-w-0 mr-2">
                        {bill.service.renewalDate && !isPaid && !isSkipped && (
                            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg w-fit max-w-full border border-amber-500/20">
                                <span className="material-symbols-outlined text-[14px]">stars</span>
                                <span className="text-[10px] font-bold truncate">
                                    Promo vence: {formatDate(bill.service.renewalDate)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                        {!isPaid && !isSkipped && onPay && (
                            <button
                                onClick={onPay}
                                className={`
                                    px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95
                                    ${isOverdue
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30'}
                                `}
                            >
                                Pagar
                            </button>
                        )}

                        {/* Edit/Delete Overlay Actions - Visible on Hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all glass-card p-1">
                            {onEdit && !isPaid && (
                                <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-blue-400 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={onDelete} className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
