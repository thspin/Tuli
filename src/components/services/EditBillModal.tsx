'use client'

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { updateBillFromForm } from '@/src/actions/services/service-actions';

interface EditBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
    onSuccess: () => void;
}

export default function EditBillModal({ isOpen, onClose, bill, onSuccess }: EditBillModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const formatDateForInput = (date: string | Date) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);

        const res = await updateBillFromForm(bill.id, formData);

        if (res.success) {
            setIsLoading(false);
            onSuccess();
        } else {
            alert(res.error);
            setIsLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Boleta - ${bill.service.name}`} size="sm">
            <form action={handleSubmit} className="space-y-4">
                {/* Period Info - Glass Style */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                    <p className="text-sm text-white/70">
                        Período: <b className="capitalize text-white">
                            {new Date(bill.year, bill.month - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                        </b>
                    </p>
                </div>

                <Input
                    name="amount"
                    label="Monto"
                    type="number"
                    step="0.01"
                    defaultValue={bill.amount}
                    required
                />

                <Input
                    name="dueDate"
                    label="Fecha de Vencimiento"
                    type="date"
                    defaultValue={formatDateForInput(bill.dueDate)}
                    required
                />

                {bill.status !== 'PAID' && (
                    <div className="w-full space-y-2">
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest ml-1">Estado</label>
                        <select
                            name="status"
                            className="w-full glass-input text-white"
                            defaultValue={bill.status}
                        >
                            <option value="PENDING" className="bg-slate-800">Pendiente</option>
                            <option value="SKIPPED" className="bg-slate-800">Saltado</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={isLoading}>Guardar Cambios</Button>
                </div>
            </form>
        </Modal>
    );
}
