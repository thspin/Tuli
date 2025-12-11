'use client'

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PayServiceModal from './PayServiceModal';
import AddBillModal from './AddBillModal';
import EditBillModal from './EditBillModal';
import { deleteBill } from '@/src/actions/services/service-actions';

interface BillsManagerProps {
    bills: any[];
    overdueBills?: any[]; // Optional to avoid breaking if not passed initially
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Total a Pagar</span>
                        <span className="text-3xl font-bold text-primary mt-1">
                            ${totalToPay.toLocaleString('es-AR')}
                        </span>
                        <div className="flex gap-2 mt-2 text-xs">
                            <span className={overdueBills.length > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                {overdueBills.length > 0 ? `${overdueBills.length} vencidas` : "0 vencidas"}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{pendingBills.length} del mes</span>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Pagado este Mes</span>
                        <span className="text-3xl font-bold text-success mt-1">
                            ${totalPaid.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs text-muted-foreground mt-2">{paidBills.length} facturas pagadas</span>
                    </div>
                </Card>
                <Card>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Próximo Vencimiento</span>
                        {overdueBills.length > 0 ? (
                            <>
                                <span className="text-xl font-bold text-destructive mt-1">
                                    ¡Vencido!
                                </span>
                                <span className="text-sm text-destructive truncate">
                                    {overdueBills[0].service.name} ({new Date(overdueBills[0].dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})
                                </span>
                            </>
                        ) : pendingBills.length > 0 ? (
                            <>
                                <span className="text-xl font-bold text-foreground mt-1">
                                    {new Date(pendingBills[0].dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-sm text-foreground truncate">{pendingBills[0].service.name}</span>
                            </>
                        ) : (
                            <span className="text-lg text-muted-foreground mt-2">¡Todo al día! 🎉</span>
                        )}
                    </div>
                </Card>
            </div>

            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">Boletas del Mes</h2>
                <Button onClick={() => setIsAddModalOpen(true)} icon={<span>+</span>} size="sm">
                    Nueva Boleta
                </Button>
            </div>

            {/* Bills List */}
            <div className="grid grid-cols-1 gap-4">
                {overdueBills.length === 0 && pendingBills.length === 0 && paidBills.length === 0 && skippedBills.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                        No hay boletas para este mes ni deudas anteriores.
                    </div>
                ) : (
                    <>
                        {/* Overdue Bills Section */}
                        {overdueBills.length > 0 && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 mb-2">
                                <h3 className="text-sm font-bold text-destructive mb-3 flex items-center gap-2">
                                    ⚠️ Boletas Vencidas (Meses Anteriores)
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
                                <h3 className="text-sm font-medium text-muted-foreground mt-2">Pendientes del Mes</h3>
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
                                <h3 className="text-sm font-medium text-muted-foreground mt-6">Pagadas</h3>
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
                                <h3 className="text-sm font-medium text-muted-foreground mt-6">Saltadas</h3>
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
            >
                <div className="space-y-4">
                    <p className="text-foreground">
                        ¿Estás seguro de que querés eliminar la boleta de <b>{deletingBill?.service?.name}</b>?
                    </p>
                    <p className="text-sm text-muted-foreground">
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

    return (
        <Card className={`relative overflow-hidden transition-all hover:shadow-md group ${isPaid ? 'bg-muted/50' :
            isSkipped ? 'bg-muted/30' :
                'bg-card'
            }`}>
            {isOverdue && (
                <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    VENCIDO
                </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar"
                    >
                        ✏️
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                )}
            </div>

            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                        {bill.service.category?.icon || '📄'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{bill.service.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            Vence: {dueDate.toLocaleDateString('es-AR')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                        {isPaid ? 'Monto pagado' : isSkipped ? 'Monto saltado' : 'Monto estimado'}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                        ${Number(bill.amount).toLocaleString('es-AR')}
                    </p>
                </div>
                {!isPaid && !isSkipped && onPay && (
                    <Button size="sm" onClick={onPay} variant={isOverdue ? 'danger' : 'primary'}>
                        Pagar
                    </Button>
                )}
                {isPaid && (
                    <span className="text-success font-medium text-sm flex items-center gap-1">
                        ✓ Pagado
                    </span>
                )}
                {isSkipped && (
                    <span className="text-muted-foreground font-medium text-sm flex items-center gap-1">
                        ⊘ Saltado
                    </span>
                )}
            </div>

            {bill.service.renewalDate && !isPaid && !isSkipped && (
                <div className="mt-3 pt-2 border-t border-border text-xs text-amber-600 flex items-center gap-1">
                    <span>⚠️ Promo vence: {new Date(bill.service.renewalDate).toLocaleDateString('es-AR')}</span>
                </div>
            )}
        </Card>
    );
}
