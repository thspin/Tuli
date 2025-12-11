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
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Boleta - ${bill.service.name}`}>
            <form action={handleSubmit} className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground mb-4">
                    <p>Período: <b className="capitalize">
                        {new Date(bill.year, bill.month - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                    </b></p>
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
                    <div className="w-full">
                        <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                        <select
                            name="status"
                            className="w-full p-3 border border-border rounded-xl bg-background text-foreground"
                            defaultValue={bill.status}
                        >
                            <option value="PENDING">Pendiente</option>
                            <option value="SKIPPED">Saltado</option>
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
